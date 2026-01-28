import { NextRequest, NextResponse } from 'next/server';
import { processOnboardingSequences } from '@/lib/agents/onboarding';
import { verifyCronSecret } from '@/lib/security';

export async function GET(request: NextRequest) {
  // Verify cron secret with constant-time comparison
  const authHeader = request.headers.get('authorization');
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processOnboardingSequences();
    return NextResponse.json({
      success: true,
      processed: result.processed,
      completed: result.completed,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Onboarding cron error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
