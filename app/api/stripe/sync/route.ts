import { NextResponse } from 'next/server';
import { createClient, getUser } from '@/lib/supabase/server';
import { createConnectedStripeClient } from '@/lib/stripe';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

interface SubscriberData {
  userid: string;
  stripecustomerid: string;
  email: string | null;
  name: string | null;
  status: string;
  healthscore: number;
  plan: string | null;
  mrr: number;
  ltv: number;
  currentperiodend: string | null;
  cardexpiresat: string | null;
  firstseenat: string;
  createdat: string;
  updatedat: string;
}

export async function POST() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Get current user
  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  // Get Supabase client
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${appUrl}/connect?error=database_error`);
  }

  // Get user's Stripe access token
  const { data: userData, error: userError } = await supabase
    .from('user')
    .select('stripeaccesstoken')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.stripeaccesstoken) {
    return NextResponse.redirect(`${appUrl}/connect?error=not_connected`);
  }

  try {
    const stripe = createConnectedStripeClient(userData.stripeaccesstoken);

    // Fetch all customers with subscriptions
    const subscribers: SubscriberData[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    // Fetch subscriptions with customer data
    while (hasMore) {
      const subscriptions: Stripe.ApiList<Stripe.Subscription> = await stripe.subscriptions.list({
        status: 'all',
        expand: ['data.customer', 'data.items.data.price.product'],
        limit: 100,
        ...(startingAfter && { starting_after: startingAfter }),
      });

      for (const subscription of subscriptions.data) {
        const customer = subscription.customer as Stripe.Customer;

        // Skip deleted customers
        if (customer.deleted) continue;

        // Get payment method for card expiry
        let cardExpiresAt: string | null = null;
        if (customer.invoice_settings?.default_payment_method) {
          try {
            const pm = await stripe.paymentMethods.retrieve(
              customer.invoice_settings.default_payment_method as string
            );
            if (pm.card) {
              const expDate = new Date(pm.card.exp_year, pm.card.exp_month - 1);
              cardExpiresAt = expDate.toISOString();
            }
          } catch {
            // Payment method might not be accessible
          }
        }

        // Calculate MRR from subscription
        let mrr = 0;
        const priceItem = subscription.items.data[0];
        if (priceItem?.price) {
          const price = priceItem.price;
          const amount = price.unit_amount || 0;

          // Normalize to monthly
          if (price.recurring?.interval === 'year') {
            mrr = Math.round(amount / 12);
          } else if (price.recurring?.interval === 'month') {
            mrr = amount;
          } else if (price.recurring?.interval === 'week') {
            mrr = amount * 4;
          } else if (price.recurring?.interval === 'day') {
            mrr = amount * 30;
          }
        }

        // Get plan name
        let planName: string | null = null;
        if (priceItem?.price) {
          const price = priceItem.price;
          if (price.nickname) {
            planName = price.nickname;
          } else if (typeof price.product === 'object' && price.product && 'name' in price.product) {
            planName = (price.product as Stripe.Product).name;
          }
        }

        // Map status
        let status = subscription.status;
        if (status === 'incomplete' || status === 'incomplete_expired') {
          status = 'past_due';
        }

        // Calculate health score (simple heuristic)
        let healthScore = 70;
        if (status === 'active') healthScore = 85;
        if (status === 'trialing') healthScore = 60;
        if (status === 'past_due') healthScore = 30;
        if (status === 'canceled') healthScore = 10;
        if (status === 'unpaid') healthScore = 20;

        const now = new Date().toISOString();
        const subscriberData: SubscriberData = {
          userid: user.id,
          stripecustomerid: customer.id,
          email: customer.email ?? null,
          name: customer.name ?? null,
          status,
          healthscore: healthScore,
          plan: planName,
          mrr,
          ltv: 0, // Will be calculated from invoices later
          currentperiodend: (subscription as unknown as { current_period_end?: number }).current_period_end
            ? new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString()
            : null,
          cardexpiresat: cardExpiresAt,
          firstseenat: new Date(customer.created * 1000).toISOString(),
          createdat: now,
          updatedat: now,
        };

        subscribers.push(subscriberData);
      }

      hasMore = subscriptions.has_more;
      if (subscriptions.data.length > 0) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
      }
    }

    // Upsert subscribers to database
    for (const subscriber of subscribers) {
      const { error: upsertError } = await supabase
        .from('subscriber')
        .upsert(subscriber, {
          onConflict: 'stripecustomerid,userid',
        });

      if (upsertError) {
        console.error('Failed to upsert subscriber:', upsertError);
      }
    }

    // Redirect back to connect page with success
    return NextResponse.redirect(
      `${appUrl}/connect?synced=${subscribers.length}`
    );
  } catch (err) {
    console.error('Sync error:', err);
    return NextResponse.redirect(`${appUrl}/connect?error=sync_failed`);
  }
}

// Also support GET for simple form submissions
export async function GET() {
  return POST();
}
