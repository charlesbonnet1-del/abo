import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendExpirationNotification } from '@/lib/agents/resend';
import { expireOldOpportunities } from '@/lib/agents/conversion';
import { verifyCronSecret } from '@/lib/security';

// Lazy initialization for admin client
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabaseAdmin;
}

async function processExpiredActions(): Promise<{ expired: number; notified: number }> {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48h ago

  // Find expired actions (excluding refunds which might need longer review)
  const { data: expiredActions, error } = await getSupabaseAdmin()
    .from('agent_action')
    .select('*, subscriber(*)')
    .eq('status', 'pending_approval')
    .not('action_type', 'ilike', '%refund%')
    .lt('created_at', cutoff.toISOString());

  if (error) {
    console.error('Error fetching expired actions:', error);
    return { expired: 0, notified: 0 };
  }

  let expired = 0;
  let notified = 0;

  for (const action of expiredActions || []) {
    try {
      // Mark as expired
      await getSupabaseAdmin()
        .from('agent_action')
        .update({ status: 'expired' })
        .eq('id', action.id);

      expired++;

      // Get user email
      const { data: user } = await getSupabaseAdmin()
        .from('user')
        .select('email')
        .eq('id', action.user_id)
        .single();

      if (user?.email) {
        // Send notification
        const result = await sendExpirationNotification({
          userEmail: user.email,
          actionDescription: action.description || 'Action agent',
          agentType: action.agent_type
        });

        if (result.success) {
          notified++;
        }
      }
    } catch (err) {
      console.error(`Error processing expired action ${action.id}:`, err);
    }
  }

  return { expired, notified };
}

export async function GET(request: NextRequest) {
  // Verify cron secret with constant-time comparison
  const authHeader = request.headers.get('authorization');
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Process expired actions
    const actionResult = await processExpiredActions();

    // Also expire old conversion opportunities
    const expiredOpportunities = await expireOldOpportunities();

    return NextResponse.json({
      success: true,
      actions: actionResult,
      expiredOpportunities
    });
  } catch (error) {
    console.error('Expiration cron error:', error);
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
