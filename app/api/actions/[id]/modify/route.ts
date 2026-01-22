import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { regenerateEmail, BrandSettings } from '@/lib/agents/groq';

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

interface ModifyBody {
  discountPercent?: number;
  discountMonths?: number;
  pauseMonths?: number;
  downgradePlan?: string;
  customNote?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: actionId } = await params;

    // Get user ID
    let userId: string | null = null;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const { createServerClient } = await import('@supabase/ssr');
    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {}
      }
    });

    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id || null;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get action
    const { data: action, error: actionError } = await getSupabaseAdmin()
      .from('agent_action')
      .select('*, subscriber(*)')
      .eq('id', actionId)
      .single();

    if (actionError || !action) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
    }

    if (action.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (action.status !== 'pending_approval') {
      return NextResponse.json(
        { error: 'Action is not pending approval' },
        { status: 400 }
      );
    }

    // Parse modifications
    const body: ModifyBody = await request.json();

    // Get brand settings
    const { data: brandSettings } = await getSupabaseAdmin()
      .from('brand_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Regenerate email
    const newEmail = await regenerateEmail({
      agentType: action.agent_type,
      context: {
        subscriberName: action.subscriber?.name || undefined,
        subscriberEmail: action.subscriber?.email || action.result?.subscriber_email,
        planName: action.subscriber?.plan_name || undefined,
        mrr: action.subscriber?.mrr
      },
      brandSettings: (brandSettings || {}) as BrandSettings,
      modifications: body
    });

    // Update action with new email
    const { error: updateError } = await getSupabaseAdmin()
      .from('agent_action')
      .update({
        result: {
          ...action.result,
          email_subject: newEmail.subject,
          email_body: newEmail.body,
          modifications: body
        }
      })
      .eq('id', actionId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update action' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      email: newEmail
    });
  } catch (error) {
    console.error('Error modifying action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
