import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generateEmail, EmailContext, BrandSettings } from './groq';
import { sendEmail, wrapEmailHtml } from './resend';

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

export type AgentType = 'recovery' | 'retention' | 'conversion';

export interface Subscriber {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  email: string;
  name: string | null;
  subscription_status: string;
  mrr: number;
  plan_name: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

export interface AgentAction {
  id: string;
  user_id: string;
  agent_type: AgentType;
  action_type: string;
  subscriber_id: string | null;
  description: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  executed_at: string | null;
  result: Record<string, unknown> | null;
  created_at: string;
}

export interface ExecuteAgentActionParams {
  userId: string;
  agentType: AgentType;
  actionType: string;
  subscriberId: string;
  context: EmailContext;
}

/**
 * Execute a complete agent action flow:
 * 1. Check if agent is active
 * 2. Check human-in-the-loop rules
 * 3. Generate email via AI
 * 4. Create agent_action record
 * 5. If auto-approved, execute immediately
 */
export async function executeAgentAction(params: ExecuteAgentActionParams): Promise<AgentAction | null> {
  const { userId, agentType, actionType, subscriberId, context } = params;

  // 1. Get agent config
  const { data: agentConfig } = await getSupabaseAdmin()
    .from('agent_config')
    .select('*')
    .eq('user_id', userId)
    .eq('agent_type', agentType)
    .single();

  if (!agentConfig?.is_active) {
    console.log(`Agent ${agentType} is not active for user ${userId}`);
    return null;
  }

  // 2. Get human-in-the-loop rules
  const { data: rules } = await getSupabaseAdmin()
    .from('agent_action_rules')
    .select('*')
    .eq('agent_config_id', agentConfig.id)
    .eq('action_type', actionType)
    .single();

  // Default to requiring approval if no rule exists
  const requiresApproval = rules?.requires_approval ?? true;

  // 3. Get subscriber and brand settings
  const { data: subscriber } = await getSupabaseAdmin()
    .from('subscriber')
    .select('*')
    .eq('id', subscriberId)
    .single();

  if (!subscriber) {
    console.error(`Subscriber ${subscriberId} not found`);
    return null;
  }

  const { data: brandSettings } = await getSupabaseAdmin()
    .from('brand_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  // 4. Generate email via AI
  const emailContext: EmailContext = {
    ...context,
    subscriberName: subscriber.name || undefined,
    subscriberEmail: subscriber.email,
    planName: subscriber.plan_name || undefined,
    mrr: subscriber.mrr,
    customerSince: subscriber.created_at ? formatCustomerSince(subscriber.created_at) : undefined
  };

  const email = await generateEmail({
    agentType,
    context: emailContext,
    brandSettings: (brandSettings || {}) as BrandSettings
  });

  // 5. Create agent_action record
  const { data: action, error } = await getSupabaseAdmin()
    .from('agent_action')
    .insert({
      user_id: userId,
      agent_type: agentType,
      action_type: actionType,
      subscriber_id: subscriberId,
      description: `Email : "${email.subject}" a ${subscriber.email}`,
      status: requiresApproval ? 'pending_approval' : 'approved',
      result: {
        email_subject: email.subject,
        email_body: email.body,
        channel: 'email',
        subscriber_email: subscriber.email,
        subscriber_name: subscriber.name
      }
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating agent action:', error);
    return null;
  }

  // 6. If auto-approved, execute immediately
  if (!requiresApproval && action) {
    await executeAction(action.id);
  }

  return action;
}

/**
 * Execute a previously approved action
 */
export async function executeAction(actionId: string): Promise<boolean> {
  const { data: action } = await getSupabaseAdmin()
    .from('agent_action')
    .select('*, subscriber(*)')
    .eq('id', actionId)
    .single();

  if (!action) {
    console.error(`Action ${actionId} not found`);
    return false;
  }

  const { data: brandSettings } = await getSupabaseAdmin()
    .from('brand_settings')
    .select('*')
    .eq('user_id', action.user_id)
    .single();

  try {
    // Send the email
    const result = await sendEmail({
      to: action.result.subscriber_email as string,
      subject: action.result.email_subject as string,
      html: wrapEmailHtml(action.result.email_body as string, brandSettings || undefined),
      fromName: brandSettings?.company_name || 'Abo'
    });

    if (result.success) {
      // Create entry in agent_communication
      await getSupabaseAdmin().from('agent_communication').insert({
        subscriber_id: action.subscriber_id,
        agent_type: action.agent_type,
        channel: 'email',
        subject: action.result.email_subject,
        content: action.result.email_body,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

      // Update action status
      await getSupabaseAdmin()
        .from('agent_action')
        .update({
          status: 'executed',
          executed_at: new Date().toISOString(),
          result: { ...action.result, message_id: result.messageId }
        })
        .eq('id', actionId);

      return true;
    } else {
      await getSupabaseAdmin()
        .from('agent_action')
        .update({
          status: 'failed',
          result: { ...action.result, error: result.error }
        })
        .eq('id', actionId);

      return false;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await getSupabaseAdmin()
      .from('agent_action')
      .update({
        status: 'failed',
        result: { ...action.result, error: errorMessage }
      })
      .eq('id', actionId);

    return false;
  }
}

/**
 * Approve an action and execute it
 */
export async function approveAction(actionId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  // Verify ownership
  const { data: action } = await getSupabaseAdmin()
    .from('agent_action')
    .select('*')
    .eq('id', actionId)
    .single();

  if (!action) {
    return { success: false, error: 'Action not found' };
  }

  if (action.user_id !== userId) {
    return { success: false, error: 'Unauthorized' };
  }

  if (action.status !== 'pending_approval') {
    return { success: false, error: 'Action is not pending approval' };
  }

  // Update status to approved
  await getSupabaseAdmin()
    .from('agent_action')
    .update({
      status: 'approved',
      approved_by: userId,
      approved_at: new Date().toISOString()
    })
    .eq('id', actionId);

  // Execute the action
  const executed = await executeAction(actionId);

  return { success: executed };
}

/**
 * Reject an action
 */
export async function rejectAction(
  actionId: string,
  userId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  // Verify ownership
  const { data: action } = await getSupabaseAdmin()
    .from('agent_action')
    .select('*')
    .eq('id', actionId)
    .single();

  if (!action) {
    return { success: false, error: 'Action not found' };
  }

  if (action.user_id !== userId) {
    return { success: false, error: 'Unauthorized' };
  }

  if (action.status !== 'pending_approval') {
    return { success: false, error: 'Action is not pending approval' };
  }

  // Update status to rejected
  await getSupabaseAdmin()
    .from('agent_action')
    .update({
      status: 'rejected',
      result: { ...action.result, rejection_reason: reason }
    })
    .eq('id', actionId);

  return { success: true };
}

/**
 * Batch approve multiple actions
 */
export async function batchApproveActions(
  actionIds: string[],
  userId: string
): Promise<{ success: boolean; results: { id: string; success: boolean; error?: string }[] }> {
  const results = await Promise.all(
    actionIds.map(async (id) => {
      const result = await approveAction(id, userId);
      return { id, ...result };
    })
  );

  return {
    success: results.every((r) => r.success),
    results
  };
}

/**
 * Get subscriber by Stripe customer ID
 */
export async function getSubscriberByStripeCustomerId(
  stripeCustomerId: string,
  userId: string
): Promise<Subscriber | null> {
  const { data } = await getSupabaseAdmin()
    .from('subscriber')
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .eq('user_id', userId)
    .single();

  return data;
}

/**
 * Format customer since date
 */
function formatCustomerSince(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMonths = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30));

  if (diffMonths < 1) return 'moins d\'un mois';
  if (diffMonths === 1) return '1 mois';
  if (diffMonths < 12) return `${diffMonths} mois`;

  const years = Math.floor(diffMonths / 12);
  if (years === 1) return '1 an';
  return `${years} ans`;
}

/**
 * Get pending actions count for a user
 */
export async function getPendingActionsCount(userId: string): Promise<number> {
  const { count } = await getSupabaseAdmin()
    .from('agent_action')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'pending_approval');

  return count || 0;
}
