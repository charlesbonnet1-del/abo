import { NextResponse } from 'next/server';
import { createOrchestrator, OrchestratorEvent } from '@/lib/agents/agents';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, event } = body as {
      userId: string;
      event: OrchestratorEvent;
    };

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!event || !event.type || !event.subscriberId) {
      return NextResponse.json(
        { error: 'event with type and subscriberId is required' },
        { status: 400 }
      );
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
