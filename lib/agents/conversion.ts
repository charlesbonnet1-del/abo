import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { executeAgentAction, Subscriber } from './executor';

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

export type OpportunityType = 'trial_ending' | 'freemium_inactive' | 'no_subscription';

export interface ConversionOpportunity {
  id: string;
  user_id: string;
  subscriber_id: string;
  opportunity_type: OpportunityType;
  status: 'active' | 'converted' | 'lost' | 'expired';
  emails_sent: number;
  created_at: string;
  converted_at: string | null;
}

const DEFAULT_TRIAL_WARNING_DAYS = 3;
const DEFAULT_FREEMIUM_DAYS = 7;

/**
 * Handle Stripe customer.subscription.created webhook
 * Marks conversion opportunity as converted
 */
export async function handleSubscriptionCreated(
  subscription: { id: string; customer: string; status: string },
  userId: string
): Promise<void> {
  if (subscription.status === 'trialing') {
    // This is a new trial, not a conversion
    return;
  }

  // Find subscriber
  const { data: subscriber } = await getSupabaseAdmin()
    .from('subscriber')
    .select('*')
    .eq('stripe_customer_id', subscription.customer)
    .eq('user_id', userId)
    .single();

  if (!subscriber) return;

  // Mark opportunity as converted
  const { data: opportunity } = await getSupabaseAdmin()
    .from('conversion_opportunity')
    .update({
      status: 'converted',
      converted_at: new Date().toISOString()
    })
    .eq('subscriber_id', subscriber.id)
    .eq('status', 'active')
    .select()
    .single();

  if (opportunity) {
    // Create conversion success record
    await getSupabaseAdmin().from('agent_action').insert({
      user_id: userId,
      agent_type: 'conversion',
      action_type: 'trial_converted',
      subscriber_id: subscriber.id,
      description: `Conversion reussie : ${subscriber.email}`,
      status: 'executed',
      executed_at: new Date().toISOString(),
      result: {
        new_mrr: subscriber.mrr,
        plan_name: subscriber.plan_name,
        opportunity_type: opportunity.opportunity_type
      }
    });
  }
}

/**
 * Handle trial ending (Stripe customer.subscription.trial_will_end webhook)
 */
export async function handleTrialWillEnd(
  subscription: { id: string; customer: string; trial_end: number },
  userId: string
): Promise<void> {
  const { data: subscriber } = await getSupabaseAdmin()
    .from('subscriber')
    .select('*')
    .eq('stripe_customer_id', subscription.customer)
    .eq('user_id', userId)
    .single();

  if (!subscriber) return;

  await createOrUpdateOpportunity(userId, subscriber, 'trial_ending');
}

/**
 * Create or update a conversion opportunity
 */
async function createOrUpdateOpportunity(
  userId: string,
  subscriber: Subscriber,
  opportunityType: OpportunityType
): Promise<void> {
  // Check if opportunity already exists
  const { data: existing } = await getSupabaseAdmin()
    .from('conversion_opportunity')
    .select('*')
    .eq('subscriber_id', subscriber.id)
    .eq('status', 'active')
    .single();

  if (existing) {
    // Update emails_sent counter
    await getSupabaseAdmin()
      .from('conversion_opportunity')
      .update({ emails_sent: existing.emails_sent + 1 })
      .eq('id', existing.id);
  } else {
    // Create new opportunity
    await getSupabaseAdmin().from('conversion_opportunity').insert({
      user_id: userId,
      subscriber_id: subscriber.id,
      opportunity_type: opportunityType,
      status: 'active',
      emails_sent: 1
    });
  }

  // Trigger conversion action
  await triggerConversionAction(userId, subscriber, opportunityType);
}

/**
 * Trigger conversion action
 */
async function triggerConversionAction(
  userId: string,
  subscriber: Subscriber,
  opportunityType: OpportunityType
): Promise<void> {
  const actionTypeMap: Record<OpportunityType, string> = {
    trial_ending: 'send_upgrade_email',
    freemium_inactive: 'send_upgrade_email',
    no_subscription: 'send_upgrade_email'
  };

  const actionType = actionTypeMap[opportunityType];

  // Calculate days as freemium or trial ends at
  const context: Record<string, unknown> = {
    opportunityType,
    upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade?customer=${subscriber.stripe_customer_id}`
  };

  if (opportunityType === 'trial_ending' && subscriber.current_period_end) {
    context.trialEndsAt = new Date(subscriber.current_period_end).toLocaleDateString('fr-FR');
  }

  if (opportunityType === 'freemium_inactive') {
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(subscriber.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    context.daysAsFreemium = daysSinceCreation;
  }

  await executeAgentAction({
    userId,
    agentType: 'conversion',
    actionType,
    subscriberId: subscriber.id,
    context
  });
}

/**
 * Process conversion opportunities via cron
 * Finds trials ending soon and stale freemiums
 */
export async function processConversionOpportunities(): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  // Get all users with active conversion agent
  const { data: configs } = await getSupabaseAdmin()
    .from('agent_config')
    .select('user_id')
    .eq('agent_type', 'conversion')
    .eq('is_active', true);

  if (!configs || configs.length === 0) {
    return { processed: 0, errors: 0 };
  }

  for (const config of configs) {
    try {
      // Get brand settings for configurable thresholds
      const { data: brandSettings } = await getSupabaseAdmin()
        .from('brand_settings')
        .select('trial_warning_days, freemium_conversion_days')
        .eq('user_id', config.user_id)
        .single();

      const trialWarningDays = brandSettings?.trial_warning_days || DEFAULT_TRIAL_WARNING_DAYS;
      const freemiumDays = brandSettings?.freemium_conversion_days || DEFAULT_FREEMIUM_DAYS;

      // 1. Find trials expiring soon
      const trialCutoff = new Date();
      trialCutoff.setDate(trialCutoff.getDate() + trialWarningDays);

      const { data: expiringTrials } = await getSupabaseAdmin()
        .from('subscriber')
        .select('*')
        .eq('user_id', config.user_id)
        .eq('subscription_status', 'trialing')
        .lte('current_period_end', trialCutoff.toISOString());

      for (const subscriber of expiringTrials || []) {
        // Check if we already have an active opportunity
        const { data: existingOpp } = await getSupabaseAdmin()
          .from('conversion_opportunity')
          .select('id')
          .eq('subscriber_id', subscriber.id)
          .eq('status', 'active')
          .single();

        if (!existingOpp) {
          await createOrUpdateOpportunity(config.user_id, subscriber, 'trial_ending');
          processed++;
        }
      }

      // 2. Find stale freemiums
      const freemiumCutoff = new Date();
      freemiumCutoff.setDate(freemiumCutoff.getDate() - freemiumDays);

      const { data: staleFreemiums } = await getSupabaseAdmin()
        .from('subscriber')
        .select('*')
        .eq('user_id', config.user_id)
        .eq('subscription_status', 'none')
        .lte('created_at', freemiumCutoff.toISOString());

      for (const subscriber of staleFreemiums || []) {
        // Check if we already have an active opportunity
        const { data: existingOpp } = await getSupabaseAdmin()
          .from('conversion_opportunity')
          .select('id')
          .eq('subscriber_id', subscriber.id)
          .eq('status', 'active')
          .single();

        if (!existingOpp) {
          await createOrUpdateOpportunity(config.user_id, subscriber, 'freemium_inactive');
          processed++;
        }
      }
    } catch (error) {
      console.error(`Error processing conversions for user ${config.user_id}:`, error);
      errors++;
    }
  }

  return { processed, errors };
}

/**
 * Expire old conversion opportunities (called by expiration cron)
 */
export async function expireOldOpportunities(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30); // Expire after 30 days

  const { data } = await getSupabaseAdmin()
    .from('conversion_opportunity')
    .update({
      status: 'expired'
    })
    .eq('status', 'active')
    .lt('created_at', cutoff.toISOString())
    .select();

  return data?.length || 0;
}
