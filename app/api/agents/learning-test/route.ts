import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAgentLearning, batchAnalyzeEpisodes } from '@/lib/agents/core/learning';
import { Situation, ActionTaken } from '@/lib/agents/types/agent-types';

export async function POST() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase non disponible' }, { status: 500 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Créer le module d'apprentissage
    const learning = createAgentLearning(user.id, 'recovery');

    // Créer une situation de test
    const testSituation: Situation = {
      subscriber: {
        id: 'test-subscriber-learning',
        email: 'learning-test@example.com',
        name: 'Client Test Learning',
        plan: 'Pro',
        mrr: 7900,
        tenureMonths: 8,
        previousInteractions: 3,
      },
      trigger: 'payment_failed',
      context: {
        amount: 7900,
        failure_reason: 'card_declined',
      },
      timestamp: new Date(),
    };

    // Action de test
    const testAction: ActionTaken = {
      type: 'email',
      strategy: 'friendly_with_discount',
      details: {
        discount_percent: 15,
        tone: 'empathetic',
        include_payment_link: true,
      },
    };

    // Test 1: Enregistrer un épisode
    const episodeId = await learning.recordEpisode({
      subscriberId: testSituation.subscriber.id,
      situation: testSituation,
      actionTaken: testAction,
    });

    // Test 2: Résoudre l'épisode (succès)
    let resolveResult = false;
    if (episodeId) {
      resolveResult = await learning.resolveEpisode({
        episodeId,
        outcome: 'success',
        outcomeDetails: {
          response_time: '2 hours',
          payment_recovered: true,
          revenue_impact: 7900,
        },
      });
    }

    // Test 3: Enregistrer un feedback
    const feedbackId = await learning.recordFeedback({
      subscriberId: testSituation.subscriber.id,
      feedbackType: 'recovered',
      context: { test: true },
      rating: 5,
      comment: 'Test de feedback',
    });

    // Test 4: Obtenir les stats d'apprentissage
    const stats = await learning.getLearningStats();

    // Test 5: Obtenir les insights sur le trigger
    const triggerInsights = await learning.getTriggerInsights('payment_failed');

    // Test 6: Batch analyze (si assez de données)
    const batchResults = await batchAnalyzeEpisodes(user.id, 'recovery', 50);

    return NextResponse.json({
      success: true,
      tests: {
        episodeRecorded: !!episodeId,
        episodeId,
        episodeResolved: resolveResult,
        feedbackRecorded: !!feedbackId,
        feedbackId,
      },
      learningStats: stats,
      triggerInsights,
      batchAnalysis: {
        patternsFound: batchResults.patterns.length,
        insightsGenerated: batchResults.insights.length,
        topPatterns: batchResults.patterns.slice(0, 3),
        insights: batchResults.insights.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Learning test error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du test d\'apprentissage', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase non disponible' }, { status: 500 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Nettoyer les données de test
    const { count: episodesDeleted } = await supabase
      .from('agent_episodes')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
      .eq('subscriber_id', 'test-subscriber-learning');

    const { count: feedbackDeleted } = await supabase
      .from('agent_feedback')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
      .eq('subscriber_id', 'test-subscriber-learning');

    return NextResponse.json({
      success: true,
      deleted: {
        episodes: episodesDeleted || 0,
        feedback: feedbackDeleted || 0,
      },
    });
  } catch (error) {
    console.error('Learning cleanup error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du nettoyage', details: String(error) },
      { status: 500 }
    );
  }
}
