import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { executeAgentAction, getSubscriberByStripeCustomerId, Subscriber } from './executor';

// Lazy initialization for admin client
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabaseAdmin;
}

export type AlertType = 'cancel_pending' | 'downgrade' | 'expiring_soon' | 'inactive';

export interface RetentionAlert {
  id: string;
  user_id: string;
  subscriber_id: string;
  alert_type: AlertType;
  status: 'active' | 'resolved' | 'churned';
  action_taken: string | null;
  created_at: string;
  resolved_at: string | null;
}

/**
 * Handle Stripe customer.subscription.updated webhook
 * Detects cancel_at_period_end or downgrades
 */
export async function handleSubscriptionUpdated(
  subscription: {
    id: string;
    customer: string;
    cancel_at_period_end: boolean;
    items: { data: Array<{ price: { unit_amount: number } }> };
  },
  previousAttributes: Record<string, unknown> | null,
  userId: string
): Promise<void> {
  const subscriber = await getSubscriberByStripeCustomerId(subscription.customer, userId);
  if (!subscriber) {
    console.error(`Subscriber not found for customer ${subscription.customer}`);
    return;
  }

  // Check for cancel_at_period_end change
  if (subscription.cancel_at_period_end && previousAttributes?.cancel_at_period_end === false) {
    await createRetentionAlert(userId, subscriber, 'cancel_pending');
  }

  // Check for downgrade (price decreased)
  const currentAmount = subscription.items.data[0]?.price?.unit_amount || 0;
  const previousAmount = (previousAttributes?.items as { data?: Array<{ price?: { unit_amount?: number } }> })?.data?.[0]?.price?.unit_amount || 0;

  if (currentAmount < previousAmount && previousAmount > 0) {
    await createRetentionAlert(userId, subscriber, 'downgrade');
  }
}

/**
 * Handle subscription cancellation (resolved as churned)
 */
export async function handleSubscriptionCanceled(
  subscription: { id: string; customer: string },
  userId: string
): Promise<void> {
  const subscriber = await getSubscriberByStripeCustomerId(subscription.customer, userId);
  if (!subscriber) return;

  // Mark active alerts as churned
  await getSupabaseAdmin()
    .from('retention_alert')
    .update({
      status: 'churned',
      resolved_at: new Date().toISOString()
    })
    .eq('subscriber_id', subscriber.id)
    .eq('status', 'active');

  // Create churn record for stats
  await getSupabaseAdmin().from('agent_action').insert({
    user_id: userId,
    agent_type: 'retention',
    action_type: 'subscriber_churned',
    subscriber_id: subscriber.id,
    description: `Client churne : ${subscriber.email}`,
    status: 'executed',
    executed_at: new Date().toISOString(),
    result: {
      mrr_lost: subscriber.mrr,
      plan_name: subscriber.plan_name
    }
  });
}

/**
 * Handle cancel_at_period_end being removed (customer decided to stay)
 */
export async function handleCancelationReverted(
  subscription: { id: string; customer: string },
  userId: string
): Promise<void> {
  const subscriber = await getSubscriberByStripeCustomerId(subscription.customer, userId);
  if (!subscriber) return;

  // Mark cancel_pending alerts as resolved
  const { data: alert } = await getSupabaseAdmin()
    .from('retention_alert')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString()
    })
    .eq('subscriber_id', subscriber.id)
    .eq('alert_type', 'cancel_pending')
    .eq('status', 'active')
    .select()
    .single();

  if (alert) {
    // Create retention success record
    await getSupabaseAdmin().from('agent_action').insert({
      user_id: userId,
      agent_type: 'retention',
      action_type: 'churn_avoided',
      subscriber_id: subscriber.id,
      description: `Churn evite : ${subscriber.email} a decide de rester`,
      status: 'executed',
      executed_at: new Date().toISOString(),
      result: {
        mrr_retained: subscriber.mrr,
        plan_name: subscriber.plan_name
      }
    });
  }
}

/**
 * Create a retention alert and trigger action
 */
async function createRetentionAlert(
  userId: string,
  subscriber: Subscriber,
  alertType: AlertType
): Promise<void> {
  // Check if alert already exists
  const { data: existing } = await getSupabaseAdmin()
    .from('retention_alert')
    .select('*')
    .eq('subscriber_id', subscriber.id)
    .eq('alert_type', alertType)
    .eq('status', 'active')
    .single();

  if (existing) {
    console.log(`Retention alert already exists for ${subscriber.email} (${alertType})`);
    return;
  }

  // Create alert
  await getSupabaseAdmin().from('retention_alert').insert({
    user_id: userId,
    subscriber_id: subscriber.id,
    alert_type: alertType,
    status: 'active'
  });

  // Trigger retention action
  await triggerRetentionAction(userId, subscriber, alertType);
}

/**
 * Trigger retention action based on alert type
 */
async function triggerRetentionAction(
  userId: string,
  subscriber: Subscriber,
  alertType: AlertType
): Promise<void> {
  const actionTypeMap: Record<AlertType, string> = {
    cancel_pending: 'send_winback_email',
    downgrade: 'send_winback_email',
    expiring_soon: 'send_winback_email',
    inactive: 'send_winback_email'
  };

  const actionType = actionTypeMap[alertType];

  await executeAgentAction({
    userId,
    agentType: 'retention',
    actionType,
    subscriberId: subscriber.id,
    context: {
      alertType
    }
  });

  // Update alert with action taken
  await getSupabaseAdmin()
    .from('retention_alert')
    .update({ action_taken: 'email_sent' })
    .eq('subscriber_id', subscriber.id)
    .eq('alert_type', alertType)
    .eq('status', 'active');
}

/**
 * Process retention alerts via cron
 * Checks for subscriptions expiring soon without renewal
 */
export async function processRetentionAlerts(): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  // Get all users with active retention agent
  const { data: configs } = await getSupabaseAdmin()
    .from('agent_config')
    .select('user_id')
    .eq('agent_type', 'retention')
    .eq('is_active', true);

  if (!configs || configs.length === 0) {
    return { processed: 0, errors: 0 };
  }

  for (const config of configs) {
    try {
      // Find subscriptions expiring in next 7 days with cancel_at_period_end
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);

      const { data: expiringSubscribers } = await getSupabaseAdmin()
        .from('subscriber')
        .select('*')
        .eq('user_id', config.user_id)
        .eq('subscription_status', 'active')
        .lte('current_period_end', expiryDate.toISOString());

      for (const subscriber of expiringSubscribers || []) {
        // Check if we already have an alert for this subscriber
        const { data: existingAlert } = await getSupabaseAdmin()
          .from('retention_alert')
          .select('id')
          .eq('subscriber_id', subscriber.id)
          .eq('status', 'active')
          .single();

        if (!existingAlert) {
          await createRetentionAlert(config.user_id, subscriber, 'expiring_soon');
          processed++;
        }
      }
    } catch (error) {
      console.error(`Error processing retention for user ${config.user_id}:`, error);
      errors++;
    }
  }

  return { processed, errors };
}
