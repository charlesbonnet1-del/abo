import { NextResponse } from 'next/server';
import { createClient, getUser } from '@/lib/supabase/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Handle errors from Stripe
  if (error) {
    console.error('Stripe OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${appUrl}/settings?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/settings?error=missing_code`);
  }

  // Verify the user is logged in
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  try {
    // Exchange code for access token
    const response = await fetch('https://connect.stripe.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_secret: process.env.STRIPE_SECRET_KEY!,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Stripe token exchange error:', data.error);
      return NextResponse.redirect(
        `${appUrl}/settings?error=${encodeURIComponent(data.error_description || data.error)}`
      );
    }

    const { access_token, stripe_user_id } = data;

    // Fetch account details to get the display name
    let accountName = stripe_user_id;
    try {
      const stripe = new Stripe(access_token, {
        apiVersion: '2025-12-15.clover',
      });
      const account = await stripe.accounts.retrieve(stripe_user_id);
      accountName = account.business_profile?.name
        || account.settings?.dashboard?.display_name
        || account.email
        || stripe_user_id;
    } catch (err) {
      console.error('Failed to fetch Stripe account details:', err);
    }

    // Store Stripe credentials in Supabase
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.redirect(`${appUrl}/settings?error=database_error`);
    }

    const { error: updateError } = await supabase
      .from('user')
      .update({
        stripe_account_id: stripe_user_id,
        stripe_account_name: accountName,
        stripe_connected: true,
        stripe_access_token: access_token,
        last_sync_at: null, // Will be set after first sync
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to save Stripe credentials:', updateError);
      return NextResponse.redirect(`${appUrl}/settings?error=save_failed`);
    }

    // Redirect to settings with success flag and auto_sync parameter
    return NextResponse.redirect(`${appUrl}/settings?success=true&auto_sync=true`);
  } catch (err) {
    console.error('Stripe callback error:', err);
    return NextResponse.redirect(`${appUrl}/settings?error=connection_failed`);
  }
}
