import { NextResponse } from 'next/server';
import { createClient, getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending_approval, approved, rejected, executed, failed
    const agentType = searchParams.get('agent_type'); // recovery, retention, conversion
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('agent_action')
      .select(`
        *,
        subscriber:subscriber_id (
          id,
          email,
          name,
          stripe_customer_id
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (agentType) {
      query = query.eq('agent_type', agentType);
    }

    const { data: actions, count, error } = await query;

    if (error) {
      console.error('Error fetching actions:', error);
      return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
    }

    return NextResponse.json({
      actions: actions || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (err) {
    console.error('Actions route error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
