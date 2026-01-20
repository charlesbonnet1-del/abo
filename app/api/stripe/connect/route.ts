import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  // Use STRIPE_CLIENT_ID (server-side) or NEXT_PUBLIC_STRIPE_CLIENT_ID as fallback
  const clientId = process.env.STRIPE_CLIENT_ID || process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID;

  if (!clientId) {
    console.error('STRIPE_CLIENT_ID is not configured');
    return NextResponse.redirect(`${appUrl}/settings?error=stripe_not_configured`);
  }

  const redirectUri = `${appUrl}/api/stripe/callback`;

  // Encode user ID in state for security
  const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64');

  const stripeConnectUrl = new URL('https://connect.stripe.com/oauth/authorize');
  stripeConnectUrl.searchParams.set('response_type', 'code');
  stripeConnectUrl.searchParams.set('client_id', clientId);
  stripeConnectUrl.searchParams.set('scope', 'read_write');
  stripeConnectUrl.searchParams.set('redirect_uri', redirectUri);
  stripeConnectUrl.searchParams.set('state', state);

  return NextResponse.redirect(stripeConnectUrl.toString());
}
