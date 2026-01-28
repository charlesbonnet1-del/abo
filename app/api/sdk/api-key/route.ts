import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

function generateKey(): string {
  return `abo_sk_${randomBytes(32).toString('hex')}`;
}

/**
 * Try to update sdk_api_key via RLS client first, then admin client as fallback.
 */
async function saveApiKey(userId: string, key: string, rlsClient: Awaited<ReturnType<typeof createClient>>): Promise<{ success: boolean; error?: string }> {
  // Try RLS client first (user can update own row)
  if (rlsClient) {
    const { error } = await rlsClient
      .from('user')
      .update({ sdk_api_key: key })
      .eq('id', userId);

    if (!error) return { success: true };
    console.error('RLS update failed:', error.message);
  }

  // Fallback to admin client
  const admin = createAdminClient();
  if (!admin) {
    console.error('Admin client unavailable (SUPABASE_SERVICE_ROLE_KEY missing?)');
    return { success: false, error: 'Configuration serveur incomplète. Contacte le support.' };
  }

  const { error } = await admin
    .from('user')
    .update({ sdk_api_key: key })
    .eq('id', userId);

  if (error) {
    console.error('Admin update failed:', error.message, error.code);
    // Column might not exist - hint to run migration
    if (error.message?.includes('sdk_api_key') || error.code === '42703') {
      return { success: false, error: 'Colonne sdk_api_key manquante. Appliquer la migration 013.' };
    }
    return { success: false, error: error.message || 'Erreur inconnue' };
  }

  return { success: true };
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

  // Try to read existing key
  const { data, error: selectError } = await supabase
    .from('user')
    .select('sdk_api_key')
    .eq('id', user.id)
    .single();

  if (selectError) {
    console.error('Failed to read sdk_api_key:', selectError.message, selectError.code);
  }

  // If key already exists, return it
  if (data?.sdk_api_key) {
    return NextResponse.json({ apiKey: data.sdk_api_key });
  }

  // Auto-generate a key
  const key = generateKey();
  const result = await saveApiKey(user.id, key, supabase);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
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

  const key = generateKey();
  const result = await saveApiKey(user.id, key, supabase);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ apiKey: key });
}
