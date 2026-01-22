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

export interface RecoverySequence {
  id: string;
  user_id: string;
  subscriber_id: string;
  invoice_id: string | null;
  stripe_invoice_id: string | null;
  current_step: number;
  next_action_at: string | null;
  status: 'active' | 'recovered' | 'abandoned' | 'canceled';
  started_at: string;
  recovered_at: string | null;
  created_at: string;
}

const DEFAULT_RECOVERY_DELAYS = [0, 1, 3, 7]; // Days after initial failure

/**
 * Handle Stripe invoice.payment_failed webhook
 * Creates a recovery sequence if one doesn't exist
 */
export async function handlePaymentFailed(
  invoice: { id: string; customer: string; amount_due: number },
  userId: string
): Promise<void> {
  // 1. Find subscriber
  const subscriber = await getSubscriberByStripeCustomerId(invoice.customer, userId);
  if (!subscriber) {
    console.error(`Subscriber not found for customer ${invoice.customer}`);
    return;
  }

  // 2. Check if a sequence already exists for this invoice
  const { data: existingSequence } = await getSupabaseAdmin()
    .from('recovery_sequence')
    .select('*')
    .eq('subscriber_id', subscriber.id)
    .eq('stripe_invoice_id', invoice.id)
    .eq('status', 'active')
    .single();

  if (existingSequence) {
    console.log(`Recovery sequence already exists for invoice ${invoice.id}`);
    return;
  }

  // 3. Create recovery sequence
  const { data: sequence, error } = await getSupabaseAdmin()
    .from('recovery_sequence')
    .insert({
      user_id: userId,
      subscriber_id: subscriber.id,
      stripe_invoice_id: invoice.id,
      current_step: 1,
      next_action_at: new Date().toISOString(), // Immediate
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating recovery sequence:', error);
    return;
  }

  // 4. Trigger immediate action (step 1)
  await triggerRecoveryAction(sequence, subscriber, 1, invoice.amount_due);
}

/**
 * Handle Stripe invoice.payment_succeeded webhook
 * Marks recovery sequence as recovered
 */
export async function handlePaymentSucceeded(
  invoice: { id: string; customer: string; amount_paid: number },
  userId: string
): Promise<void> {
  const subscriber = await getSubscriberByStripeCustomerId(invoice.customer, userId);
  if (!subscriber) return;

  // Mark sequence as recovered
  const { data: sequence } = await getSupabaseAdmin()
    .from('recovery_sequence')
    .update({
      status: 'recovered',
      recovered_at: new Date().toISOString()
    })
    .eq('stripe_invoice_id', invoice.id)
    .eq('status', 'active')
    .select()
    .single();

  if (sequence) {
    // Create a "payment_recovered" action for stats
    await getSupabaseAdmin().from('agent_action').insert({
      user_id: userId,
      agent_type: 'recovery',
      action_type: 'payment_recovered',
      subscriber_id: subscriber.id,
      description: `Paiement recupere : ${formatAmount(invoice.amount_paid)}`,
      status: 'executed',
      executed_at: new Date().toISOString(),
      result: {
        amount_recovered: invoice.amount_paid,
        stripe_invoice_id: invoice.id
      }
    });
  }
}

/**
 * Trigger a recovery action for a specific step
 */
async function triggerRecoveryAction(
  sequence: RecoverySequence,
  subscriber: Subscriber,
  step: number,
  amount?: number
): Promise<void> {
  const actionTypes = [
    '',
    'send_reminder_email', // Step 1
    'send_reminder_email', // Step 2
    'send_reminder_email', // Step 3
    'send_reminder_email'  // Step 4 (last)
  ];

  const actionType = actionTypes[step];
  if (!actionType) return;

  // Get invoice amount if not provided
  let invoiceAmount = amount;
  if (!invoiceAmount && sequence.stripe_invoice_id) {
    const { data: invoice } = await getSupabaseAdmin()
      .from('invoice')
      .select('amount')
      .eq('stripe_invoice_id', sequence.stripe_invoice_id)
      .single();
    invoiceAmount = invoice?.amount;
  }

  await executeAgentAction({
    userId: sequence.user_id,
    agentType: 'recovery',
    actionType,
    subscriberId: subscriber.id,
    context: {
      step,
      amount: invoiceAmount,
      updatePaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/update-payment?customer=${subscriber.stripe_customer_id}`
    }
  });
}

/**
 * Process all active recovery sequences (called by cron)
 * Checks for sequences where next_action_at <= now and triggers next step
 */
export async function processRecoverySequences(): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  // Find all active sequences where next_action_at <= now
  const { data: sequences } = await getSupabaseAdmin()
    .from('recovery_sequence')
    .select('*, subscriber(*)')
    .eq('status', 'active')
    .lte('next_action_at', new Date().toISOString());

  if (!sequences || sequences.length === 0) {
    return { processed: 0, errors: 0 };
  }

  for (const sequence of sequences) {
    try {
      // Get brand settings for recovery delays
      const { data: brandSettings } = await getSupabaseAdmin()
        .from('brand_settings')
        .select('recovery_delays')
        .eq('user_id', sequence.user_id)
        .single();

      const delays = brandSettings?.recovery_delays || DEFAULT_RECOVERY_DELAYS;
      const subscriber = sequence.subscriber as Subscriber;

      // Trigger action for current step
      await triggerRecoveryAction(sequence, subscriber, sequence.current_step);
      processed++;

      // Calculate next step
      const nextStep = sequence.current_step + 1;
      if (nextStep > delays.length) {
        // Sequence finished without success
        await getSupabaseAdmin()
          .from('recovery_sequence')
          .update({ status: 'abandoned' })
          .eq('id', sequence.id);
      } else {
        // Schedule next action
        const nextDelay = delays[nextStep - 1];
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + nextDelay);

        await getSupabaseAdmin()
          .from('recovery_sequence')
          .update({
            current_step: nextStep,
            next_action_at: nextDate.toISOString()
          })
          .eq('id', sequence.id);
      }
    } catch (error) {
      console.error(`Error processing recovery sequence ${sequence.id}:`, error);
      errors++;
    }
  }

  return { processed, errors };
}

/**
 * Cancel recovery sequence (e.g., when subscription is canceled)
 */
export async function cancelRecoverySequence(subscriberId: string): Promise<void> {
  await getSupabaseAdmin()
    .from('recovery_sequence')
    .update({ status: 'canceled' })
    .eq('subscriber_id', subscriberId)
    .eq('status', 'active');
}

function formatAmount(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(cents / 100);
}
