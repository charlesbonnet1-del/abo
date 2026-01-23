import { NextResponse } from 'next/server';
import { createAdminClient, getUser } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'database_error' }, { status: 500 });
  }

  const { data: userData, error: userError } = await supabase
    .from('user')
    .select('stripe_account_id, stripe_access_token, stripe_connected, stripe_account_name')
    .eq('id', user.id)
    .single();

  if (userError) {
    return NextResponse.json({ error: 'user_not_found', details: userError.message }, { status: 400 });
  }

  const debug: Record<string, unknown> = {
    user_id: user.id,
    stripe_account_id: userData?.stripe_account_id || null,
    stripe_account_name: userData?.stripe_account_name || null,
    stripe_connected: userData?.stripe_connected || false,
    has_access_token: !!userData?.stripe_access_token,
    access_token_preview: userData?.stripe_access_token
      ? `${userData.stripe_access_token.substring(0, 15)}...`
      : null,
  };

  // Test 1: Using OAuth access token directly (current approach)
  if (userData?.stripe_access_token) {
    try {
      const stripeOAuth = new Stripe(userData.stripe_access_token, {
        apiVersion: '2025-12-15.clover',
      });

      const customersOAuth = await stripeOAuth.customers.list({ limit: 5 });
      debug.oauth_token_test = {
        success: true,
        customers_found: customersOAuth.data.length,
        customers: customersOAuth.data.map(c => ({
          id: c.id,
          email: c.email,
          name: c.name,
        })),
      };
    } catch (err) {
      debug.oauth_token_test = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // Test 2: Using platform key with stripeAccount header
  if (userData?.stripe_account_id) {
    try {
      const stripePlatform = getStripe();

      const customersConnected = await stripePlatform.customers.list({
        limit: 5,
      }, {
        stripeAccount: userData.stripe_account_id,
      });

      debug.stripe_account_header_test = {
        success: true,
        customers_found: customersConnected.data.length,
        customers: customersConnected.data.map(c => ({
          id: c.id,
          email: c.email,
          name: c.name,
        })),
      };
    } catch (err) {
      debug.stripe_account_header_test = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // Test 3: Fetch subscriptions with stripeAccount header
  if (userData?.stripe_account_id) {
    try {
      const stripePlatform = getStripe();

      const subscriptions = await stripePlatform.subscriptions.list({
        limit: 5,
        status: 'all',
      }, {
        stripeAccount: userData.stripe_account_id,
      });

      debug.subscriptions_test = {
        success: true,
        subscriptions_found: subscriptions.data.length,
        subscriptions: subscriptions.data.map(s => ({
          id: s.id,
          status: s.status,
          customer: typeof s.customer === 'string' ? s.customer : s.customer.id,
        })),
      };
    } catch (err) {
      debug.subscriptions_test = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return NextResponse.json(debug);
}
