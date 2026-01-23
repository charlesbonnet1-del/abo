import { createAdminClient } from '@/lib/supabase/server';
import { createRecoveryAgent } from '../agents/recovery-agent';
import { createRetentionAgent } from '../agents/retention-agent';
import { createConversionAgent } from '../agents/conversion-agent';

interface RecentAction {
  id: string;
  agent_type: string;
  action_type: string;
  subscriber_id: string;
  status: string;
  result: Record<string, unknown>;
  created_at: string;
}

/**
 * Finds recent agent actions for a subscriber that could be linked to an outcome
 */
export async function findRecentActionsForSubscriber(
  subscriberId: string,
  agentType: string,
  hoursAgo: number = 72
): Promise<RecentAction[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hoursAgo);

  const { data, error } = await supabase
    .from('agent_action')
    .select('id, agent_type, action_type, subscriber_id, status, result, created_at')
    .eq('subscriber_id', subscriberId)
    .eq('agent_type', agentType)
    .eq('status', 'executed')
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error finding recent actions:', error);
    return [];
  }

  return data || [];
}

/**
 * Detects and records a recovery success outcome
 * Called when a payment succeeds after a previous failure
 */
export async function detectRecoverySuccess(
  userId: string,
  subscriberId: string,
  invoiceId: string,
  amountPaid: number
): Promise<boolean> {
  // Find recent recovery actions for this subscriber
  const recentActions = await findRecentActionsForSubscriber(subscriberId, 'recovery', 72);

  if (recentActions.length === 0) {
    console.log('No recent recovery actions found for subscriber:', subscriberId);
    return false;
  }

  // Check if any action was related to this invoice
  const relatedAction = recentActions.find((action) => {
    const result = action.result as Record<string, unknown>;
    return result.invoice_id === invoiceId || result.trigger === 'payment_failed';
  });

  if (!relatedAction) {
    // Still record as success if there was any recent recovery action
    // (customer might have paid a different invoice)
    console.log('Recording recovery success for most recent action');
  }

  const actionToResolve = relatedAction || recentActions[0];

  try {
    // Create the recovery agent and record the outcome
    const recoveryAgent = createRecoveryAgent(userId, true);
    await recoveryAgent.initialize();

    await recoveryAgent.recordOutcome(actionToResolve.id, 'success', {
      invoice_id: invoiceId,
      amount_paid: amountPaid,
      recovery_time_hours: calculateHoursSince(actionToResolve.created_at),
      email_content: {
        subject: (actionToResolve.result as Record<string, unknown>).email_subject,
        body: (actionToResolve.result as Record<string, unknown>).email_body,
      },
    });

    // Update the action with outcome info
    const supabase = createAdminClient();
    if (supabase) {
      await supabase
        .from('agent_action')
        .update({
          outcome: 'success',
          outcome_detected_at: new Date().toISOString(),
          outcome_details: {
            invoice_id: invoiceId,
            amount_paid: amountPaid,
            recovery_time_hours: calculateHoursSince(actionToResolve.created_at),
          },
        })
        .eq('id', actionToResolve.id);
    }

    console.log(`Recovery success recorded for action ${actionToResolve.id}`);
    return true;
  } catch (error) {
    console.error('Error recording recovery success:', error);
    return false;
  }
}

/**
 * Detects and records a retention success outcome
 * Called when a subscription is updated (cancel_at removed) or renewed
 */
export async function detectRetentionSuccess(
  userId: string,
  subscriberId: string,
  subscriptionId: string,
  details: {
    wasGoingToCancel?: boolean;
    newStatus?: string;
    discountApplied?: boolean;
  }
): Promise<boolean> {
  // Find recent retention actions for this subscriber
  const recentActions = await findRecentActionsForSubscriber(subscriberId, 'retention', 168); // 7 days

  if (recentActions.length === 0) {
    console.log('No recent retention actions found for subscriber:', subscriberId);
    return false;
  }

  // Find action related to pending cancellation
  const relatedAction = recentActions.find((action) => {
    const result = action.result as Record<string, unknown>;
    return result.trigger === 'cancel_pending' || result.trigger === 'subscription_expiring';
  });

  const actionToResolve = relatedAction || recentActions[0];

  try {
    const retentionAgent = createRetentionAgent(userId, true);
    await retentionAgent.initialize();

    await retentionAgent.recordOutcome(actionToResolve.id, 'success', {
      subscription_id: subscriptionId,
      retention_time_hours: calculateHoursSince(actionToResolve.created_at),
      was_going_to_cancel: details.wasGoingToCancel,
      new_status: details.newStatus,
      email_content: {
        subject: (actionToResolve.result as Record<string, unknown>).email_subject,
        body: (actionToResolve.result as Record<string, unknown>).email_body,
      },
    });

    // Update the action with outcome info
    const supabase = createAdminClient();
    if (supabase) {
      await supabase
        .from('agent_action')
        .update({
          outcome: 'success',
          outcome_detected_at: new Date().toISOString(),
          outcome_details: {
            subscription_id: subscriptionId,
            retention_time_hours: calculateHoursSince(actionToResolve.created_at),
            ...details,
          },
        })
        .eq('id', actionToResolve.id);
    }

    console.log(`Retention success recorded for action ${actionToResolve.id}`);
    return true;
  } catch (error) {
    console.error('Error recording retention success:', error);
    return false;
  }
}

/**
 * Detects and records a conversion success outcome
 * Called when a trial user subscribes or a freemium user upgrades
 */
export async function detectConversionSuccess(
  userId: string,
  subscriberId: string,
  subscriptionId: string,
  details: {
    previousStatus?: string;
    newPlan?: string;
    mrr?: number;
  }
): Promise<boolean> {
  // Find recent conversion actions for this subscriber
  const recentActions = await findRecentActionsForSubscriber(subscriberId, 'conversion', 336); // 14 days

  if (recentActions.length === 0) {
    console.log('No recent conversion actions found for subscriber:', subscriberId);
    return false;
  }

  // Find action related to trial or freemium conversion
  const relatedAction = recentActions.find((action) => {
    const result = action.result as Record<string, unknown>;
    return (
      result.trigger === 'trial_ending' ||
      result.trigger === 'trial_expired' ||
      result.trigger === 'freemium_active' ||
      result.trigger === 'signup_no_subscription'
    );
  });

  const actionToResolve = relatedAction || recentActions[0];

  try {
    const conversionAgent = createConversionAgent(userId, true);
    await conversionAgent.initialize();

    await conversionAgent.recordOutcome(actionToResolve.id, 'success', {
      subscription_id: subscriptionId,
      conversion_time_hours: calculateHoursSince(actionToResolve.created_at),
      previous_status: details.previousStatus,
      new_plan: details.newPlan,
      mrr: details.mrr,
      email_content: {
        subject: (actionToResolve.result as Record<string, unknown>).email_subject,
        body: (actionToResolve.result as Record<string, unknown>).email_body,
      },
    });

    // Update the action with outcome info
    const supabase = createAdminClient();
    if (supabase) {
      await supabase
        .from('agent_action')
        .update({
          outcome: 'success',
          outcome_detected_at: new Date().toISOString(),
          outcome_details: {
            subscription_id: subscriptionId,
            conversion_time_hours: calculateHoursSince(actionToResolve.created_at),
            ...details,
          },
        })
        .eq('id', actionToResolve.id);
    }

    console.log(`Conversion success recorded for action ${actionToResolve.id}`);
    return true;
  } catch (error) {
    console.error('Error recording conversion success:', error);
    return false;
  }
}

/**
 * Detects and records a failure outcome
 * Called when a subscription is definitively canceled or payment exhausted retries
 */
export async function detectFailure(
  userId: string,
  subscriberId: string,
  agentType: 'recovery' | 'retention' | 'conversion',
  details: Record<string, unknown>
): Promise<boolean> {
  const recentActions = await findRecentActionsForSubscriber(subscriberId, agentType, 336);

  if (recentActions.length === 0) {
    return false;
  }

  const actionToResolve = recentActions[0];

  try {
    let agent;
    if (agentType === 'recovery') {
      agent = createRecoveryAgent(userId, true);
    } else if (agentType === 'retention') {
      agent = createRetentionAgent(userId, true);
    } else {
      agent = createConversionAgent(userId, true);
    }

    await agent.initialize();
    await agent.recordOutcome(actionToResolve.id, 'failure', {
      ...details,
      failure_time_hours: calculateHoursSince(actionToResolve.created_at),
      email_content: {
        subject: (actionToResolve.result as Record<string, unknown>).email_subject,
        body: (actionToResolve.result as Record<string, unknown>).email_body,
      },
    });

    // Update the action with outcome info
    const supabase = createAdminClient();
    if (supabase) {
      await supabase
        .from('agent_action')
        .update({
          outcome: 'failure',
          outcome_detected_at: new Date().toISOString(),
          outcome_details: details,
        })
        .eq('id', actionToResolve.id);
    }

    console.log(`Failure recorded for action ${actionToResolve.id}`);
    return true;
  } catch (error) {
    console.error('Error recording failure:', error);
    return false;
  }
}

function calculateHoursSince(dateString: string): number {
  const then = new Date(dateString).getTime();
  const now = Date.now();
  return Math.round((now - then) / (1000 * 60 * 60));
}
