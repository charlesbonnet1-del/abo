import Groq from 'groq-sdk';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  Lesson,
  Situation,
  ActionTaken,
  OutcomeType,
  AgentType,
  PatternMemory,
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

export class AgentLearning {
  private userId: string;
  private agentType: AgentType;
  private memory: AgentMemory;
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

  // ============================================
  // ENREGISTREMENT DES ÉPISODES
  // ============================================

  /**
   * Enregistre un nouvel épisode (action prise par l'agent)
   */
  async recordEpisode(params: {
    subscriberId?: string;
    situation: Situation;
    actionTaken: ActionTaken;
  }): Promise<string | null> {
    const supabase = await this.getClient();
    if (!supabase) return null;

    try {
      // Générer l'embedding de la situation
      const situationDescription = this.describeSituation(params.situation);
      const embedding = await generateEmbedding(situationDescription);

      const { data, error } = await supabase
        .from('agent_episodes')
        .insert({
          user_id: this.userId,
          agent_type: this.agentType,
          subscriber_id: params.subscriberId || null,
          situation: params.situation,
          action_taken: params.actionTaken,
          outcome: 'pending',
          situation_embedding: formatEmbeddingForSupabase(embedding),
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error recording episode:', error);
        return null;
      }

      return data.id;
    } catch (e) {
      console.error('Error recording episode:', e);
      return null;
    }
  }

  /**
   * Met à jour l'outcome d'un épisode et déclenche l'apprentissage
   */
  async resolveEpisode(params: {
    episodeId: string;
    outcome: OutcomeType;
    outcomeDetails?: Record<string, unknown>;
  }): Promise<boolean> {
    const supabase = await this.getClient();
    if (!supabase) return false;

    try {
      // Récupérer l'épisode
      const { data: episode, error: fetchError } = await supabase
        .from('agent_episodes')
        .select('*')
        .eq('id', params.episodeId)
        .single();

      if (fetchError || !episode) {
        console.error('Episode not found:', fetchError);
        return false;
      }

      // Extraire les leçons de cet épisode
      const lessons = await this.extractLessons(
        episode.situation as Situation,
        episode.action_taken as ActionTaken,
        params.outcome,
        params.outcomeDetails
      );

      // Mettre à jour l'épisode
      const { error: updateError } = await supabase
        .from('agent_episodes')
        .update({
          outcome: params.outcome,
          outcome_details: params.outcomeDetails || null,
          lessons_learned: lessons,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', params.episodeId);

      if (updateError) {
        console.error('Error updating episode:', updateError);
        return false;
      }

      // Déclencher l'apprentissage
      await this.learnFromEpisode({
        situation: episode.situation as Situation,
        actionTaken: episode.action_taken as ActionTaken,
        outcome: params.outcome,
        outcomeDetails: params.outcomeDetails,
        lessons,
        subscriberId: episode.subscriber_id,
      });

      return true;
    } catch (e) {
      console.error('Error resolving episode:', e);
      return false;
    }
  }

  // ============================================
  // EXTRACTION DE LEÇONS
  // ============================================

  /**
   * Extrait des leçons d'un épisode via le LLM
   */
  private async extractLessons(
    situation: Situation,
    actionTaken: ActionTaken,
    outcome: OutcomeType,
    outcomeDetails?: Record<string, unknown>
  ): Promise<Lesson[]> {
    try {
      const groq = getGroq();

      const prompt = this.buildLessonsPrompt(situation, actionTaken, outcome, outcomeDetails);

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: this.getLessonsSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      return this.parseLessonsResponse(response.choices[0].message.content || '');
    } catch (e) {
      console.error('Error extracting lessons:', e);
      return [];
    }
  }

  private getLessonsSystemPrompt(): string {
    return `Tu es un système d'apprentissage pour agents IA de gestion d'abonnements.
Analyse l'action prise et son résultat pour extraire des leçons applicables.

Pour chaque leçon, tu dois spécifier:
- insight: Une observation actionnable en français
- confidence: Un score de 0 à 1 (1 = très confiant)
- applicableTo: Les conditions où cette leçon s'applique (plan, tenure, trigger, etc.)
- recommendation: Une recommandation pour les actions futures

Réponds UNIQUEMENT en JSON:
{
  "lessons": [
    {
      "insight": "Les clients Pro avec +6 mois répondent bien aux offres de pause",
      "confidence": 0.8,
      "applicableTo": {"plan": "pro", "tenure_min": 6},
      "recommendation": "Proposer une pause plutôt qu'une réduction"
    }
  ]
}`;
  }

  private buildLessonsPrompt(
    situation: Situation,
    actionTaken: ActionTaken,
    outcome: OutcomeType,
    outcomeDetails?: Record<string, unknown>
  ): string {
    const parts: string[] = [];

    parts.push('=== SITUATION ===');
    parts.push(`Trigger: ${situation.trigger}`);
    parts.push(`Client: ${situation.subscriber.plan || 'standard'}`);
    parts.push(`MRR: ${(situation.subscriber.mrr / 100).toFixed(2)}€`);
    parts.push(`Ancienneté: ${situation.subscriber.tenureMonths} mois`);

    parts.push('\n=== ACTION PRISE ===');
    parts.push(`Type: ${actionTaken.type}`);
    parts.push(`Stratégie: ${actionTaken.strategy}`);
    parts.push(`Détails: ${JSON.stringify(actionTaken.details)}`);

    parts.push('\n=== RÉSULTAT ===');
    parts.push(`Outcome: ${outcome}`);
    if (outcomeDetails) {
      parts.push(`Détails: ${JSON.stringify(outcomeDetails)}`);
    }

    parts.push('\n=== DEMANDE ===');
    parts.push("Extrais 1 à 3 leçons de cette expérience.");
    parts.push("Concentre-toi sur ce qui peut être généralisé à d'autres situations similaires.");

    return parts.join('\n');
  }

  private parseLessonsResponse(content: string): Lesson[] {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]);
      const lessons = parsed.lessons || [];

      return lessons.map((l: Record<string, unknown>) => ({
        insight: (l.insight as string) || '',
        confidence: (l.confidence as number) || 0.5,
        applicableTo: (l.applicableTo as Record<string, unknown>) || {},
        recommendation: l.recommendation as string | undefined,
      }));
    } catch (e) {
      console.error('Error parsing lessons:', e);
      return [];
    }
  }

  // ============================================
  // APPRENTISSAGE
  // ============================================

  /**
   * Apprend d'un épisode résolu
   */
  private async learnFromEpisode(params: {
    situation: Situation;
    actionTaken: ActionTaken;
    outcome: OutcomeType;
    outcomeDetails?: Record<string, unknown>;
    lessons: Lesson[];
    subscriberId?: string;
  }): Promise<void> {
    // 1. Enregistrer l'outcome dans la mémoire du subscriber
    if (params.subscriberId) {
      await this.memory.storeOutcome(params.subscriberId, {
        action: `${params.actionTaken.type}_${params.actionTaken.strategy}`,
        result: this.mapOutcomeToResult(params.outcome),
        revenueImpact: (params.outcomeDetails?.revenue_impact as number) || undefined,
        details: {
          trigger: params.situation.trigger,
          action_details: params.actionTaken.details,
          outcome_details: params.outcomeDetails,
        },
      });
    }

    // 2. Mettre à jour ou créer des patterns
    await this.updatePatterns(params.situation, params.actionTaken, params.outcome);

    // 3. Renforcer ou affaiblir les mémoires pertinentes
    await this.updateMemoryRelevance(params.situation, params.outcome);

    // 4. Détecter et stocker les préférences client
    if (params.subscriberId && params.outcome === 'success') {
      await this.detectPreferences(params.subscriberId, params.actionTaken);
    }
  }

  private mapOutcomeToResult(outcome: OutcomeType): 'positive' | 'negative' | 'neutral' {
    switch (outcome) {
      case 'success':
        return 'positive';
      case 'failure':
        return 'negative';
      case 'partial':
      case 'pending':
      case 'ignored':
      default:
        return 'neutral';
    }
  }

  // ============================================
  // GESTION DES PATTERNS
  // ============================================

  /**
   * Met à jour les patterns basés sur le résultat
   */
  private async updatePatterns(
    situation: Situation,
    actionTaken: ActionTaken,
    outcome: OutcomeType
  ): Promise<void> {
    const supabase = await this.getClient();
    if (!supabase) return;

    const trigger = situation.trigger;
    const actionKey = `${actionTaken.type}_${actionTaken.strategy}`;

    // Chercher un pattern existant
    const existingPatterns = await this.memory.getPatterns(trigger);
    const existingPattern = existingPatterns.find((p) => p.bestAction === actionKey);

    if (existingPattern) {
      // Mettre à jour le pattern existant
      const isSuccess = outcome === 'success';
      const newSampleSize = existingPattern.sampleSize + 1;
      const currentSuccesses = existingPattern.successRate * existingPattern.sampleSize;
      const newSuccessRate = (currentSuccesses + (isSuccess ? 1 : 0)) / newSampleSize;

      // Trouver et mettre à jour la mémoire du pattern
      const { data: memories } = await supabase
        .from('agent_memory')
        .select('id, content')
        .eq('user_id', this.userId)
        .eq('memory_type', 'pattern')
        .eq('agent_type', this.agentType);

      const patternMemory = memories?.find(
        (m) =>
          (m.content as PatternMemory).trigger === trigger &&
          (m.content as PatternMemory).bestAction === actionKey
      );

      if (patternMemory) {
        const updatedPattern: PatternMemory = {
          ...existingPattern,
          successRate: newSuccessRate,
          sampleSize: newSampleSize,
        };

        await this.memory.update(patternMemory.id, updatedPattern as unknown as Record<string, unknown>);

        // Renforcer ou affaiblir selon le résultat
        if (isSuccess) {
          await this.memory.reinforce(patternMemory.id, 0.05);
        } else {
          await this.memory.weaken(patternMemory.id, 0.03);
        }
      }
    } else if (outcome === 'success') {
      // Créer un nouveau pattern si l'action a réussi
      const newPattern: PatternMemory = {
        trigger,
        bestAction: actionKey,
        successRate: 1.0,
        sampleSize: 1,
        applicableTo: {
          plan: situation.subscriber.plan,
          tenure_range: this.getTenureRange(situation.subscriber.tenureMonths),
        },
      };

      await this.memory.storePattern(newPattern);
    }
  }

  private getTenureRange(months: number): string {
    if (months <= 3) return '0-3';
    if (months <= 6) return '3-6';
    if (months <= 12) return '6-12';
    return '12+';
  }

  // ============================================
  // MISE À JOUR DE LA PERTINENCE DES MÉMOIRES
  // ============================================

  /**
   * Renforce ou affaiblit les mémoires pertinentes
   */
  private async updateMemoryRelevance(situation: Situation, outcome: OutcomeType): Promise<void> {
    // Trouver les mémoires similaires à cette situation
    const situationDescription = this.describeSituation(situation);
    const similarMemories = await this.memory.findSimilarMemories(situationDescription, 10, 0.7);

    const isPositive = outcome === 'success';
    const boost = isPositive ? 0.05 : -0.03;

    for (const memory of similarMemories) {
      // Plus la mémoire est similaire, plus l'effet est fort
      const adjustedBoost = boost * memory.similarity;
      await this.memory.reinforce(memory.id, adjustedBoost);
    }
  }

  // ============================================
  // DÉTECTION DES PRÉFÉRENCES
  // ============================================

  /**
   * Détecte et stocke les préférences d'un client basé sur ses réponses
   */
  private async detectPreferences(subscriberId: string, actionTaken: ActionTaken): Promise<void> {
    // Analyser l'action qui a fonctionné pour détecter les préférences
    const preferences: Record<string, unknown> = {};

    // Préférence de ton
    if (actionTaken.strategy.includes('friendly') || actionTaken.strategy.includes('warm')) {
      preferences.preferredTone = 'friendly';
    } else if (actionTaken.strategy.includes('urgent')) {
      preferences.preferredTone = 'urgent';
    } else if (actionTaken.strategy.includes('formal')) {
      preferences.preferredTone = 'formal';
    }

    // Préférence pour les réductions
    if (actionTaken.details.discount_percent || actionTaken.details.include_discount) {
      preferences.prefersDiscount = true;
    }

    // Seulement stocker si on a détecté quelque chose
    if (Object.keys(preferences).length > 0) {
      // Vérifier si une préférence existe déjà
      const existingPrefs = await this.memory.getMemoriesByType(subscriberId, 'preference', 1);

      if (existingPrefs.length > 0) {
        // Fusionner avec les préférences existantes
        const merged = { ...existingPrefs[0].content, ...preferences };
        await this.memory.update(existingPrefs[0].id, merged);
      } else {
        // Créer une nouvelle préférence
        await this.memory.storePreference(subscriberId, preferences);
      }
    }
  }

  // ============================================
  // FEEDBACK UTILISATEUR
  // ============================================

  /**
   * Enregistre un feedback de l'utilisateur
   */
  async recordFeedback(params: {
    agentActionId?: string;
    subscriberId?: string;
    feedbackType: 'approved' | 'rejected' | 'converted' | 'churned' | 'recovered' | 'manual_rating';
    context?: Record<string, unknown>;
    rating?: number;
    comment?: string;
  }): Promise<string | null> {
    const supabase = await this.getClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('agent_feedback')
        .insert({
          user_id: this.userId,
          agent_action_id: params.agentActionId || null,
          subscriber_id: params.subscriberId || null,
          feedback_type: params.feedbackType,
          context: params.context || null,
          rating: params.rating || null,
          comment: params.comment || null,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error recording feedback:', error);
        return null;
      }

      // Convertir le feedback en outcome si lié à une action
      if (params.agentActionId) {
        const outcome = this.feedbackToOutcome(params.feedbackType);
        if (outcome) {
          // Chercher l'épisode lié à cette action
          const { data: episodes } = await supabase
            .from('agent_episodes')
            .select('id')
            .eq('user_id', this.userId)
            .eq('outcome', 'pending')
            .order('created_at', { ascending: false })
            .limit(1);

          if (episodes && episodes.length > 0) {
            await this.resolveEpisode({
              episodeId: episodes[0].id,
              outcome,
              outcomeDetails: {
                feedback_type: params.feedbackType,
                rating: params.rating,
                comment: params.comment,
              },
            });
          }
        }
      }

      return data.id;
    } catch (e) {
      console.error('Error recording feedback:', e);
      return null;
    }
  }

  private feedbackToOutcome(
    feedbackType: string
  ): OutcomeType | null {
    switch (feedbackType) {
      case 'approved':
      case 'converted':
      case 'recovered':
        return 'success';
      case 'rejected':
      case 'churned':
        return 'failure';
      default:
        return null;
    }
  }

  // ============================================
  // ANALYTICS & INSIGHTS
  // ============================================

  /**
   * Obtient les statistiques d'apprentissage
   */
  async getLearningStats(): Promise<{
    totalEpisodes: number;
    successRate: number;
    topPatterns: PatternMemory[];
    recentLessons: Lesson[];
  }> {
    const supabase = await this.getClient();
    if (!supabase) {
      return {
        totalEpisodes: 0,
        successRate: 0,
        topPatterns: [],
        recentLessons: [],
      };
    }

    // Compter les épisodes
    const { count: totalEpisodes } = await supabase
      .from('agent_episodes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId)
      .eq('agent_type', this.agentType);

    // Compter les succès
    const { count: successCount } = await supabase
      .from('agent_episodes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId)
      .eq('agent_type', this.agentType)
      .eq('outcome', 'success');

    const successRate = totalEpisodes && successCount ? successCount / totalEpisodes : 0;

    // Top patterns
    const patterns = await this.getTopPatterns(5);

    // Leçons récentes
    const { data: recentEpisodes } = await supabase
      .from('agent_episodes')
      .select('lessons_learned')
      .eq('user_id', this.userId)
      .eq('agent_type', this.agentType)
      .not('lessons_learned', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentLessons: Lesson[] = (recentEpisodes || [])
      .flatMap((e) => (e.lessons_learned as Lesson[]) || [])
      .slice(0, 10);

    return {
      totalEpisodes: totalEpisodes || 0,
      successRate,
      topPatterns: patterns,
      recentLessons,
    };
  }

  /**
   * Obtient les meilleurs patterns
   */
  async getTopPatterns(limit: number = 5): Promise<PatternMemory[]> {
    const supabase = await this.getClient();
    if (!supabase) return [];

    const { data } = await supabase
      .from('agent_memory')
      .select('content')
      .eq('user_id', this.userId)
      .eq('memory_type', 'pattern')
      .or(`agent_type.eq.${this.agentType},agent_type.eq.global`)
      .order('importance_score', { ascending: false })
      .limit(limit);

    return (data || []).map((m) => m.content as PatternMemory);
  }

  /**
   * Obtient les insights sur un trigger spécifique
   */
  async getTriggerInsights(trigger: string): Promise<{
    totalCases: number;
    successRate: number;
    bestStrategy: string | null;
    avgTimeToResolution: number | null;
  }> {
    const supabase = await this.getClient();
    if (!supabase) {
      return {
        totalCases: 0,
        successRate: 0,
        bestStrategy: null,
        avgTimeToResolution: null,
      };
    }

    // Récupérer tous les épisodes pour ce trigger
    const { data: episodes } = await supabase
      .from('agent_episodes')
      .select('*')
      .eq('user_id', this.userId)
      .eq('agent_type', this.agentType)
      .not('outcome', 'eq', 'pending');

    // Filtrer par trigger (dans situation.trigger)
    const triggerEpisodes = (episodes || []).filter(
      (e) => (e.situation as Situation)?.trigger === trigger
    );

    if (triggerEpisodes.length === 0) {
      return {
        totalCases: 0,
        successRate: 0,
        bestStrategy: null,
        avgTimeToResolution: null,
      };
    }

    const successes = triggerEpisodes.filter((e) => e.outcome === 'success');
    const successRate = successes.length / triggerEpisodes.length;

    // Trouver la meilleure stratégie
    const strategyStats: Record<string, { success: number; total: number }> = {};
    for (const ep of triggerEpisodes) {
      const strategy = (ep.action_taken as ActionTaken)?.strategy || 'unknown';
      if (!strategyStats[strategy]) {
        strategyStats[strategy] = { success: 0, total: 0 };
      }
      strategyStats[strategy].total++;
      if (ep.outcome === 'success') {
        strategyStats[strategy].success++;
      }
    }

    let bestStrategy: string | null = null;
    let bestRate = 0;
    for (const [strategy, stats] of Object.entries(strategyStats)) {
      if (stats.total >= 3) {
        // Au moins 3 cas pour être significatif
        const rate = stats.success / stats.total;
        if (rate > bestRate) {
          bestRate = rate;
          bestStrategy = strategy;
        }
      }
    }

    // Calculer le temps moyen de résolution
    const resolvedEpisodes = triggerEpisodes.filter((e) => e.resolved_at);
    let avgTimeToResolution: number | null = null;
    if (resolvedEpisodes.length > 0) {
      const totalTime = resolvedEpisodes.reduce((acc, e) => {
        const created = new Date(e.created_at).getTime();
        const resolved = new Date(e.resolved_at).getTime();
        return acc + (resolved - created);
      }, 0);
      avgTimeToResolution = totalTime / resolvedEpisodes.length / (1000 * 60 * 60); // En heures
    }

    return {
      totalCases: triggerEpisodes.length,
      successRate,
      bestStrategy,
      avgTimeToResolution,
    };
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  private describeSituation(situation: Situation): string {
    return (
      `${situation.trigger} pour un client ${situation.subscriber.plan || 'standard'} ` +
      `avec MRR ${situation.subscriber.mrr / 100}€, ` +
      `client depuis ${situation.subscriber.tenureMonths} mois`
    );
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createAgentLearning(
  userId: string,
  agentType: AgentType,
  useAdminClient: boolean = false
): AgentLearning {
  return new AgentLearning(userId, agentType, useAdminClient);
}

// ============================================
// UTILITAIRES DE BATCH LEARNING
// ============================================

/**
 * Analyse un lot d'épisodes pour extraire des patterns globaux
 */
export async function batchAnalyzeEpisodes(
  userId: string,
  agentType: AgentType,
  limit: number = 100
): Promise<{
  patterns: PatternMemory[];
  insights: string[];
}> {
  const supabase = await createClient();
  if (!supabase) {
    return { patterns: [], insights: [] };
  }

  // Récupérer les épisodes résolus
  const { data: episodes } = await supabase
    .from('agent_episodes')
    .select('*')
    .eq('user_id', userId)
    .eq('agent_type', agentType)
    .not('outcome', 'eq', 'pending')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!episodes || episodes.length === 0) {
    return { patterns: [], insights: [] };
  }

  // Analyser les patterns par trigger + action
  const patternMap: Record<
    string,
    {
      trigger: string;
      action: string;
      successes: number;
      failures: number;
      plans: string[];
      tenures: number[];
    }
  > = {};

  for (const ep of episodes) {
    const situation = ep.situation as Situation;
    const action = ep.action_taken as ActionTaken;
    const key = `${situation.trigger}::${action.type}_${action.strategy}`;

    if (!patternMap[key]) {
      patternMap[key] = {
        trigger: situation.trigger,
        action: `${action.type}_${action.strategy}`,
        successes: 0,
        failures: 0,
        plans: [],
        tenures: [],
      };
    }

    if (ep.outcome === 'success') {
      patternMap[key].successes++;
    } else if (ep.outcome === 'failure') {
      patternMap[key].failures++;
    }

    if (situation.subscriber.plan) {
      patternMap[key].plans.push(situation.subscriber.plan);
    }
    patternMap[key].tenures.push(situation.subscriber.tenureMonths);
  }

  // Convertir en patterns
  const patterns: PatternMemory[] = [];
  const insights: string[] = [];

  for (const data of Object.values(patternMap)) {
    const total = data.successes + data.failures;
    if (total < 3) continue; // Pas assez de données

    const successRate = data.successes / total;
    const avgTenure =
      data.tenures.reduce((a, b) => a + b, 0) / data.tenures.length;

    patterns.push({
      trigger: data.trigger,
      bestAction: data.action,
      successRate,
      sampleSize: total,
      applicableTo: {
        avg_tenure: avgTenure,
        most_common_plan: mostCommon(data.plans),
      },
    });

    // Générer des insights
    if (successRate >= 0.7) {
      insights.push(
        `La stratégie "${data.action}" fonctionne bien pour "${data.trigger}" (${Math.round(successRate * 100)}% de succès sur ${total} cas)`
      );
    } else if (successRate <= 0.3 && total >= 5) {
      insights.push(
        `La stratégie "${data.action}" est peu efficace pour "${data.trigger}" (${Math.round(successRate * 100)}% de succès sur ${total} cas) - à éviter`
      );
    }
  }

  // Trier les patterns par taux de succès
  patterns.sort((a, b) => b.successRate - a.successRate);

  return { patterns, insights };
}

function mostCommon<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;

  const counts = new Map<T, number>();
  let maxCount = 0;
  let maxItem: T = arr[0];

  for (const item of arr) {
    const count = (counts.get(item) || 0) + 1;
    counts.set(item, count);
    if (count > maxCount) {
      maxCount = count;
      maxItem = item;
    }
  }

  return maxItem;
}
