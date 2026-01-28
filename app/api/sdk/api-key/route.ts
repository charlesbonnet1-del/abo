import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

function generateKey(): string {
  return `abo_sk_${randomBytes(32).toString('hex')}`;
}

/**
 * Save API key to auth.users user_metadata (primary, always works)
 * and optionally to the user table (secondary, for reverse-lookup in events route).
 */
async function saveApiKey(userId: string, key: string): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  if (!admin) {
    console.error('Admin client unavailable (SUPABASE_SERVICE_ROLE_KEY missing?)');
    return { success: false, error: 'Configuration serveur incomplète. Contacte le support.' };
  }

  // Primary: save in auth.users user_metadata (always available, no migration needed)
  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: { sdk_api_key: key },
  });

  if (authError) {
    console.error('Failed to save API key to auth metadata:', authError.message);
    return { success: false, error: authError.message };
  }

  // Secondary: also try to save in user table for fast reverse-lookup (ignore errors)
  try {
    await admin.from('user').update({ sdk_api_key: key }).eq('id', userId);
  } catch {
    // Column may not exist - that's fine, auth metadata is the source of truth
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

  // Read from auth metadata (source of truth)
  const existingKey = user.user_metadata?.sdk_api_key;
  if (existingKey) {
    return NextResponse.json({ apiKey: existingKey });
  }

  // Auto-generate a key
  const key = generateKey();
  const result = await saveApiKey(user.id, key);

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
  const result = await saveApiKey(user.id, key);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ apiKey: key });
}
