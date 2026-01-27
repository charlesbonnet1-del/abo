import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

function generateKey(): string {
  return `abo_sk_${randomBytes(32).toString('hex')}`;
}

// GET - retrieve current API key (auto-generates if none exists)
export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Try to read via RLS client first
  const { data } = await supabase
    .from('user')
    .select('sdk_api_key')
    .eq('id', user.id)
    .single();

  // If key already exists, return it
  if (data?.sdk_api_key) {
    return NextResponse.json({ apiKey: data.sdk_api_key });
  }

  // Auto-generate a key if none exists (use admin client to bypass RLS)
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  const key = generateKey();
  const { error: updateError } = await admin
    .from('user')
    .update({ sdk_api_key: key })
    .eq('id', user.id);

  if (updateError) {
    console.error('Failed to auto-generate API key:', updateError);
    return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 });
  }

  return NextResponse.json({ apiKey: key });
}

// POST - regenerate API key
export async function POST() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  const key = generateKey();
  const { error } = await admin
    .from('user')
    .update({ sdk_api_key: key })
    .eq('id', user.id);

  if (error) {
    console.error('Failed to regenerate API key:', error);
    return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 });
  }

  return NextResponse.json({ apiKey: key });
}
