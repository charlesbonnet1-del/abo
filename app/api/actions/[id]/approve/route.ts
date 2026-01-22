import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { approveAction } from '@/lib/agents/executor';

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: actionId } = await params;

    // Get user from auth header or cookie
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await getSupabaseAdmin().auth.getUser(token);
      userId = user?.id || null;
    } else {
      // Try to get from cookie
      const cookieHeader = request.headers.get('cookie') || '';
      const cookies = Object.fromEntries(
        cookieHeader.split('; ').map(c => c.split('='))
      );

      const accessToken = cookies['sb-access-token'] || cookies['sb-127-auth-token']?.split('%22access_token%22%3A%22')[1]?.split('%22')[0];

      if (accessToken) {
        const { data: { user } } = await getSupabaseAdmin().auth.getUser(decodeURIComponent(accessToken));
        userId = user?.id || null;
      }
    }

    // Fallback: check if action exists and get user from there
    if (!userId) {
      const { data: action } = await getSupabaseAdmin()
        .from('agent_action')
        .select('user_id')
        .eq('id', actionId)
        .single();

      if (action) {
        // Verify the request is authenticated by checking Supabase session
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        // Create client-side auth check
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
        if (user && user.id === action.user_id) {
          userId = user.id;
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await approveAction(actionId, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
