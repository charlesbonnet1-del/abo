import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    });
  }
  return _stripe;
}

// Lazy proxy for backwards compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getStripe() as any)[prop];
  },
});

export function createStripeClient(accessToken: string) {
  return new Stripe(accessToken, {
    apiVersion: '2025-12-15.clover',
  });
}
