import { BaseAgent, AgentEvent, AgentActionResult } from './base-agent';
import { Situation, ActionOption } from '../types/agent-types';
import { sendAgentEmail } from './email-sender';

export class RetentionAgent extends BaseAgent {
  constructor(userId: string, useAdminClient: boolean = false) {
    super(userId, 'retention', useAdminClient);
  }

  /**
   * Triggers supportés par cet agent
   */
  getSupportedTriggers(): string[] {
    return [
      'cancel_pending',
      'subscription_canceled',
      'downgrade',
      'subscription_expiring',
      'inactive_subscriber',
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
    const mrr = situation.subscriber.mrr
      ? `${(situation.subscriber.mrr / 100).toFixed(2)}€/mois`
      : '';

    if (decision.action === 'email') {
      return `Email de rétention (${decision.strategy}) à ${subscriberName} ${mrr}`;
    }

    if (decision.action === 'discount') {
      const percent = decision.details.discount_percent || '?';
      const months = decision.details.duration_months || '?';
      return `Offre -${percent}% pendant ${months} mois à ${subscriberName}`;
    }

    if (decision.action === 'pause') {
      return `Proposition de pause à ${subscriberName}`;
    }

    return `Action rétention ${decision.action} pour ${subscriberName}`;
  }

  /**
   * Exécute l'action concrète
   */
  protected async performAction(action: Record<string, unknown>): Promise<void> {
    const result = action.result as Record<string, unknown>;
    const actionType = action.action_type as string;

    if (actionType === 'email') {
      await sendAgentEmail({
        to: result.subscriber_email as string,
        subscriberName: result.subscriber_name as string | undefined,
        subject: result.email_subject as string | undefined,
        body: result.email_body as string | undefined,
        agentType: 'retention',
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
    }

    // Actions Stripe (discount, pause) à implémenter
  }

  /**
   * Gère une annulation en attente
   */
  async handleCancelPending(
    subscriberId: string,
    cancelAt: Date,
    reason?: string
  ): Promise<AgentActionResult | null> {
    return this.handleEvent({
      type: 'cancel_pending',
      subscriberId,
      data: {
        cancel_at: cancelAt.toISOString(),
        cancellation_reason: reason,
      },
    });
  }

  /**
   * Gère un downgrade
   */
  async handleDowngrade(
    subscriberId: string,
    fromPlan: string,
    toPlan: string
  ): Promise<AgentActionResult | null> {
    return this.handleEvent({
      type: 'downgrade',
      subscriberId,
      data: {
        from_plan: fromPlan,
        to_plan: toPlan,
      },
    });
  }

  /**
   * Gère un subscriber inactif
   */
  async handleInactiveSubscriber(
    subscriberId: string,
    daysSinceLastActivity: number
  ): Promise<AgentActionResult | null> {
    return this.handleEvent({
      type: 'inactive_subscriber',
      subscriberId,
      data: {
        days_since_last_activity: daysSinceLastActivity,
      },
    });
  }
}

export function createRetentionAgent(
  userId: string,
  useAdminClient: boolean = false
): RetentionAgent {
  return new RetentionAgent(userId, useAdminClient);
}
