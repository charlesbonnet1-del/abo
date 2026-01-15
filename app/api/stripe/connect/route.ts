import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL));
  }

  const clientId = process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/callback`;

  // Encode user ID in state for security
  const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64');

  const stripeConnectUrl = new URL('https://connect.stripe.com/oauth/authorize');
  stripeConnectUrl.searchParams.set('response_type', 'code');
  stripeConnectUrl.searchParams.set('client_id', clientId!);
  stripeConnectUrl.searchParams.set('scope', 'read_only');
  stripeConnectUrl.searchParams.set('redirect_uri', redirectUri);
  stripeConnectUrl.searchParams.set('state', state);

  return NextResponse.redirect(stripeConnectUrl.toString());
}
