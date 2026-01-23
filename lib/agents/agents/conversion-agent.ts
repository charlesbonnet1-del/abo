import { BaseAgent, AgentEvent, AgentActionResult } from './base-agent';
import { Situation, ActionOption } from '../types/agent-types';
import { sendAgentEmail } from './email-sender';

export class ConversionAgent extends BaseAgent {
  constructor(userId: string, useAdminClient: boolean = false) {
    super(userId, 'conversion', useAdminClient);
  }

  /**
   * Triggers supportés par cet agent
   */
  getSupportedTriggers(): string[] {
    return [
      'trial_ending',
      'trial_expired',
      'freemium_inactive',
      'freemium_active',
      'signup_no_subscription',
    ];
  }

  /**
   * Vérifie si cet événement doit être traité
   */
  protected shouldHandleEvent(event: AgentEvent): boolean {
    return this.getSupportedTriggers().includes(event.type);
  }

  /**
   * Construit la description de l'action
   */
  protected buildActionDescription(decision: ActionOption, situation: Situation): string {
    const subscriberName = situation.subscriber.name || situation.subscriber.email;

    if (decision.action === 'email') {
      return `Email de conversion (${decision.strategy}) à ${subscriberName}`;
    }

    if (decision.action === 'trial_extension') {
      const days = decision.details.extension_days || '?';
      return `Extension d'essai de ${days} jours pour ${subscriberName}`;
    }

    if (decision.action === 'special_offer') {
      const percent = decision.details.discount_percent || '?';
      return `Offre spéciale -${percent}% pour ${subscriberName}`;
    }

    if (decision.action === 'feature_unlock') {
      return `Déblocage temporaire de fonctionnalités pour ${subscriberName}`;
    }

    return `Action conversion ${decision.action} pour ${subscriberName}`;
  }

  /**
   * Exécute l'action concrète
   */
  protected async performAction(action: Record<string, unknown>): Promise<void> {
    const result = action.result as Record<string, unknown>;
    const actionType = action.action_type as string;
    const actionId = action.id as string;

    if (actionType === 'email') {
      const emailResult = await sendAgentEmail({
        to: result.subscriber_email as string,
        subscriberName: result.subscriber_name as string | undefined,
        subject: result.email_subject as string | undefined,
        body: result.email_body as string | undefined,
        agentType: 'conversion',
        brandSettings: this.brandSettings!,
        userId: this.userId,
        subscriberId: action.subscriber_id as string,
        context: {
          trigger: result.trigger,
          strategy: result.strategy,
          details: result.details,
        },
        useAdminClient: this.useAdminClient,
      });

      // Store email content in the action result
      if (emailResult.success && emailResult.subject && emailResult.body) {
        const supabase = await this.getClient();
        if (supabase) {
          await supabase
            .from('agent_action')
            .update({
              result: {
                ...result,
                email_subject: emailResult.subject,
                email_body: emailResult.body,
                email_message_id: emailResult.messageId,
              },
            })
            .eq('id', actionId);
        }
      }
    }

    // Actions spéciales (trial_extension, feature_unlock) à implémenter
  }

  /**
   * Gère une fin d'essai imminente
   */
  async handleTrialEnding(
    subscriberId: string,
    trialEndDate: Date,
    daysRemaining: number
  ): Promise<AgentActionResult | null> {
    return this.handleEvent({
      type: 'trial_ending',
      subscriberId,
      data: {
        trial_end_date: trialEndDate.toISOString(),
        days_remaining: daysRemaining,
      },
    });
  }

  /**
   * Gère un essai expiré
   */
  async handleTrialExpired(
    subscriberId: string,
    expiredAt: Date
  ): Promise<AgentActionResult | null> {
    return this.handleEvent({
      type: 'trial_expired',
      subscriberId,
      data: {
        expired_at: expiredAt.toISOString(),
      },
    });
  }

  /**
   * Gère un utilisateur freemium inactif
   */
  async handleFreemiumInactive(
    subscriberId: string,
    daysSinceLastActivity: number
  ): Promise<AgentActionResult | null> {
    return this.handleEvent({
      type: 'freemium_inactive',
      subscriberId,
      data: {
        days_since_last_activity: daysSinceLastActivity,
      },
    });
  }

  /**
   * Gère un utilisateur freemium actif (upsell opportunity)
   */
  async handleFreemiumActive(
    subscriberId: string,
    usageMetrics: Record<string, number>
  ): Promise<AgentActionResult | null> {
    return this.handleEvent({
      type: 'freemium_active',
      subscriberId,
      data: {
        usage_metrics: usageMetrics,
      },
    });
  }

  /**
   * Gère un nouveau signup sans abonnement
   */
  async handleSignupNoSubscription(
    subscriberId: string,
    signupDate: Date,
    daysSinceSignup: number
  ): Promise<AgentActionResult | null> {
    return this.handleEvent({
      type: 'signup_no_subscription',
      subscriberId,
      data: {
        signup_date: signupDate.toISOString(),
        days_since_signup: daysSinceSignup,
      },
    });
  }
}

export function createConversionAgent(
  userId: string,
  useAdminClient: boolean = false
): ConversionAgent {
  return new ConversionAgent(userId, useAdminClient);
}
