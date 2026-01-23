import { BaseAgent, AgentEvent, AgentActionResult } from './base-agent';
import { Situation, ActionOption } from '../types/agent-types';
import { sendAgentEmail } from './email-sender';

export class RecoveryAgent extends BaseAgent {
  constructor(userId: string, useAdminClient: boolean = false) {
    super(userId, 'recovery', useAdminClient);
  }

  /**
   * Triggers supportés par cet agent
   */
  getSupportedTriggers(): string[] {
    return ['payment_failed', 'payment_requires_action', 'invoice_payment_failed'];
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
    const amount =
      typeof situation.context.amount === 'number'
        ? `${(situation.context.amount / 100).toFixed(2)}€`
        : 'montant inconnu';

    if (decision.action === 'email') {
      return `Email de relance (${decision.strategy}) à ${subscriberName} pour ${amount}`;
    }

    if (decision.action === 'discount') {
      return `Offre de réduction ${decision.details.discount_percent}% à ${subscriberName}`;
    }

    return `Action ${decision.action} pour ${subscriberName}`;
  }

  /**
   * Exécute l'action concrète
   */
  protected async performAction(action: Record<string, unknown>): Promise<void> {
    const result = action.result as Record<string, unknown>;
    const actionType = action.action_type as string;

    if (actionType === 'email' || actionType === 'email_reminder') {
      // Générer et envoyer l'email
      await sendAgentEmail({
        to: result.subscriber_email as string,
        subscriberName: result.subscriber_name as string | undefined,
        subject: result.email_subject as string | undefined,
        body: result.email_body as string | undefined,
        agentType: 'recovery',
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

    // Pour les autres types d'actions (discount, etc.),
    // on pourrait appeler l'API Stripe ici
  }

  /**
   * Gère un paiement échoué
   */
  async handlePaymentFailed(
    subscriberId: string,
    invoiceId: string,
    amount: number,
    failureReason?: string
  ): Promise<AgentActionResult | null> {
    return this.handleEvent({
      type: 'payment_failed',
      subscriberId,
      data: {
        invoice_id: invoiceId,
        amount,
        failure_reason: failureReason,
        step: 1,
      },
    });
  }

  /**
   * Gère une relance de suivi (step 2, 3, 4...)
   */
  async handleFollowUp(
    subscriberId: string,
    invoiceId: string,
    step: number,
    amount: number
  ): Promise<AgentActionResult | null> {
    return this.handleEvent({
      type: 'payment_failed',
      subscriberId,
      data: {
        invoice_id: invoiceId,
        amount,
        step,
        is_followup: true,
      },
    });
  }
}

export function createRecoveryAgent(userId: string, useAdminClient: boolean = false): RecoveryAgent {
  return new RecoveryAgent(userId, useAdminClient);
}
