import Groq from 'groq-sdk';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  ReasoningStep,
  ReasoningStepType,
  ActionOption,
  EvaluatedOption,
  Situation,
  Memory,
  EpisodeSearchResult,
  AgentType,
  BrandSettings,
  AgentConfig,
} from '../types/agent-types';
import { AgentMemory } from './memory';
import { generateEmbedding, formatEmbeddingForSupabase } from './embeddings';

// Lazy initialization to avoid issues during build
let groqInstance: Groq | null = null;

function getGroq(): Groq {
  if (!groqInstance) {
    groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqInstance;
}

export class AgentReasoning {
  private userId: string;
  private agentType: AgentType;
  private memory: AgentMemory;
  private reasoningSteps: ReasoningStep[] = [];
  private actionId?: string;
  private useAdminClient: boolean;

  constructor(userId: string, agentType: AgentType, useAdminClient: boolean = false) {
    this.userId = userId;
    this.agentType = agentType;
    this.memory = new AgentMemory(userId, agentType, useAdminClient);
    this.useAdminClient = useAdminClient;
  }

  /**
   * Get Supabase client
   */
  private async getClient() {
    if (this.useAdminClient) {
      return createAdminClient();
    }
    return await createClient();
  }

  /**
   * Lie le raisonnement à une action pour l'observabilité
   */
  setActionId(actionId: string): void {
    this.actionId = actionId;
  }

  /**
   * Récupère les étapes de raisonnement (pour affichage)
   */
  getReasoningSteps(): ReasoningStep[] {
    return this.reasoningSteps;
  }

  /**
   * Processus de raisonnement complet
   */
  async reason(
    situation: Situation,
    agentConfig: AgentConfig,
    brandSettings: BrandSettings
  ): Promise<{
    decision: ActionOption;
    confidence: number;
    reasoning: ReasoningStep[];
  }> {
    this.reasoningSteps = [];

    try {
      // Étape 1: Collecte du contexte
      await this.gatherContext(situation);

      // Étape 2: Récupération des mémoires pertinentes
      const memories = await this.retrieveMemories(situation);

      // Étape 3: Recherche d'épisodes similaires
      const similarEpisodes = await this.findSimilarEpisodes(situation);

      // Étape 4: Génération des options
      const options = await this.generateOptions(
        situation,
        memories,
        similarEpisodes,
        agentConfig,
        brandSettings
      );

      // Étape 5: Évaluation des options
      const evaluatedOptions = await this.evaluateOptions(
        options,
        situation,
        memories,
        similarEpisodes,
        agentConfig
      );

      // Étape 6: Décision finale
      const decision = await this.makeDecision(evaluatedOptions, situation);

      // Sauvegarder les étapes de raisonnement si on a un actionId
      if (this.actionId) {
        await this.saveReasoningSteps();
      }

      return {
        decision: decision.option,
        confidence: decision.confidence,
        reasoning: this.reasoningSteps,
      };
    } catch (error) {
      console.error('Reasoning error:', error);

      // Fallback: retourner une action par défaut
      const fallbackOption: ActionOption = {
        action: 'email',
        strategy: 'friendly',
        details: { fallback: true, error: String(error) },
      };

      return {
        decision: fallbackOption,
        confidence: 0.3,
        reasoning: this.reasoningSteps,
      };
    }
  }

  // ============================================
  // ÉTAPE 1: COLLECTE DU CONTEXTE
  // ============================================

  private async gatherContext(situation: Situation): Promise<void> {
    const startTime = Date.now();

    const subscriberInfo = this.describeSubscriber(situation.subscriber);
    const triggerInfo = this.describeTrigger(situation.trigger, situation.context);

    const thought = `Je collecte les informations sur ce cas. ${subscriberInfo} ${triggerInfo}`;

    const step: ReasoningStep = {
      stepNumber: 1,
      stepType: 'context_gathering',
      thought,
      data: {
        subscriber: situation.subscriber,
        trigger: situation.trigger,
        context: situation.context,
        timestamp: situation.timestamp,
      },
      durationMs: Date.now() - startTime,
    };

    this.reasoningSteps.push(step);
  }

  private describeSubscriber(subscriber: Situation['subscriber']): string {
    const parts: string[] = [];

    parts.push(`Client: ${subscriber.name || subscriber.email}.`);

    if (subscriber.plan) {
      parts.push(`Plan: ${subscriber.plan}.`);
    }

    if (subscriber.mrr > 0) {
      parts.push(`MRR: ${(subscriber.mrr / 100).toFixed(2)}€.`);
    }

    if (subscriber.tenureMonths > 0) {
      parts.push(`Client depuis ${subscriber.tenureMonths} mois.`);
    }

    if (subscriber.previousInteractions > 0) {
      parts.push(`${subscriber.previousInteractions} interactions précédentes.`);
    }

    return parts.join(' ');
  }

  private describeTrigger(trigger: string, context: Record<string, unknown>): string {
    const triggerDescriptions: Record<string, string> = {
      payment_failed: 'Le paiement a échoué.',
      cancel_pending: "Le client a demandé l'annulation de son abonnement.",
      downgrade: 'Le client a downgrade vers un plan inférieur.',
      trial_ending: "La période d'essai se termine bientôt.",
      freemium_inactive: 'Utilisateur freemium inactif depuis un moment.',
      subscription_expiring: "L'abonnement expire bientôt.",
    };

    let description = triggerDescriptions[trigger] || `Événement: ${trigger}.`;

    if (context.amount && typeof context.amount === 'number') {
      description += ` Montant: ${(context.amount / 100).toFixed(2)}€.`;
    }

    if (context.days_until_expiry !== undefined) {
      description += ` Expire dans ${context.days_until_expiry} jours.`;
    }

    return description;
  }

  // ============================================
  // ÉTAPE 2: RÉCUPÉRATION DES MÉMOIRES
  // ============================================

  private async retrieveMemories(situation: Situation): Promise<Memory[]> {
    const startTime = Date.now();

    // Mémoires spécifiques au subscriber
    const subscriberMemories = situation.subscriber.id
      ? await this.memory.getSubscriberMemories(situation.subscriber.id, 20)
      : [];

    // Mémoires similaires (par embedding)
    const situationDescription = this.describeSituationForSearch(situation);
    const similarMemories = await this.memory.findSimilarMemories(situationDescription, 10, 0.6);

    // Combiner et dédupliquer
    const allMemories = [...subscriberMemories];
    for (const sm of similarMemories) {
      if (!allMemories.find((m) => m.id === sm.id)) {
        allMemories.push(sm);
      }
    }

    // Construire le résumé
    const memorySummary = this.buildMemorySummary(subscriberMemories, similarMemories);

    const step: ReasoningStep = {
      stepNumber: 2,
      stepType: 'memory_retrieval',
      thought: memorySummary,
      data: {
        subscriberMemoriesCount: subscriberMemories.length,
        similarMemoriesCount: similarMemories.length,
        totalMemories: allMemories.length,
        relevantMemories: allMemories.slice(0, 5).map((m) => ({
          id: m.id,
          type: m.memoryType,
          summary: this.memory.summarizeMemory(m),
          importance: m.importanceScore,
        })),
      },
      durationMs: Date.now() - startTime,
    };

    this.reasoningSteps.push(step);
    return allMemories;
  }

  private describeSituationForSearch(situation: Situation): string {
    return (
      `${situation.trigger} pour un client ${situation.subscriber.plan || 'standard'} ` +
      `avec MRR ${situation.subscriber.mrr / 100}€, ` +
      `client depuis ${situation.subscriber.tenureMonths} mois`
    );
  }

  private buildMemorySummary(subscriberMemories: Memory[], similarMemories: Memory[]): string {
    const parts: string[] = [];

    parts.push(`J'ai trouvé ${subscriberMemories.length} mémoires sur ce client`);
    parts.push(`et ${similarMemories.length} mémoires de situations similaires.`);

    if (subscriberMemories.length > 0) {
      const interactions = subscriberMemories.filter((m) => m.memoryType === 'interaction');
      const preferences = subscriberMemories.filter((m) => m.memoryType === 'preference');
      const outcomes = subscriberMemories.filter((m) => m.memoryType === 'outcome');

      if (interactions.length > 0) {
        parts.push(`Ce client a eu ${interactions.length} interactions passées.`);
      }

      if (preferences.length > 0) {
        const prefSummary = preferences.map((p) => this.memory.summarizeMemory(p)).join(', ');
        parts.push(`Préférences connues: ${prefSummary}.`);
      }

      if (outcomes.length > 0) {
        const positives = outcomes.filter((o) => o.content.result === 'positive').length;
        parts.push(`Historique: ${positives}/${outcomes.length} interactions positives.`);
      }
    }

    return parts.join(' ');
  }

  // ============================================
  // ÉTAPE 3: RECHERCHE D'ÉPISODES SIMILAIRES
  // ============================================

  private async findSimilarEpisodes(situation: Situation): Promise<EpisodeSearchResult[]> {
    const startTime = Date.now();
    const supabase = await this.getClient();

    let episodes: EpisodeSearchResult[] = [];

    if (!supabase) {
      this.reasoningSteps.push({
        stepNumber: 3,
        stepType: 'memory_retrieval',
        thought: "Pas de connexion à la base de données. C'est une situation nouvelle pour moi.",
        data: { totalEpisodes: 0, successCount: 0, failureCount: 0 },
        durationMs: Date.now() - startTime,
      });
      return episodes;
    }

    try {
      const situationDescription = this.describeSituationForSearch(situation);
      const embedding = await generateEmbedding(situationDescription);

      const { data, error } = await supabase.rpc('match_episodes', {
        query_embedding: formatEmbeddingForSupabase(embedding),
        match_threshold: 0.5,
        match_count: 15,
        p_user_id: this.userId,
        p_agent_type: this.agentType,
      });

      if (!error && data) {
        episodes = data.map((e: Record<string, unknown>) => ({
          id: e.id as string,
          userId: this.userId,
          agentType: this.agentType,
          subscriberId: e.subscriber_id as string | undefined,
          situation: e.situation as Situation,
          actionTaken: e.action_taken as { type: string; strategy: string; details: Record<string, unknown> },
          outcome: e.outcome as string,
          outcomeDetails: e.outcome_details as Record<string, unknown> | undefined,
          lessonsLearned: e.lessons_learned as Array<{ insight: string; confidence: number; applicableTo: Record<string, unknown> }> | undefined,
          createdAt: new Date(e.created_at as string),
          resolvedAt: e.resolved_at ? new Date(e.resolved_at as string) : undefined,
          similarity: e.similarity as number,
        }));
      }
    } catch (error) {
      console.error('Error finding similar episodes:', error);
    }

    // Analyser les épisodes
    const successEpisodes = episodes.filter((e) => e.outcome === 'success');
    const failureEpisodes = episodes.filter((e) => e.outcome === 'failure');

    const episodeSummary = this.buildEpisodeSummary(episodes, successEpisodes, failureEpisodes);

    const step: ReasoningStep = {
      stepNumber: 3,
      stepType: 'memory_retrieval',
      thought: episodeSummary,
      data: {
        totalEpisodes: episodes.length,
        successCount: successEpisodes.length,
        failureCount: failureEpisodes.length,
        topEpisodes: episodes.slice(0, 5).map((e) => ({
          similarity: e.similarity,
          action: e.actionTaken,
          outcome: e.outcome,
          lessons: e.lessonsLearned,
        })),
      },
      durationMs: Date.now() - startTime,
    };

    this.reasoningSteps.push(step);
    return episodes;
  }

  private buildEpisodeSummary(
    episodes: EpisodeSearchResult[],
    successes: EpisodeSearchResult[],
    failures: EpisodeSearchResult[]
  ): string {
    if (episodes.length === 0) {
      return "Je n'ai pas trouvé d'épisodes similaires dans le passé. C'est une situation nouvelle pour moi.";
    }

    const parts: string[] = [];
    parts.push(`J'ai trouvé ${episodes.length} situations similaires dans le passé.`);
    parts.push(`${successes.length} ont réussi, ${failures.length} ont échoué.`);

    // Analyser les stratégies gagnantes
    if (successes.length > 0) {
      const strategies = successes.map((s) => s.actionTaken.strategy);
      const strategyCounts = strategies.reduce(
        (acc, s) => {
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const topStrategy = Object.entries(strategyCounts).sort((a, b) => b[1] - a[1])[0];

      if (topStrategy) {
        parts.push(`La stratégie "${topStrategy[0]}" a fonctionné ${topStrategy[1]} fois.`);
      }
    }

    // Extraire les leçons
    const allLessons = episodes
      .flatMap((e) => e.lessonsLearned || [])
      .filter((l) => l.confidence > 0.6);

    if (allLessons.length > 0) {
      const topLesson = allLessons.sort((a, b) => b.confidence - a.confidence)[0];
      parts.push(`Leçon clé: "${topLesson.insight}"`);
    }

    return parts.join(' ');
  }

  // ============================================
  // ÉTAPE 4: GÉNÉRATION DES OPTIONS
  // ============================================

  private async generateOptions(
    situation: Situation,
    memories: Memory[],
    episodes: EpisodeSearchResult[],
    agentConfig: AgentConfig,
    brandSettings: BrandSettings
  ): Promise<ActionOption[]> {
    const startTime = Date.now();

    const prompt = this.buildOptionsPrompt(
      situation,
      memories,
      episodes,
      agentConfig,
      brandSettings
    );

    const groq = getGroq();
    const response = await groq.chat.completions.create(
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: this.getOptionsSystemPrompt(brandSettings) },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      },
      { signal: AbortSignal.timeout(30000) }
    );

    const options = this.parseOptionsResponse(response.choices[0].message.content || '');

    const optionsSummary =
      options.length > 0
        ? `J'ai généré ${options.length} options possibles: ${options.map((o, i) => `(${i + 1}) ${o.action} avec stratégie "${o.strategy}"`).join(', ')}.`
        : "Je n'ai pas pu générer d'options. Je vais utiliser une approche par défaut.";

    const step: ReasoningStep = {
      stepNumber: 4,
      stepType: 'option_generation',
      thought: optionsSummary,
      data: {
        optionsCount: options.length,
        options: options.map((o) => ({
          action: o.action,
          strategy: o.strategy,
          details: o.details,
        })),
      },
      durationMs: Date.now() - startTime,
    };

    this.reasoningSteps.push(step);

    // Si pas d'options, retourner une option par défaut
    if (options.length === 0) {
      return [
        {
          action: 'email',
          strategy: 'friendly',
          details: { default: true },
        },
      ];
    }

    return options;
  }

  private getOptionsSystemPrompt(brandSettings: BrandSettings): string {
    return `Tu es un agent IA spécialisé dans la gestion des abonnements.
Tu dois générer des options d'action pour une situation donnée.

Entreprise: ${brandSettings.companyName || 'Non spécifié'}
Ton: ${brandSettings.tone || 'neutral'}
Type de produit: ${brandSettings.productType || 'SaaS'}

Pour chaque option, tu dois spécifier:
- action: le type d'action (email, sms, discount, pause, call, etc.)
- strategy: l'approche (friendly, urgent, value_focused, empathetic, etc.)
- details: les détails spécifiques (discount_percent, message_tone, etc.)

Réponds UNIQUEMENT en JSON avec ce format:
{
  "options": [
    {
      "action": "email",
      "strategy": "friendly",
      "details": {"tone": "warm", "include_help_offer": true},
      "reasoning": "Pourquoi cette option est pertinente"
    }
  ]
}`;
  }

  private buildOptionsPrompt(
    situation: Situation,
    memories: Memory[],
    episodes: EpisodeSearchResult[],
    agentConfig: AgentConfig,
    brandSettings: BrandSettings
  ): string {
    const parts: string[] = [];

    parts.push('=== SITUATION ===');
    parts.push(`Trigger: ${situation.trigger}`);
    parts.push(`Client: ${situation.subscriber.name || situation.subscriber.email}`);
    parts.push(`Plan: ${situation.subscriber.plan || 'Non spécifié'}`);
    parts.push(`MRR: ${(situation.subscriber.mrr / 100).toFixed(2)}€`);
    parts.push(`Ancienneté: ${situation.subscriber.tenureMonths} mois`);
    parts.push(`Interactions précédentes: ${situation.subscriber.previousInteractions}`);

    if (Object.keys(situation.context).length > 0) {
      parts.push(`Contexte: ${JSON.stringify(situation.context)}`);
    }

    if (memories.length > 0) {
      parts.push('\n=== MÉMOIRES PERTINENTES ===');
      parts.push(this.memory.summarizeMemories(memories));
    }

    if (episodes.length > 0) {
      parts.push('\n=== ÉPISODES SIMILAIRES ===');
      const successRate = episodes.filter((e) => e.outcome === 'success').length / episodes.length;
      parts.push(`Taux de succès historique: ${(successRate * 100).toFixed(0)}%`);

      const topEpisodes = episodes.slice(0, 3);
      for (const ep of topEpisodes) {
        parts.push(
          `- ${ep.actionTaken.strategy}: ${ep.outcome} (similarité: ${(ep.similarity * 100).toFixed(0)}%)`
        );
      }
    }

    parts.push('\n=== CONTRAINTES ===');
    parts.push(`Stratégie template: ${agentConfig.strategyTemplate || 'moderate'}`);

    if (agentConfig.limitsConfig) {
      if (agentConfig.limitsConfig.maxEmailsClientWeek) {
        parts.push(`Max emails/semaine: ${agentConfig.limitsConfig.maxEmailsClientWeek}`);
      }
    }

    parts.push('\n=== VOIX DE MARQUE ===');
    parts.push(`Entreprise: ${brandSettings.companyName || 'Non spécifié'}`);
    parts.push(`Ton: ${brandSettings.tone || 'neutral'}`);
    if (brandSettings.values && brandSettings.values.length > 0) {
      parts.push(`Valeurs: ${brandSettings.values.join(', ')}`);
    }

    parts.push('\n=== DEMANDE ===');
    parts.push("Génère 2 à 4 options d'action pertinentes pour cette situation.");
    parts.push('Varie les approches (conservatrice, modérée, proactive).');

    return parts.join('\n');
  }

  private parseOptionsResponse(content: string): ActionOption[] {
    try {
      // Extraire le JSON de la réponse
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]);
      const options = parsed.options || [];

      return options.map((opt: Record<string, unknown>) => ({
        action: (opt.action as string) || 'email',
        strategy: (opt.strategy as string) || 'default',
        details: (opt.details as Record<string, unknown>) || {},
        reasoning: opt.reasoning as string | undefined,
      }));
    } catch (error) {
      console.error('Error parsing options response:', error);
      return [];
    }
  }

  // ============================================
  // ÉTAPE 5: ÉVALUATION DES OPTIONS
  // ============================================

  private async evaluateOptions(
    options: ActionOption[],
    situation: Situation,
    memories: Memory[],
    episodes: EpisodeSearchResult[],
    agentConfig: AgentConfig
  ): Promise<EvaluatedOption[]> {
    const startTime = Date.now();

    const prompt = this.buildEvaluationPrompt(
      options,
      situation,
      memories,
      episodes,
      agentConfig
    );

    const groq = getGroq();
    const response = await groq.chat.completions.create(
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: this.getEvaluationSystemPrompt() },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3, // Plus déterministe pour l'évaluation
        max_tokens: 2000,
      },
      { signal: AbortSignal.timeout(30000) }
    );

    const evaluatedOptions = this.parseEvaluationResponse(
      response.choices[0].message.content || '',
      options
    );

    // Trier par score décroissant
    evaluatedOptions.sort((a, b) => b.score - a.score);

    const evalSummary = this.buildEvaluationSummary(evaluatedOptions);

    const step: ReasoningStep = {
      stepNumber: 5,
      stepType: 'evaluation',
      thought: evalSummary,
      data: {
        evaluations: evaluatedOptions.map((o) => ({
          action: o.action,
          strategy: o.strategy,
          score: o.score,
          reasons: o.reasons,
        })),
      },
      durationMs: Date.now() - startTime,
    };

    this.reasoningSteps.push(step);
    return evaluatedOptions;
  }

  private getEvaluationSystemPrompt(): string {
    return `Tu es un évaluateur d'options d'action.
Pour chaque option, tu dois donner:
- Un score entre 0 et 1 (1 = meilleure option)
- Les raisons de ce score

Critères d'évaluation:
- Pertinence par rapport à la situation
- Probabilité de succès basée sur les épisodes passés
- Respect des préférences client connues
- Alignement avec la stratégie configurée

Réponds UNIQUEMENT en JSON:
{
  "evaluations": [
    {
      "option_index": 0,
      "score": 0.85,
      "reasons": ["Raison 1", "Raison 2"]
    }
  ]
}`;
  }

  private buildEvaluationPrompt(
    options: ActionOption[],
    situation: Situation,
    memories: Memory[],
    episodes: EpisodeSearchResult[],
    agentConfig: AgentConfig
  ): string {
    const parts: string[] = [];

    parts.push('=== OPTIONS À ÉVALUER ===');
    options.forEach((opt, i) => {
      parts.push(`Option ${i}: ${opt.action} / ${opt.strategy}`);
      parts.push(`  Détails: ${JSON.stringify(opt.details)}`);
      if (opt.reasoning) {
        parts.push(`  Raisonnement: ${opt.reasoning}`);
      }
    });

    parts.push('\n=== CONTEXTE CLIENT ===');
    parts.push(`MRR: ${(situation.subscriber.mrr / 100).toFixed(2)}€`);
    parts.push(`Ancienneté: ${situation.subscriber.tenureMonths} mois`);

    if (memories.length > 0) {
      const preferences = memories.filter((m) => m.memoryType === 'preference');
      if (preferences.length > 0) {
        parts.push('\nPréférences connues:');
        preferences.forEach((p) => {
          parts.push(`- ${JSON.stringify(p.content)}`);
        });
      }
    }

    if (episodes.length > 0) {
      parts.push('\n=== DONNÉES HISTORIQUES ===');

      // Calculer le taux de succès par stratégie
      const strategyStats: Record<string, { success: number; total: number }> = {};

      for (const ep of episodes) {
        const strat = ep.actionTaken.strategy;
        if (!strategyStats[strat]) {
          strategyStats[strat] = { success: 0, total: 0 };
        }
        strategyStats[strat].total++;
        if (ep.outcome === 'success') {
          strategyStats[strat].success++;
        }
      }

      for (const [strat, stats] of Object.entries(strategyStats)) {
        const rate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(0) : '0';
        parts.push(`Stratégie "${strat}": ${rate}% de succès (${stats.total} cas)`);
      }
    }

    parts.push('\n=== CONFIGURATION ===');
    parts.push(`Template: ${agentConfig.strategyTemplate || 'moderate'}`);

    parts.push('\nÉvalue chaque option avec un score de 0 à 1.');

    return parts.join('\n');
  }

  private parseEvaluationResponse(content: string, options: ActionOption[]): EvaluatedOption[] {
    try {
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        // Fallback: scores par défaut
        return options.map((opt, i) => ({
          ...opt,
          score: 0.5 - i * 0.1,
          reasons: ['Évaluation par défaut'],
        }));
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const evaluations = parsed.evaluations || [];

      return options.map((opt, i) => {
        const eval_ = evaluations.find(
          (e: { option_index: number; score?: number; reasons?: string[] }) => e.option_index === i
        );
        return {
          ...opt,
          score: eval_?.score ?? 0.5,
          reasons: eval_?.reasons ?? ["Pas d'évaluation spécifique"],
        };
      });
    } catch (error) {
      console.error('Error parsing evaluation response:', error);
      return options.map((opt, i) => ({
        ...opt,
        score: 0.5 - i * 0.1,
        reasons: ["Erreur d'évaluation"],
      }));
    }
  }

  private buildEvaluationSummary(evaluatedOptions: EvaluatedOption[]): string {
    const parts: string[] = [];

    parts.push("J'ai évalué chaque option.");

    evaluatedOptions.forEach((opt, i) => {
      parts.push(`Option ${i + 1} (${opt.strategy}): ${(opt.score * 100).toFixed(0)}%`);
    });

    if (evaluatedOptions.length > 0) {
      const best = evaluatedOptions[0];
      parts.push(
        `La meilleure option est "${best.strategy}" avec un score de ${(best.score * 100).toFixed(0)}%.`
      );

      if (best.reasons.length > 0) {
        parts.push(`Raisons: ${best.reasons.slice(0, 2).join('; ')}.`);
      }
    }

    return parts.join(' ');
  }

  // ============================================
  // ÉTAPE 6: DÉCISION FINALE
  // ============================================

  private async makeDecision(
    evaluatedOptions: EvaluatedOption[],
    situation: Situation
  ): Promise<{ option: ActionOption; confidence: number }> {
    const startTime = Date.now();

    if (evaluatedOptions.length === 0) {
      const fallback: ActionOption = {
        action: 'email',
        strategy: 'friendly',
        details: { fallback: true },
      };

      this.reasoningSteps.push({
        stepNumber: 6,
        stepType: 'decision',
        thought: "Aucune option disponible. J'utilise une approche par défaut: email amical.",
        data: { chosenOption: fallback, confidence: 0.3, trigger: situation.trigger },
        confidenceScore: 0.3,
        durationMs: Date.now() - startTime,
      });

      return { option: fallback, confidence: 0.3 };
    }

    const bestOption = evaluatedOptions[0];
    const confidence = bestOption.score;

    // Vérifier s'il y a une forte incertitude
    const secondBest = evaluatedOptions[1];
    const scoreDiff = secondBest ? bestOption.score - secondBest.score : 1;

    let thought = `Ma décision finale est: "${bestOption.action}" avec la stratégie "${bestOption.strategy}". `;
    thought += `Confiance: ${(confidence * 100).toFixed(0)}%. `;

    if (bestOption.reasons.length > 0) {
      thought += `Raisons principales: ${bestOption.reasons.slice(0, 2).join('; ')}. `;
    }

    if (scoreDiff < 0.1 && secondBest) {
      thought += `Note: L'option "${secondBest.strategy}" était proche (${(secondBest.score * 100).toFixed(0)}%), `;
      thought += `mais j'ai choisi la première car elle correspond mieux au contexte actuel.`;
    }

    const step: ReasoningStep = {
      stepNumber: 6,
      stepType: 'decision',
      thought,
      data: {
        trigger: situation.trigger,
        chosenOption: {
          action: bestOption.action,
          strategy: bestOption.strategy,
          details: bestOption.details,
        },
        confidence,
        scoreDifferenceWithSecond: scoreDiff,
        reasons: bestOption.reasons,
        alternativeConsidered: secondBest
          ? {
              strategy: secondBest.strategy,
              score: secondBest.score,
            }
          : null,
      },
      confidenceScore: confidence,
      durationMs: Date.now() - startTime,
    };

    this.reasoningSteps.push(step);

    return {
      option: bestOption,
      confidence,
    };
  }

  // ============================================
  // SAUVEGARDE DU RAISONNEMENT
  // ============================================

  private async saveReasoningSteps(): Promise<void> {
    if (!this.actionId || this.reasoningSteps.length === 0) return;

    const supabase = await this.getClient();
    if (!supabase) return;

    const stepsToInsert = this.reasoningSteps.map((step) => ({
      agent_action_id: this.actionId,
      step_number: step.stepNumber,
      step_type: step.stepType,
      thought: step.thought,
      data: step.data || null,
      confidence_score: step.confidenceScore || null,
      duration_ms: step.durationMs || null,
    }));

    const { error } = await supabase.from('agent_reasoning_logs').insert(stepsToInsert);

    if (error) {
      console.error('Error saving reasoning steps:', error);
    }
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createAgentReasoning(
  userId: string,
  agentType: AgentType,
  useAdminClient: boolean = false
): AgentReasoning {
  return new AgentReasoning(userId, agentType, useAdminClient);
}

// ============================================
// UTILITAIRE: CHARGER LE RAISONNEMENT D'UNE ACTION
// ============================================

export async function getReasoningForAction(actionId: string): Promise<ReasoningStep[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('agent_reasoning_logs')
    .select('*')
    .eq('agent_action_id', actionId)
    .order('step_number', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    stepNumber: row.step_number,
    stepType: row.step_type as ReasoningStepType,
    thought: row.thought,
    data: row.data,
    confidenceScore: row.confidence_score ? parseFloat(row.confidence_score) : undefined,
    durationMs: row.duration_ms,
  }));
}
