import { NextRequest, NextResponse } from 'next/server';
import { batchApproveActions } from '@/lib/agents/executor';

export async function POST(request: NextRequest) {
  try {
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

    // Parse body
    const body = await request.json();
    const actionIds = body.actionIds as string[];

    if (!actionIds || !Array.isArray(actionIds) || actionIds.length === 0) {
      return NextResponse.json(
        { error: 'No action IDs provided' },
        { status: 400 }
      );
    }

    const result = await batchApproveActions(actionIds, userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error batch approving actions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
