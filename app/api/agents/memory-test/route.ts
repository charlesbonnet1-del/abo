import { NextResponse } from 'next/server';
import { createAgentMemory } from '@/lib/agents/core/memory';
import { getUser } from '@/lib/supabase/server';

export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Créer une instance de mémoire pour l'agent recovery
    const memory = createAgentMemory(user.id, 'recovery');

    // Test 1: Stocker une mémoire de fait
    const factId = await memory.storeFact('test-subscriber-id', {
      plan: 'pro',
      tenureMonths: 12,
      totalSpent: 94800, // 948€
      supportTickets: 2,
    });

    // Test 2: Stocker une interaction
    const interactionId = await memory.storeInteraction('test-subscriber-id', {
      type: 'email_sent',
      subject: 'Votre paiement a échoué',
      response: 'opened',
      date: new Date().toISOString(),
    });

    // Test 3: Stocker une préférence
    const preferenceId = await memory.storePreference('test-subscriber-id', {
      prefersDiscount: true,
      preferredTone: 'friendly',
      bestContactTime: 'morning',
    });

    // Test 4: Stocker un pattern
    const patternId = await memory.storePattern({
      trigger: 'payment_failed',
      bestAction: 'email_friendly_with_discount',
      successRate: 0.72,
      sampleSize: 25,
    });

    // Test 5: Récupérer les mémoires du subscriber
    const subscriberMemories = await memory.getSubscriberMemories('test-subscriber-id');

    // Test 6: Récupérer les mémoires par type
    const factMemories = await memory.getMemoriesByType('test-subscriber-id', 'fact');

    // Test 7: Test mémoire court terme
    memory.setShortTerm('last_action', 'email_sent');
    const shortTermValue = memory.getShortTerm('last_action');

    // Test 8: Résumer les mémoires
    const summary = memory.summarizeMemories(subscriberMemories);

    return NextResponse.json({
      success: true,
      tests: {
        factId,
        interactionId,
        preferenceId,
        patternId,
        subscriberMemoriesCount: subscriberMemories.length,
        factMemoriesCount: factMemories.length,
        shortTermValue,
        summary,
      },
    });
  } catch (error) {
    console.error('Memory test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Créer une instance de mémoire
    const memory = createAgentMemory(user.id, 'recovery');

    // Récupérer les mémoires de test
    const testMemories = await memory.getSubscriberMemories('test-subscriber-id');

    // Supprimer chaque mémoire de test
    for (const m of testMemories) {
      await memory.delete(m.id);
    }

    return NextResponse.json({
      success: true,
      deleted: testMemories.length,
    });
  } catch (error) {
    console.error('Memory cleanup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
