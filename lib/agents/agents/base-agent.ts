import { createClient, createAdminClient } from '@/lib/supabase/server';
import { AgentMemory, createAgentMemory } from '../core/memory';
import { AgentReasoning, createAgentReasoning } from '../core/reasoning';
import { AgentLearning, createAgentLearning } from '../core/learning';
import {
  AgentType,
  Situation,
  SubscriberSnapshot,
  ActionOption,
  AgentConfig,
  BrandSettings,
  ReasoningStep,
} from '../types/agent-types';

export interface AgentEvent {
  type: string;
  subscriberId: string;
  data: Record<string, unknown>;
}

export interface AgentActionResult {
  actionId: string;
  status: 'pending_approval' | 'approved' | 'executed' | 'failed';
  decision: ActionOption;
  confidence: number;
  reasoning: ReasoningStep[];
  requiresApproval: boolean;
}

export abstract class BaseAgent {
  protected userId: string;
  protected agentType: AgentType;
  protected memory: AgentMemory;
  protected reasoning: AgentReasoning;
  protected learning: AgentLearning;
  protected config: AgentConfig | null = null;
  protected brandSettings: BrandSettings | null = null;
  protected initialized: boolean = false;
  protected useAdminClient: boolean;

  constructor(userId: string, agentType: AgentType, useAdminClient: boolean = false) {
    this.userId = userId;
    this.agentType = agentType;
    this.useAdminClient = useAdminClient;
    this.memory = createAgentMemory(userId, agentType, useAdminClient);
    this.reasoning = createAgentReasoning(userId, agentType, useAdminClient);
    this.learning = createAgentLearning(userId, agentType, useAdminClient);
  }

  /**
   * Get Supabase client
   */
  protected async getClient() {
    if (this.useAdminClient) {
      return createAdminClient();
    }
    return await createClient();
  }

  // ============================================
  // INITIALISATION
  // ============================================

  /**
   * Initialise l'agent avec sa config et les brand settings
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const supabase = await this.getClient();
    if (!supabase) {
      this.config = this.getDefaultConfig();
      this.brandSettings = this.getDefaultBrandSettings();
      this.initialized = true;
      return;
    }

    const [configResult, brandResult] = await Promise.all([
      supabase
        .from('agent_config')
        .select('*')
        .eq('user_id', this.userId)
        .eq('agent_type', this.agentType)
        .single(),
      supabase.from('brand_settings').select('*').eq('user_id', this.userId).single(),
    ]);

    this.config = configResult.data
      ? this.mapAgentConfig(configResult.data)
      : this.getDefaultConfig();
    this.brandSettings = brandResult.data
      ? this.mapBrandSettings(brandResult.data)
      : this.getDefaultBrandSettings();
    this.initialized = true;
  }

  /**
   * Vérifie si l'agent est actif
   */
  isActive(): boolean {
    return this.config?.isActive === true;
  }

  /**
   * Récupère le type d'agent
   */
  getAgentType(): AgentType {
    return this.agentType;
  }

  /**
   * Récupère la config de l'agent
   */
  getConfig(): AgentConfig | null {
    return this.config;
  }

  /**
   * Récupère les brand settings
   */
  getBrandSettings(): BrandSettings | null {
    return this.brandSettings;
  }

  // ============================================
  // TRAITEMENT DES ÉVÉNEMENTS
  // ============================================

  /**
   * Point d'entrée principal : traite un événement
   */
  async handleEvent(event: AgentEvent): Promise<AgentActionResult | null> {
    await this.initialize();

    if (!this.isActive()) {
      console.log(`Agent ${this.agentType} is not active for user ${this.userId}`);
      return null;
    }

    // Vérifier si cet événement est géré par cet agent
    if (!this.shouldHandleEvent(event)) {
      return null;
    }

    try {
      // 1. Construire la situation
      const situation = await this.buildSituation(event);

      // 2. Vérifier les limites (nombre d'actions par jour, etc.)
      const limitCheck = await this.checkLimits(situation);
      if (!limitCheck.allowed) {
        console.log(`Limit reached: ${limitCheck.reason}`);
        return null;
      }

      // 3. Raisonner et décider
      const { decision, confidence, reasoning } = await this.reasoning.reason(
        situation,
        this.config!,
        this.brandSettings!
      );

      // 4. Vérifier si validation requise
      const requiresApproval = await this.checkRequiresApproval(decision, confidence);

      // 5. Créer l'action
      const actionId = await this.createAction(situation, decision, confidence, requiresApproval);

      // 6. Lier le raisonnement à l'action
      this.reasoning.setActionId(actionId);

      // 7. Sauvegarder le raisonnement
      await this.saveReasoningToAction(actionId, reasoning);

      // 8. Enregistrer l'épisode pour l'apprentissage
      await this.learning.recordEpisode({
        subscriberId: situation.subscriber.id,
        situation,
        actionTaken: {
          type: decision.action,
          strategy: decision.strategy,
          details: decision.details,
        },
      });

      // 9. Si auto-approuvé, exécuter
      if (!requiresApproval) {
        await this.executeAction(actionId);
      }

      return {
        actionId,
        status: requiresApproval ? 'pending_approval' : 'executed',
        decision,
        confidence,
        reasoning,
        requiresApproval,
      };
    } catch (error) {
      console.error(`Error handling event in ${this.agentType}:`, error);
      throw error;
    }
  }

  /**
   * Vérifie si cet agent doit gérer cet événement
   */
  protected abstract shouldHandleEvent(event: AgentEvent): boolean;

  /**
   * Construit la description de l'action pour l'affichage
   */
  protected abstract buildActionDescription(
    decision: ActionOption,
    situation: Situation
  ): string;

  /**
   * Retourne les triggers supportés par cet agent
   */
  abstract getSupportedTriggers(): string[];

  // ============================================
  // CONSTRUCTION DE LA SITUATION
  // ============================================

  /**
   * Construit la situation à partir d'un événement
   */
  protected async buildSituation(event: AgentEvent): Promise<Situation> {
    const supabase = await this.getClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Récupérer le subscriber
    const { data: subscriber } = await supabase
      .from('subscriber')
      .select('*')
      .eq('id', event.subscriberId)
      .single();

    if (!subscriber) {
      throw new Error(`Subscriber not found: ${event.subscriberId}`);
    }

    // Compter les interactions précédentes
    const { count: interactionCount } = await supabase
      .from('agent_communication')
      .select('*', { count: 'exact', head: true })
      .eq('subscriber_id', event.subscriberId);

    // Construire le snapshot
    const subscriberSnapshot: SubscriberSnapshot = {
      id: subscriber.id,
      email: subscriber.email,
      name: subscriber.name,
      plan: subscriber.plan_name,
      mrr: subscriber.mrr || 0,
      tenureMonths: this.calculateTenure(subscriber.created_at),
      healthScore: subscriber.health_score,
      lastPaymentStatus: subscriber.last_payment_status,
      lastPaymentAt: subscriber.last_payment_at,
      previousInteractions: interactionCount || 0,
      totalSpent: subscriber.total_spent,
      country: subscriber.country,
    };

    return {
      subscriber: subscriberSnapshot,
      trigger: event.type,
      context: event.data,
      timestamp: new Date(),
    };
  }

  // ============================================
  // VÉRIFICATION DES LIMITES
  // ============================================

  /**
   * Vérifie si les limites sont respectées
   */
  protected async checkLimits(
    situation: Situation
  ): Promise<{ allowed: boolean; reason?: string }> {
    const supabase = await this.getClient();
    const limits = this.config?.limitsConfig;

    if (!limits || !supabase) {
      return { allowed: true };
    }

    // Vérifier le nombre d'actions par jour
    if (limits.maxActionsDay) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('agent_action')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('agent_type', this.agentType)
        .gte('created_at', today.toISOString());

      if ((count || 0) >= limits.maxActionsDay) {
        return { allowed: false, reason: `Max ${limits.maxActionsDay} actions per day reached` };
      }
    }

    // Vérifier le nombre d'emails par client par semaine
    if (limits.maxEmailsClientWeek && situation.subscriber.id) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { count } = await supabase
        .from('agent_communication')
        .select('*', { count: 'exact', head: true })
        .eq('subscriber_id', situation.subscriber.id)
        .eq('channel', 'email')
        .gte('created_at', weekAgo.toISOString());

      if ((count || 0) >= limits.maxEmailsClientWeek) {
        return {
          allowed: false,
          reason: `Max ${limits.maxEmailsClientWeek} emails per week for this client`,
        };
      }
    }

    // Vérifier les heures d'envoi
    if (limits.sendHoursStart !== undefined && limits.sendHoursEnd !== undefined) {
      const now = new Date();
      const hour = now.getHours();

      if (hour < limits.sendHoursStart || hour >= limits.sendHoursEnd) {
        return {
          allowed: false,
          reason: `Outside sending hours (${limits.sendHoursStart}h-${limits.sendHoursEnd}h)`,
        };
      }
    }

    // Vérifier si week-end
    if (limits.noWeekend) {
      const day = new Date().getDay();
      if (day === 0 || day === 6) {
        return { allowed: false, reason: 'No actions on weekends' };
      }
    }

    return { allowed: true };
  }

  // ============================================
  // VÉRIFICATION HUMAN-IN-THE-LOOP
  // ============================================

  /**
   * Vérifie si une validation humaine est requise
   */
  protected async checkRequiresApproval(
    decision: ActionOption,
    confidence: number
  ): Promise<boolean> {
    if (!this.config) return true;

    const confidenceLevel = this.config.confidenceLevel;

    // Mode review_all : toujours valider
    if (confidenceLevel === 'review_all') {
      return true;
    }

    // Mode full_auto : jamais valider (sauf exceptions)
    if (confidenceLevel === 'full_auto') {
      // Toujours valider les remboursements
      if (decision.action === 'refund') {
        return true;
      }
      // Valider les grosses réductions
      const discountPercent = decision.details.discount_percent;
      if (typeof discountPercent === 'number' && discountPercent > 30) {
        return true;
      }
      return false;
    }

    // Mode auto_with_copy : validation basée sur la confiance et le type d'action
    if (confidenceLevel === 'auto_with_copy') {
      // Faible confiance : valider
      if (confidence < 0.6) {
        return true;
      }
      // Actions sensibles : valider
      if (['refund', 'discount', 'pause'].includes(decision.action)) {
        return true;
      }
      return false;
    }

    return true;
  }

  // ============================================
  // CRÉATION ET EXÉCUTION D'ACTIONS
  // ============================================

  /**
   * Crée une action dans la base de données
   */
  protected async createAction(
    situation: Situation,
    decision: ActionOption,
    confidence: number,
    requiresApproval: boolean
  ): Promise<string> {
    const supabase = await this.getClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const description = this.buildActionDescription(decision, situation);

    const { data, error } = await supabase
      .from('agent_action')
      .insert({
        user_id: this.userId,
        agent_type: this.agentType,
        action_type: decision.action,
        subscriber_id: situation.subscriber.id,
        description,
        status: requiresApproval ? 'pending_approval' : 'approved',
        result: {
          strategy: decision.strategy,
          details: decision.details,
          confidence,
          trigger: situation.trigger,
          subscriber_email: situation.subscriber.email,
          subscriber_name: situation.subscriber.name,
        },
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  }

  /**
   * Exécute une action approuvée
   */
  async executeAction(actionId: string): Promise<void> {
    const supabase = await this.getClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Récupérer l'action
    const { data: action, error: fetchError } = await supabase
      .from('agent_action')
      .select('*, subscriber(*)')
      .eq('id', actionId)
      .single();

    if (fetchError || !action) {
      throw new Error(`Action not found: ${actionId}`);
    }

    // Vérifier que l'action est prête à être exécutée
    if (!['approved', 'pending_approval'].includes(action.status)) {
      throw new Error(`Action ${actionId} cannot be executed (status: ${action.status})`);
    }

    try {
      // Exécuter selon le type d'action
      await this.performAction(action);

      // Mettre à jour le statut
      await supabase
        .from('agent_action')
        .update({
          status: 'executed',
          executed_at: new Date().toISOString(),
        })
        .eq('id', actionId);
    } catch (error) {
      // Marquer comme échoué
      await supabase
        .from('agent_action')
        .update({
          status: 'failed',
          result: {
            ...action.result,
            error: String(error),
          },
        })
        .eq('id', actionId);

      throw error;
    }
  }

  /**
   * Effectue l'action concrète (à implémenter par les sous-classes)
   */
  protected abstract performAction(action: Record<string, unknown>): Promise<void>;

  // ============================================
  // APPRENTISSAGE
  // ============================================

  /**
   * Enregistre le résultat d'une action pour l'apprentissage
   */
  async recordOutcome(
    actionId: string,
    outcome: 'success' | 'failure' | 'partial' | 'ignored',
    details?: Record<string, unknown>
  ): Promise<void> {
    // Trouver l'épisode associé et le résoudre
    const supabase = await this.getClient();
    if (!supabase) return;

    // Récupérer l'action pour trouver l'épisode
    const { data: action } = await supabase
      .from('agent_action')
      .select('subscriber_id, created_at')
      .eq('id', actionId)
      .single();

    if (action) {
      // Chercher l'épisode correspondant
      const { data: episodes } = await supabase
        .from('agent_episodes')
        .select('id')
        .eq('user_id', this.userId)
        .eq('agent_type', this.agentType)
        .eq('subscriber_id', action.subscriber_id)
        .eq('outcome', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (episodes && episodes.length > 0) {
        await this.learning.resolveEpisode({
          episodeId: episodes[0].id,
          outcome,
          outcomeDetails: details,
        });
      }
    }
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  /**
   * Sauvegarde le raisonnement lié à une action
   */
  protected async saveReasoningToAction(
    actionId: string,
    reasoning: ReasoningStep[]
  ): Promise<void> {
    const supabase = await this.getClient();
    if (!supabase) return;

    const stepsToInsert = reasoning.map((step) => ({
      agent_action_id: actionId,
      step_number: step.stepNumber,
      step_type: step.stepType,
      thought: step.thought,
      data: step.data || null,
      confidence_score: step.confidenceScore || null,
      duration_ms: step.durationMs || null,
    }));

    await supabase.from('agent_reasoning_logs').insert(stepsToInsert);
  }

  protected calculateTenure(createdAt: string | null): number {
    if (!createdAt) return 0;
    const created = new Date(createdAt);
    const now = new Date();
    const months =
      (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
    return Math.max(0, months);
  }

  protected mapAgentConfig(data: Record<string, unknown>): AgentConfig {
    return {
      id: data.id as string,
      userId: data.user_id as string,
      agentType: data.agent_type as AgentType,
      isActive: data.is_active as boolean,
      confidenceLevel:
        (data.confidence_level as 'review_all' | 'auto_with_copy' | 'full_auto') || 'review_all',
      notificationChannels: (data.notification_channels as string[]) || ['app'],
      strategyTemplate:
        (data.strategy_template as 'conservative' | 'moderate' | 'aggressive' | 'custom') ||
        'moderate',
      strategyConfig: (data.strategy_config as Record<string, unknown>) || {},
      offersConfig: (data.offers_config as Record<string, unknown>) || {},
      limitsConfig: (data.limits_config as AgentConfig['limitsConfig']) || {
        maxActionsDay: 50,
        maxEmailsClientWeek: 3,
        maxOffersClientYear: 4,
        sendHoursStart: 9,
        sendHoursEnd: 19,
        timezone: 'Europe/Paris',
        noWeekend: false,
      },
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  protected mapBrandSettings(data: Record<string, unknown>): BrandSettings {
    return {
      id: data.id as string,
      userId: data.user_id as string,
      companyName: data.company_name as string | undefined,
      productType: data.product_type as string | undefined,
      productDescription: data.product_description as string | undefined,
      industry: data.industry as string | undefined,
      targetAudience: data.target_audience as string | undefined,
      features: (data.features as BrandSettings['features']) || [],
      ahaMomentKnown: (data.aha_moment_known as boolean) || false,
      ahaMomentDescription: data.aha_moment_description as string | undefined,
      objectives: (data.objectives as BrandSettings['objectives']) || [],
      tone: (data.tone as BrandSettings['tone']) || 'neutral',
      humor: (data.humor as BrandSettings['humor']) || 'none',
      language: (data.language as string) || 'fr',
      values: (data.values as string[]) || [],
      neverSay: (data.never_say as string[]) || [],
      alwaysMention: (data.always_mention as string[]) || [],
      exampleEmails: (data.example_emails as string[]) || [],
      signature: data.signature as string | undefined,
      segmentationEnabled: (data.segmentation_enabled as boolean) || false,
      segments: (data.segments as BrandSettings['segments']) || [],
    };
  }

  protected getDefaultConfig(): AgentConfig {
    return {
      id: 'default',
      userId: this.userId,
      agentType: this.agentType,
      isActive: false,
      confidenceLevel: 'review_all',
      notificationChannels: ['app'],
      strategyTemplate: 'moderate',
      strategyConfig: {},
      offersConfig: {},
      limitsConfig: {
        maxActionsDay: 50,
        maxEmailsClientWeek: 3,
        maxOffersClientYear: 4,
        sendHoursStart: 9,
        sendHoursEnd: 19,
        timezone: 'Europe/Paris',
        noWeekend: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  protected getDefaultBrandSettings(): BrandSettings {
    return {
      id: 'default',
      userId: this.userId,
      companyName: 'Mon Entreprise',
      tone: 'neutral',
      humor: 'none',
      language: 'fr',
      ahaMomentKnown: false,
      segmentationEnabled: false,
    };
  }
}
