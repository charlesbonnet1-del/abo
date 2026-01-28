import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createOrchestrator } from '@/lib/agents/agents';
import { getUser } from '@/lib/supabase/server';
import { validateBody, orchestratorEventSchema } from '@/lib/validation';

const orchestratorTestSchema = z.object({
  userId: z.string().uuid('userId doit etre un UUID valide'),
  event: orchestratorEventSchema,
});

export async function POST(request: Request) {
  try {
    // Vérifier l'authentification
    const authenticatedUser = await getUser();
    if (!authenticatedUser) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // Valider le corps de la requête avec Zod
    const validation = await validateBody(request, orchestratorTestSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const { userId, event } = validation.data;

    // Valider que l'utilisateur ne peut déclencher des actions que pour lui-même
    if (userId !== authenticatedUser.id) {
      return NextResponse.json({ error: 'Non autorise: userId ne correspond pas a l\'utilisateur connecte' }, { status: 403 });
    }

    // Créer l'orchestrateur avec admin client pour les tests
    const orchestrator = createOrchestrator(userId, true);

    // Traiter l'événement
    const result = await orchestrator.handleEvent(event);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Orchestrator test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Agent Orchestrator Test Endpoint',
    usage: {
      method: 'POST',
      body: {
        userId: 'uuid - User ID',
        event: {
          type: 'event type (e.g., payment_failed, cancel_pending, trial_ending)',
          subscriberId: 'uuid - Subscriber ID',
          data: 'optional event data object',
        },
      },
    },
    supportedEvents: {
      recovery: ['payment_failed', 'payment_requires_action', 'invoice_payment_failed'],
      retention: [
        'cancel_pending',
        'subscription_canceled',
        'downgrade',
        'subscription_expiring',
        'inactive_subscriber',
      ],
      conversion: [
        'trial_ending',
        'trial_expired',
        'freemium_inactive',
        'freemium_active',
        'signup_no_subscription',
      ],
    },
  });
}
