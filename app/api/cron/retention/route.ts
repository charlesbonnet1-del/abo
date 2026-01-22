import { NextRequest, NextResponse } from 'next/server';
import { processRetentionAlerts } from '@/lib/agents/retention';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processRetentionAlerts();
    return NextResponse.json({
      success: true,
      processed: result.processed,
      errors: result.errors
    });
  } catch (error) {
    console.error('Retention cron error:', error);
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
