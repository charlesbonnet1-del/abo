import { NextResponse } from 'next/server';
import { createClient, getUser } from '@/lib/supabase/server';
import { ensureAgentConfigs } from '@/lib/agents/init';

export async function POST() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await ensureAgentConfigs(supabase, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error initializing agents:', error);
    return NextResponse.json(
      { error: 'Failed to initialize agents' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Check if agents are initialized
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { count } = await supabase
      .from('agent_config')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return NextResponse.json({
      initialized: count === 3,
      count: count || 0,
    });
  } catch (error) {
    console.error('Error checking agents:', error);
    return NextResponse.json(
      { error: 'Failed to check agents' },
      { status: 500 }
    );
  }
}
