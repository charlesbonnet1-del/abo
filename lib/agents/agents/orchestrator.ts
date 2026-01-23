import { RecoveryAgent, createRecoveryAgent } from './recovery-agent';
import { RetentionAgent, createRetentionAgent } from './retention-agent';
import { ConversionAgent, createConversionAgent } from './conversion-agent';
import { AgentActionResult } from './base-agent';
import { AgentType } from '../types/agent-types';

export interface OrchestratorEvent {
  type: string;
  subscriberId: string;
  data?: Record<string, unknown>;
}

export interface OrchestratorResult {
  handled: boolean;
  agentType?: AgentType;
  result?: AgentActionResult | null;
  error?: string;
}

/**
 * Orchestrateur des agents
 * Route les événements vers le bon agent et gère la coordination
 */
export class AgentOrchestrator {
  private userId: string;
  private useAdminClient: boolean;
  private recoveryAgent: RecoveryAgent | null = null;
  private retentionAgent: RetentionAgent | null = null;
  private conversionAgent: ConversionAgent | null = null;

  constructor(userId: string, useAdminClient: boolean = false) {
    this.userId = userId;
    this.useAdminClient = useAdminClient;
  }

  /**
   * Initialise un agent à la demande (lazy loading)
   */
  private getRecoveryAgent(): RecoveryAgent {
    if (!this.recoveryAgent) {
      this.recoveryAgent = createRecoveryAgent(this.userId, this.useAdminClient);
    }
    return this.recoveryAgent;
  }

  private getRetentionAgent(): RetentionAgent {
    if (!this.retentionAgent) {
      this.retentionAgent = createRetentionAgent(this.userId, this.useAdminClient);
    }
    return this.retentionAgent;
  }

  private getConversionAgent(): ConversionAgent {
    if (!this.conversionAgent) {
      this.conversionAgent = createConversionAgent(this.userId, this.useAdminClient);
    }
    return this.conversionAgent;
  }

  /**
   * Détermine quel agent doit traiter l'événement
   */
  private determineAgent(eventType: string): AgentType | null {
    // Recovery agent triggers
    const recoveryTriggers = ['payment_failed', 'payment_requires_action', 'invoice_payment_failed'];
    if (recoveryTriggers.includes(eventType)) {
      return 'recovery';
    }

    // Retention agent triggers
    const retentionTriggers = [
      'cancel_pending',
      'subscription_canceled',
      'downgrade',
      'subscription_expiring',
      'inactive_subscriber',
    ];
    if (retentionTriggers.includes(eventType)) {
      return 'retention';
    }

    // Conversion agent triggers
    const conversionTriggers = [
      'trial_ending',
      'trial_expired',
      'freemium_inactive',
      'freemium_active',
      'signup_no_subscription',
    ];
    if (conversionTriggers.includes(eventType)) {
      return 'conversion';
    }

    return null;
  }

  /**
   * Route et traite un événement
   */
  async handleEvent(event: OrchestratorEvent): Promise<OrchestratorResult> {
    const agentType = this.determineAgent(event.type);

    if (!agentType) {
      return {
        handled: false,
        error: `No agent found for event type: ${event.type}`,
      };
    }

    try {
      let result: AgentActionResult | null = null;

      switch (agentType) {
        case 'recovery':
          result = await this.handleRecoveryEvent(event);
          break;
        case 'retention':
          result = await this.handleRetentionEvent(event);
          break;
        case 'conversion':
          result = await this.handleConversionEvent(event);
          break;
      }

      return {
        handled: true,
        agentType,
        result,
      };
    } catch (error) {
      console.error(`Orchestrator error for ${event.type}:`, error);
      return {
        handled: false,
        agentType,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Traite les événements de recovery
   */
  private async handleRecoveryEvent(event: OrchestratorEvent): Promise<AgentActionResult | null> {
    const agent = this.getRecoveryAgent();
    await agent.initialize();

    const data = event.data || {};

    switch (event.type) {
      case 'payment_failed':
      case 'invoice_payment_failed':
        return agent.handlePaymentFailed(
          event.subscriberId,
          (data.invoice_id as string) || '',
          (data.amount as number) || 0,
          data.failure_reason as string | undefined
        );

      case 'payment_requires_action':
        return agent.handlePaymentFailed(
          event.subscriberId,
          (data.invoice_id as string) || '',
          (data.amount as number) || 0,
          'requires_action'
        );

      default:
        return null;
    }
  }

  /**
   * Traite les événements de rétention
   */
  private async handleRetentionEvent(event: OrchestratorEvent): Promise<AgentActionResult | null> {
    const agent = this.getRetentionAgent();
    await agent.initialize();

    const data = event.data || {};

    switch (event.type) {
      case 'cancel_pending':
        return agent.handleCancelPending(
          event.subscriberId,
          new Date(data.cancel_at as string),
          data.reason as string | undefined
        );

      case 'downgrade':
        return agent.handleDowngrade(
          event.subscriberId,
          data.from_plan as string,
          data.to_plan as string
        );

      case 'inactive_subscriber':
        return agent.handleInactiveSubscriber(
          event.subscriberId,
          data.days_since_last_activity as number
        );

      case 'subscription_expiring':
        return agent.handleCancelPending(
          event.subscriberId,
          new Date(data.expires_at as string),
          'subscription_expiring'
        );

      default:
        return null;
    }
  }

  /**
   * Traite les événements de conversion
   */
  private async handleConversionEvent(event: OrchestratorEvent): Promise<AgentActionResult | null> {
    const agent = this.getConversionAgent();
    await agent.initialize();

    const data = event.data || {};

    switch (event.type) {
      case 'trial_ending':
        return agent.handleTrialEnding(
          event.subscriberId,
          new Date(data.trial_end_date as string),
          data.days_remaining as number
        );

      case 'trial_expired':
        return agent.handleTrialExpired(
          event.subscriberId,
          new Date(data.expired_at as string)
        );

      case 'freemium_inactive':
        return agent.handleFreemiumInactive(
          event.subscriberId,
          data.days_since_last_activity as number
        );

      case 'freemium_active':
        return agent.handleFreemiumActive(
          event.subscriberId,
          data.usage_metrics as Record<string, number>
        );

      case 'signup_no_subscription':
        return agent.handleSignupNoSubscription(
          event.subscriberId,
          new Date(data.signup_date as string),
          data.days_since_signup as number
        );

      default:
        return null;
    }
  }

  /**
   * Traite plusieurs événements en batch
   */
  async handleEvents(events: OrchestratorEvent[]): Promise<OrchestratorResult[]> {
    const results: OrchestratorResult[] = [];

    for (const event of events) {
      const result = await this.handleEvent(event);
      results.push(result);
    }

    return results;
  }

  /**
   * Récupère les statistiques des agents
   */
  async getAgentStats(): Promise<Record<AgentType, { initialized: boolean }>> {
    return {
      recovery: { initialized: !!this.recoveryAgent },
      retention: { initialized: !!this.retentionAgent },
      conversion: { initialized: !!this.conversionAgent },
    };
  }
}

export function createOrchestrator(
  userId: string,
  useAdminClient: boolean = false
): AgentOrchestrator {
  return new AgentOrchestrator(userId, useAdminClient);
}
