import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

// GET - retrieve current API key
export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('user')
    .select('sdk_api_key')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch API key' }, { status: 500 });
  }

  return NextResponse.json({ apiKey: data?.sdk_api_key || null });
}

// POST - generate new API key
export async function POST() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Generate a secure API key: abo_sk_ prefix + 32 random bytes hex
  const key = `abo_sk_${randomBytes(32).toString('hex')}`;

  const { error } = await supabase
    .from('user')
    .update({ sdk_api_key: key })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 });
  }

  return NextResponse.json({ apiKey: key });
}
