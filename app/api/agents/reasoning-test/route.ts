import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAgentReasoning } from '@/lib/agents/core/reasoning';
import { Situation, AgentConfig, BrandSettings } from '@/lib/agents/types/agent-types';

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

    // Récupérer la config agent et brand settings
    const [agentConfigResult, brandSettingsResult] = await Promise.all([
      supabase
        .from('agent_config')
        .select('*')
        .eq('user_id', user.id)
        .eq('agent_type', 'recovery')
        .single(),
      supabase.from('brand_settings').select('*').eq('user_id', user.id).single(),
    ]);

    // Créer une situation de test
    const testSituation: Situation = {
      subscriber: {
        id: 'test-subscriber-id',
        email: 'test@example.com',
        name: 'Client Test',
        plan: 'Pro',
        mrr: 7900, // 79€
        tenureMonths: 6,
        previousInteractions: 2,
      },
      trigger: 'payment_failed',
      context: {
        amount: 7900,
        failure_reason: 'card_declined',
      },
      timestamp: new Date(),
    };

    // Config par défaut si pas trouvée
    const agentConfig: AgentConfig = agentConfigResult.data || {
      id: 'default',
      userId: user.id,
      agentType: 'recovery',
      isActive: true,
      confidenceLevel: 'review_all',
      notificationChannels: ['app', 'email'],
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

    // Brand settings par défaut si pas trouvés
    const brandSettings: BrandSettings = brandSettingsResult.data || {
      id: 'default',
      userId: user.id,
      companyName: 'Mon Entreprise',
      tone: 'friendly',
      humor: 'subtle',
      language: 'fr',
      ahaMomentKnown: false,
      segmentationEnabled: false,
    };

    // Créer le module de raisonnement
    const reasoning = createAgentReasoning(user.id, 'recovery');

    // Lancer le raisonnement
    const startTime = Date.now();
    const result = await reasoning.reason(testSituation, agentConfig, brandSettings);
    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      totalTimeMs: totalTime,
      decision: result.decision,
      confidence: result.confidence,
      reasoningSteps: result.reasoning.map((step) => ({
        step: step.stepNumber,
        type: step.stepType,
        thought: step.thought,
        durationMs: step.durationMs,
      })),
    });
  } catch (error) {
    console.error('Reasoning test error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du test de raisonnement', details: String(error) },
      { status: 500 }
    );
  }
}
