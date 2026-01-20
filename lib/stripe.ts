import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return _stripe;
}

// For backwards compatibility
export const stripe = {
  get instance() {
    return getStripe();
  },
};

// Use NEXT_PUBLIC_ prefix for client-side access
export const STRIPE_CLIENT_ID = process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID || process.env.STRIPE_CLIENT_ID || '';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function getStripeConnectUrl(state?: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: STRIPE_CLIENT_ID,
    scope: 'read_write',
    redirect_uri: `${APP_URL}/api/stripe/callback`,
  });

  if (state) {
    params.append('state', state);
  }

  return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
}

// Create a Stripe client with the connected account's access token
export function createConnectedStripeClient(accessToken: string): Stripe {
  return new Stripe(accessToken, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  });
}
