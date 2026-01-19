import { NextResponse } from 'next/server';
import { createClient, getUser } from '@/lib/supabase/server';

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
      `${appUrl}/connect?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/connect?error=missing_code`);
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
        `${appUrl}/connect?error=${encodeURIComponent(data.error_description || data.error)}`
      );
    }

    const { access_token, stripe_user_id } = data;

    // Store Stripe credentials in Supabase
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.redirect(`${appUrl}/connect?error=database_error`);
    }

    const { error: updateError } = await supabase
      .from('user')
      .update({
        stripeaccountid: stripe_user_id,
        stripeaccesstoken: access_token,
        stripeconnectedat: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to save Stripe credentials:', updateError);
      return NextResponse.redirect(`${appUrl}/connect?error=save_failed`);
    }

    return NextResponse.redirect(`${appUrl}/connect?success=true`);
  } catch (err) {
    console.error('Stripe callback error:', err);
    return NextResponse.redirect(`${appUrl}/connect?error=connection_failed`);
  }
}
