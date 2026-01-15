import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { syncStripeData } from '@/lib/stripe/sync';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Handle errors from Stripe
  if (error) {
    console.error('Stripe OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${appUrl}/settings?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/settings?error=missing_params`);
  }

  // Verify state and get user ID
  let stateData: { userId: string };
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64').toString());
  } catch {
    return NextResponse.redirect(`${appUrl}/settings?error=invalid_state`);
  }

  // Verify the current user matches the state
  const user = await getUser();
  if (!user || user.id !== stateData.userId) {
    return NextResponse.redirect(`${appUrl}/settings?error=user_mismatch`);
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

    // Update user with Stripe credentials
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeAccountId: stripe_user_id,
        stripeAccessToken: access_token,
        stripeConnectedAt: new Date(),
      },
    });

    // Trigger initial sync (async, don't wait)
    syncStripeData(user.id, access_token).catch((err) => {
      console.error('Initial sync failed:', err);
    });

    return NextResponse.redirect(`${appUrl}/settings?success=stripe_connected`);
  } catch (err) {
    console.error('Stripe callback error:', err);
    return NextResponse.redirect(`${appUrl}/settings?error=connection_failed`);
  }
}
