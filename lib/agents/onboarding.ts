import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createOnboardingAgent } from './agents/onboarding-agent';

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

export interface OnboardingSequence {
  id: string;
  user_id: string;
  subscriber_id: string;
  current_step: number;
  total_steps: number;
  next_action_at: string | null;
  status: 'active' | 'completed' | 'paused' | 'canceled';
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

const DEFAULT_ONBOARDING_CONFIG = {
  totalSteps: 3,
  delayBetweenStepsHours: 24, // 1 day between steps
};

/**
 * Handle new subscription created
 * Creates an onboarding sequence and sends welcome email
 */
export async function handleNewSubscription(
  subscriberId: string,
  userId: string
): Promise<void> {
  // Check if sequence already exists
  const { data: existingSequence } = await getSupabaseAdmin()
    .from('onboarding_sequence')
    .select('*')
    .eq('subscriber_id', subscriberId)
    .in('status', ['active', 'completed'])
    .single();

  if (existingSequence) {
    console.log(`Onboarding sequence already exists for subscriber ${subscriberId}`);
    return;
  }

  // Get onboarding config from agent_config
  const config = await getOnboardingConfig(userId);

  // Create onboarding sequence
  const { data: sequence, error } = await getSupabaseAdmin()
    .from('onboarding_sequence')
    .insert({
      user_id: userId,
      subscriber_id: subscriberId,
      current_step: 1,
      total_steps: config.totalSteps,
      next_action_at: new Date().toISOString(), // Immediate for step 1
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating onboarding sequence:', error);
    return;
  }

  // Trigger immediate welcome email (step 1)
  await triggerOnboardingStep(sequence as OnboardingSequence, 1, userId);
}

/**
 * Get onboarding configuration from agent_config
 */
async function getOnboardingConfig(userId: string): Promise<{
  totalSteps: number;
  delayBetweenStepsHours: number;
}> {
  const { data: agentConfig } = await getSupabaseAdmin()
    .from('agent_config')
    .select('strategy_config')
    .eq('user_id', userId)
    .eq('agent_type', 'onboarding')
    .single();

  const strategyConfig = agentConfig?.strategy_config || {};
  const onboardingConfig = strategyConfig.onboarding_sequence as {
    totalSteps?: number;
    delayBetweenSteps?: number;
  } | undefined;

  return {
    totalSteps: onboardingConfig?.totalSteps || DEFAULT_ONBOARDING_CONFIG.totalSteps,
    delayBetweenStepsHours: onboardingConfig?.delayBetweenSteps || DEFAULT_ONBOARDING_CONFIG.delayBetweenStepsHours,
  };
}

/**
 * Trigger an onboarding step for a specific subscriber
 */
async function triggerOnboardingStep(
  sequence: OnboardingSequence,
  step: number,
  userId: string
): Promise<void> {
  // Use the intelligent OnboardingAgent
  const agent = createOnboardingAgent(userId, true);
  await agent.initialize();

  if (!agent.isActive()) {
    console.log(`Onboarding agent not active for user ${userId}`);
    return;
  }

  // Trigger the onboarding step through the agent
  const result = await agent.handleOnboardingStep(sequence.subscriber_id, step);

  if (result) {
    console.log(`Onboarding step ${step} triggered for subscriber ${sequence.subscriber_id}`);
  }
}

/**
 * Process all active onboarding sequences (called by cron)
 * Checks for sequences where next_action_at <= now and triggers next step
 */
export async function processOnboardingSequences(): Promise<{
  processed: number;
  completed: number;
  errors: number;
}> {
  let processed = 0;
  let completed = 0;
  let errors = 0;

  // Find all active sequences where next_action_at <= now
  const { data: sequences } = await getSupabaseAdmin()
    .from('onboarding_sequence')
    .select('*, subscriber(*)')
    .eq('status', 'active')
    .lte('next_action_at', new Date().toISOString());

  if (!sequences || sequences.length === 0) {
    return { processed: 0, completed: 0, errors: 0 };
  }

  for (const sequence of sequences) {
    try {
      const typedSequence = sequence as OnboardingSequence;
      const config = await getOnboardingConfig(typedSequence.user_id);

      // Trigger action for current step
      await triggerOnboardingStep(typedSequence, typedSequence.current_step, typedSequence.user_id);
      processed++;

      // Calculate next step
      const nextStep = typedSequence.current_step + 1;
      if (nextStep > typedSequence.total_steps) {
        // Sequence finished
        await getSupabaseAdmin()
          .from('onboarding_sequence')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', typedSequence.id);
        completed++;
      } else {
        // Schedule next action
        const nextDate = new Date();
        nextDate.setHours(nextDate.getHours() + config.delayBetweenStepsHours);

        await getSupabaseAdmin()
          .from('onboarding_sequence')
          .update({
            current_step: nextStep,
            next_action_at: nextDate.toISOString(),
          })
          .eq('id', typedSequence.id);
      }
    } catch (error) {
      console.error(`Error processing onboarding sequence ${sequence.id}:`, error);
      errors++;
    }
  }

  return { processed, completed, errors };
}

/**
 * Pause onboarding sequence (e.g., when user requests it)
 */
export async function pauseOnboardingSequence(subscriberId: string): Promise<void> {
  await getSupabaseAdmin()
    .from('onboarding_sequence')
    .update({ status: 'paused' })
    .eq('subscriber_id', subscriberId)
    .eq('status', 'active');
}

/**
 * Resume paused onboarding sequence
 */
export async function resumeOnboardingSequence(subscriberId: string): Promise<void> {
  const now = new Date().toISOString();
  await getSupabaseAdmin()
    .from('onboarding_sequence')
    .update({
      status: 'active',
      next_action_at: now, // Resume immediately
    })
    .eq('subscriber_id', subscriberId)
    .eq('status', 'paused');
}

/**
 * Cancel onboarding sequence (e.g., when subscription is canceled)
 */
export async function cancelOnboardingSequence(subscriberId: string): Promise<void> {
  await getSupabaseAdmin()
    .from('onboarding_sequence')
    .update({ status: 'canceled' })
    .eq('subscriber_id', subscriberId)
    .eq('status', 'active');
}

/**
 * Get onboarding status for a subscriber
 */
export async function getOnboardingStatus(subscriberId: string): Promise<{
  hasSequence: boolean;
  status?: string;
  currentStep?: number;
  totalSteps?: number;
  completedAt?: string;
}> {
  const { data: sequence } = await getSupabaseAdmin()
    .from('onboarding_sequence')
    .select('*')
    .eq('subscriber_id', subscriberId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!sequence) {
    return { hasSequence: false };
  }

  return {
    hasSequence: true,
    status: sequence.status,
    currentStep: sequence.current_step,
    totalSteps: sequence.total_steps,
    completedAt: sequence.completed_at,
  };
}
