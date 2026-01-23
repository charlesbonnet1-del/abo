import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  Memory,
  MemorySearchResult,
  MemoryType,
  AgentType,
  InteractionMemory,
  PreferenceMemory,
  PatternMemory,
  OutcomeMemory,
  FactMemory,
} from '../types/agent-types';
import { generateEmbedding, formatEmbeddingForSupabase } from './embeddings';

interface ShortTermEntry {
  value: unknown;
  timestamp: number;
}

export class AgentMemory {
  private userId: string;
  private agentType: AgentType;
  private shortTermMemory: Map<string, ShortTermEntry> = new Map();
  private useAdminClient: boolean;

  constructor(userId: string, agentType: AgentType, useAdminClient: boolean = false) {
    this.userId = userId;
    this.agentType = agentType;
    this.useAdminClient = useAdminClient;
  }

  /**
   * Get Supabase client (admin or regular based on config)
   */
  private async getClient() {
    if (this.useAdminClient) {
      return createAdminClient();
    }
    return await createClient();
  }

  // ============================================
  // RÉCUPÉRATION DE MÉMOIRES
  // ============================================

  /**
   * Récupère toutes les mémoires pertinentes pour un subscriber
   */
  async getSubscriberMemories(subscriberId: string, limit: number = 50): Promise<Memory[]> {
    const supabase = await this.getClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('agent_memory')
      .select('*')
      .eq('user_id', this.userId)
      .eq('subscriber_id', subscriberId)
      .or(`agent_type.eq.${this.agentType},agent_type.eq.global`)
      .order('importance_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching subscriber memories:', error);
      return [];
    }

    // Mettre à jour last_accessed_at pour les mémoires accédées
    if (data && data.length > 0) {
      const ids = data.map((m) => m.id);
      // Note: Supabase doesn't support increment in update, so we use a separate query
      await supabase
        .from('agent_memory')
        .update({
          last_accessed_at: new Date().toISOString(),
        })
        .in('id', ids);
    }

    return this.mapMemories(data || []);
  }

  /**
   * Récupère les mémoires par type
   */
  async getMemoriesByType(
    subscriberId: string,
    memoryType: MemoryType,
    limit: number = 10
  ): Promise<Memory[]> {
    const supabase = await this.getClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('agent_memory')
      .select('*')
      .eq('user_id', this.userId)
      .eq('subscriber_id', subscriberId)
      .eq('memory_type', memoryType)
      .or(`agent_type.eq.${this.agentType},agent_type.eq.global`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching memories by type:', error);
      return [];
    }

    return this.mapMemories(data || []);
  }

  /**
   * Recherche des mémoires similaires à une situation donnée (recherche vectorielle)
   */
  async findSimilarMemories(
    situationDescription: string,
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<MemorySearchResult[]> {
    const supabase = await this.getClient();
    if (!supabase) return [];

    try {
      // Générer l'embedding de la situation
      const embedding = await generateEmbedding(situationDescription);

      // Recherche vectorielle via RPC
      const { data, error } = await supabase.rpc('match_memories', {
        query_embedding: formatEmbeddingForSupabase(embedding),
        match_threshold: threshold,
        match_count: limit,
        p_user_id: this.userId,
        p_agent_type: this.agentType,
      });

      if (error) {
        console.error('Error in vector search:', error);
        return [];
      }

      return (data || []).map((m: Record<string, unknown>) => ({
        ...this.mapMemory(m),
        similarity: m.similarity as number,
      }));
    } catch (e) {
      console.error('Error finding similar memories:', e);
      return [];
    }
  }

  /**
   * Récupère les patterns appris pour un type de trigger
   */
  async getPatterns(trigger: string): Promise<PatternMemory[]> {
    const supabase = await this.getClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('agent_memory')
      .select('*')
      .eq('user_id', this.userId)
      .eq('memory_type', 'pattern')
      .or(`agent_type.eq.${this.agentType},agent_type.eq.global`)
      .order('importance_score', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching patterns:', error);
      return [];
    }

    // Filter patterns that match the trigger
    return (data || [])
      .filter((m) => m.content?.trigger === trigger)
      .map((m) => m.content as PatternMemory);
  }

  // ============================================
  // STOCKAGE DE MÉMOIRES
  // ============================================

  /**
   * Stocke une nouvelle mémoire
   */
  async store(params: {
    subscriberId?: string;
    agentType?: AgentType | 'global';
    memoryType: MemoryType;
    content: Record<string, unknown>;
    importanceScore?: number;
    expiresAt?: Date;
  }): Promise<string | null> {
    const supabase = await this.getClient();
    if (!supabase) return null;

    try {
      // Générer l'embedding du contenu
      const contentString = JSON.stringify(params.content);
      const embedding = await generateEmbedding(contentString);

      const { data, error } = await supabase
        .from('agent_memory')
        .insert({
          user_id: this.userId,
          subscriber_id: params.subscriberId || null,
          agent_type: params.agentType || this.agentType,
          memory_type: params.memoryType,
          content: params.content,
          embedding: formatEmbeddingForSupabase(embedding),
          importance_score: params.importanceScore ?? 0.5,
          expires_at: params.expiresAt?.toISOString() || null,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error storing memory:', error);
        return null;
      }

      return data.id;
    } catch (e) {
      console.error('Error storing memory:', e);
      return null;
    }
  }

  /**
   * Stocke une interaction
   */
  async storeInteraction(
    subscriberId: string,
    interaction: InteractionMemory
  ): Promise<string | null> {
    return this.store({
      subscriberId,
      memoryType: 'interaction',
      content: {
        ...interaction,
        date: interaction.date || new Date().toISOString(),
      },
      importanceScore: 0.6,
    });
  }

  /**
   * Stocke une préférence détectée
   */
  async storePreference(
    subscriberId: string,
    preference: PreferenceMemory
  ): Promise<string | null> {
    return this.store({
      subscriberId,
      memoryType: 'preference',
      content: preference as unknown as Record<string, unknown>,
      importanceScore: 0.7,
    });
  }

  /**
   * Stocke un pattern appris
   */
  async storePattern(pattern: PatternMemory): Promise<string | null> {
    return this.store({
      agentType: this.agentType,
      memoryType: 'pattern',
      content: pattern as unknown as Record<string, unknown>,
      importanceScore: Math.min(0.9, 0.5 + pattern.successRate * 0.4),
    });
  }

  /**
   * Stocke un outcome (résultat d'une action)
   */
  async storeOutcome(subscriberId: string, outcome: OutcomeMemory): Promise<string | null> {
    const importance = outcome.result === 'positive' ? 0.8 : 0.6;

    return this.store({
      subscriberId,
      memoryType: 'outcome',
      content: {
        ...outcome,
        recordedAt: new Date().toISOString(),
      },
      importanceScore: importance,
    });
  }

  /**
   * Stocke des faits sur un subscriber
   */
  async storeFact(subscriberId: string, facts: FactMemory): Promise<string | null> {
    return this.store({
      subscriberId,
      agentType: 'global', // Les faits sont partagés entre agents
      memoryType: 'fact',
      content: {
        ...facts,
        updatedAt: new Date().toISOString(),
      },
      importanceScore: 0.8,
    });
  }

  // ============================================
  // MISE À JOUR DE MÉMOIRES
  // ============================================

  /**
   * Renforce l'importance d'une mémoire (apprentissage positif)
   */
  async reinforce(memoryId: string, boost: number = 0.1): Promise<void> {
    const supabase = await this.getClient();
    if (!supabase) return;

    await supabase.rpc('reinforce_memory', {
      p_memory_id: memoryId,
      p_boost: boost,
    });
  }

  /**
   * Affaiblit l'importance d'une mémoire (apprentissage négatif)
   */
  async weaken(memoryId: string, penalty: number = 0.05): Promise<void> {
    await this.reinforce(memoryId, -penalty);
  }

  /**
   * Met à jour le contenu d'une mémoire
   */
  async update(memoryId: string, content: Record<string, unknown>): Promise<void> {
    const supabase = await this.getClient();
    if (!supabase) return;

    // Regénérer l'embedding
    const embedding = await generateEmbedding(JSON.stringify(content));

    await supabase
      .from('agent_memory')
      .update({
        content,
        embedding: formatEmbeddingForSupabase(embedding),
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', memoryId);
  }

  /**
   * Supprime une mémoire
   */
  async delete(memoryId: string): Promise<void> {
    const supabase = await this.getClient();
    if (!supabase) return;

    await supabase.from('agent_memory').delete().eq('id', memoryId).eq('user_id', this.userId); // Sécurité
  }

  // ============================================
  // MÉMOIRE COURT TERME (SESSION)
  // ============================================

  /**
   * Stocke en mémoire court terme (non persisté)
   */
  setShortTerm(key: string, value: unknown): void {
    this.shortTermMemory.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Récupère de la mémoire court terme
   */
  getShortTerm<T = unknown>(key: string): T | undefined {
    const entry = this.shortTermMemory.get(key);
    return entry?.value as T | undefined;
  }

  /**
   * Vérifie si une clé existe en mémoire court terme
   */
  hasShortTerm(key: string): boolean {
    return this.shortTermMemory.has(key);
  }

  /**
   * Supprime une entrée de la mémoire court terme
   */
  deleteShortTerm(key: string): void {
    this.shortTermMemory.delete(key);
  }

  /**
   * Vide la mémoire court terme
   */
  clearShortTerm(): void {
    this.shortTermMemory.clear();
  }

  /**
   * Nettoie les entrées expirées de la mémoire court terme
   */
  cleanupShortTerm(maxAgeMs: number = 30 * 60 * 1000): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.shortTermMemory.forEach((entry, key) => {
      if (now - entry.timestamp > maxAgeMs) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.shortTermMemory.delete(key));
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  /**
   * Résume les mémoires en texte pour le contexte LLM
   */
  summarizeMemories(memories: Memory[]): string {
    if (memories.length === 0) {
      return 'Aucune mémoire disponible sur ce client.';
    }

    const byType: Record<string, Memory[]> = {};
    for (const m of memories) {
      if (!byType[m.memoryType]) byType[m.memoryType] = [];
      byType[m.memoryType].push(m);
    }

    const parts: string[] = [];

    if (byType.fact?.length) {
      const facts = byType.fact[0].content;
      parts.push(`Faits: ${JSON.stringify(facts)}`);
    }

    if (byType.preference?.length) {
      const prefs = byType.preference.map((m) => JSON.stringify(m.content)).join(', ');
      parts.push(`Préférences détectées: ${prefs}`);
    }

    if (byType.interaction?.length) {
      const recent = byType.interaction.slice(0, 3);
      const interactions = recent
        .map((m) => `${m.content.type} (${m.content.response || 'pas de réponse'})`)
        .join(', ');
      parts.push(`Interactions récentes: ${interactions}`);
    }

    if (byType.outcome?.length) {
      const positives = byType.outcome.filter((m) => m.content.result === 'positive').length;
      const total = byType.outcome.length;
      parts.push(`Historique: ${positives}/${total} actions positives`);
    }

    if (byType.pattern?.length) {
      const topPattern = byType.pattern[0].content as unknown as PatternMemory;
      parts.push(
        `Pattern connu: ${topPattern.bestAction} a ${Math.round(topPattern.successRate * 100)}% de succès`
      );
    }

    return parts.join('. ');
  }

  /**
   * Résume une seule mémoire
   */
  summarizeMemory(memory: Memory): string {
    const content = memory.content as Record<string, unknown>;
    switch (memory.memoryType) {
      case 'interaction':
        return `${content.type}: ${content.response || 'en attente'}`;
      case 'preference':
        return `Préfère: ${Object.entries(content)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')}`;
      case 'pattern': {
        const pattern = content as unknown as PatternMemory;
        return `${pattern.trigger} → ${pattern.bestAction} (${Math.round(pattern.successRate * 100)}%)`;
      }
      case 'outcome':
        return `${content.action}: ${content.result}`;
      case 'fact':
        return JSON.stringify(content);
      default:
        return JSON.stringify(content);
    }
  }

  /**
   * Mappe les données Supabase vers nos types
   */
  private mapMemories(data: Record<string, unknown>[]): Memory[] {
    return data.map((m) => this.mapMemory(m));
  }

  private mapMemory(m: Record<string, unknown>): Memory {
    return {
      id: m.id as string,
      userId: m.user_id as string,
      subscriberId: m.subscriber_id as string | undefined,
      agentType: m.agent_type as AgentType | 'global',
      memoryType: m.memory_type as MemoryType,
      content: m.content as Record<string, unknown>,
      importanceScore: parseFloat(String(m.importance_score)) || 0.5,
      accessCount: (m.access_count as number) || 0,
      createdAt: new Date(m.created_at as string),
      lastAccessedAt: new Date(m.last_accessed_at as string),
      expiresAt: m.expires_at ? new Date(m.expires_at as string) : undefined,
    };
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createAgentMemory(
  userId: string,
  agentType: AgentType,
  useAdminClient: boolean = false
): AgentMemory {
  return new AgentMemory(userId, agentType, useAdminClient);
}

// ============================================
// CLEANUP UTILITY
// ============================================

/**
 * Nettoie les mémoires expirées pour un utilisateur
 */
export async function cleanupUserMemories(
  userId: string,
  minImportance: number = 0.1,
  maxAgeDays: number = 365
): Promise<number> {
  const supabase = createAdminClient();
  if (!supabase) return 0;

  const { data, error } = await supabase.rpc('cleanup_old_memories', {
    p_user_id: userId,
    p_min_importance: minImportance,
    p_max_age_days: maxAgeDays,
  });

  if (error) {
    console.error('Error cleaning up memories:', error);
    return 0;
  }

  return data || 0;
}
