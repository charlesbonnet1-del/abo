import { SupabaseClient } from '@supabase/supabase-js';

type AgentType = 'recovery' | 'retention' | 'conversion';

interface DefaultRule {
  action_type: string;
  requires_approval: boolean;
  max_auto_amount: number | null;
}

// Default action rules for each agent type
const defaultAgentRules: Record<AgentType, DefaultRule[]> = {
  recovery: [
    { action_type: 'send_reminder_email', requires_approval: true, max_auto_amount: null },
    { action_type: 'send_sms_reminder', requires_approval: true, max_auto_amount: null },
    { action_type: 'offer_payment_extension', requires_approval: true, max_auto_amount: null },
    { action_type: 'update_payment_method_request', requires_approval: true, max_auto_amount: null },
  ],
  retention: [
    { action_type: 'send_winback_email', requires_approval: true, max_auto_amount: null },
    { action_type: 'offer_discount', requires_approval: true, max_auto_amount: null },
    { action_type: 'offer_pause', requires_approval: true, max_auto_amount: null },
    { action_type: 'offer_downgrade', requires_approval: true, max_auto_amount: null },
  ],
  conversion: [
    { action_type: 'send_upgrade_email', requires_approval: true, max_auto_amount: null },
    { action_type: 'offer_trial_extension', requires_approval: true, max_auto_amount: null },
    { action_type: 'offer_first_month_discount', requires_approval: true, max_auto_amount: null },
    { action_type: 'send_feature_highlight', requires_approval: true, max_auto_amount: null },
  ],
};

/**
 * Initialize agent configurations for a new user.
 * Creates default agent configs (all inactive) and their associated action rules.
 * This should be called when a user first logs in or signs up.
 */
export async function initializeAgentsForUser(supabase: SupabaseClient, userId: string): Promise<void> {
  const agentTypes: AgentType[] = ['recovery', 'retention', 'conversion'];

  for (const agentType of agentTypes) {
    // Check if config already exists
    const { data: existingConfig } = await supabase
      .from('agent_config')
      .select('id')
      .eq('user_id', userId)
      .eq('agent_type', agentType)
      .single();

    if (existingConfig) {
      // Config already exists, skip
      continue;
    }

    // Create default agent config
    const { data: newConfig, error: configError } = await supabase
      .from('agent_config')
      .insert({
        user_id: userId,
        agent_type: agentType,
        is_active: false,
        confidence_level: 'review_all',
        notification_channels: ['app'],
      })
      .select()
      .single();

    if (configError) {
      console.error(`Error creating ${agentType} config:`, configError);
      continue;
    }

    // Create default action rules
    const rules = defaultAgentRules[agentType].map(rule => ({
      agent_config_id: newConfig.id,
      ...rule,
    }));

    const { error: rulesError } = await supabase
      .from('agent_action_rules')
      .insert(rules);

    if (rulesError) {
      console.error(`Error creating ${agentType} rules:`, rulesError);
    }
  }
}

/**
 * Check if a user has agent configs initialized.
 * Returns true if all 3 agent types are configured.
 */
export async function hasAgentConfigs(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('agent_config')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error checking agent configs:', error);
    return false;
  }

  return count === 3;
}

/**
 * Ensure agent configs exist for a user.
 * If configs don't exist, initialize them.
 */
export async function ensureAgentConfigs(supabase: SupabaseClient, userId: string): Promise<void> {
  const hasConfigs = await hasAgentConfigs(supabase, userId);
  if (!hasConfigs) {
    await initializeAgentsForUser(supabase, userId);
  }
}
