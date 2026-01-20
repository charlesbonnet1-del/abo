import { NextResponse } from 'next/server';
import { createAdminClient, getUser } from '@/lib/supabase/server';
import { createConnectedStripeClient } from '@/lib/stripe';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

interface SubscriberData {
  user_id: string;
  stripe_customer_id: string;
  email: string | null;
  name: string | null;
  subscription_status: string;
  mrr: number;
  plan_name: string | null;
  plan_interval: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  payment_method_type: string | null;
  payment_method_last4: string | null;
  currency: string;
  country: string | null;
  lifetime_value: number;
  last_payment_at: string | null;
  last_payment_status: string | null;
  created_at: string;
  updated_at: string;
}

export async function POST() {
  // Get current user
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  // Get Supabase admin client (bypasses RLS for sync operations)
  const supabase = createAdminClient();
  if (!supabase) {
    console.error('Failed to create admin client - check SUPABASE_SERVICE_ROLE_KEY');
    return NextResponse.json({ error: 'database_error' }, { status: 500 });
  }

  // Get user's Stripe access token
  const { data: userData, error: userError } = await supabase
    .from('user')
    .select('stripe_access_token')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.stripe_access_token) {
    return NextResponse.json({ error: 'not_connected' }, { status: 400 });
  }

  try {
    const stripe = createConnectedStripeClient(userData.stripe_access_token);

    // Fetch all customers with subscriptions
    const subscribers: SubscriberData[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    // Fetch subscriptions with customer data
    while (hasMore) {
      const subscriptions: Stripe.ApiList<Stripe.Subscription> = await stripe.subscriptions.list({
        status: 'all',
        expand: ['data.customer', 'data.items.data.price', 'data.default_payment_method'],
        limit: 100,
        ...(startingAfter && { starting_after: startingAfter }),
      });

      for (const subscription of subscriptions.data) {
        const customer = subscription.customer as Stripe.Customer;

        // Skip deleted customers
        if (customer.deleted) continue;

        // Get payment method info
        let paymentMethodType: string | null = null;
        let paymentMethodLast4: string | null = null;
        const defaultPm = subscription.default_payment_method as Stripe.PaymentMethod | null;
        if (defaultPm) {
          paymentMethodType = defaultPm.type;
          if (defaultPm.card) {
            paymentMethodLast4 = defaultPm.card.last4;
          } else if (defaultPm.sepa_debit) {
            paymentMethodLast4 = defaultPm.sepa_debit.last4 || null;
          }
        }

        // Calculate MRR from subscription
        let mrr = 0;
        let planInterval: string | null = null;
        const priceItem = subscription.items.data[0];
        if (priceItem?.price) {
          const price = priceItem.price;
          const amount = price.unit_amount || 0;
          planInterval = price.recurring?.interval || null;

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

        // Get plan name from price nickname or product ID
        let planName: string | null = null;
        if (priceItem?.price) {
          const price = priceItem.price;
          if (price.nickname) {
            planName = price.nickname;
          } else if (typeof price.product === 'string') {
            // Product not expanded, use price ID as fallback
            planName = price.id;
          }
        }

        // Map status
        let status = subscription.status;
        if (status === 'incomplete' || status === 'incomplete_expired') {
          status = 'past_due';
        }

        // Get period dates
        const rawSub = subscription as unknown as {
          current_period_start?: number;
          current_period_end?: number;
        };

        const now = new Date().toISOString();
        const subscriberData: SubscriberData = {
          user_id: user.id,
          stripe_customer_id: customer.id,
          email: customer.email ?? null,
          name: customer.name ?? null,
          subscription_status: status,
          mrr,
          plan_name: planName,
          plan_interval: planInterval,
          current_period_start: rawSub.current_period_start
            ? new Date(rawSub.current_period_start * 1000).toISOString()
            : null,
          current_period_end: rawSub.current_period_end
            ? new Date(rawSub.current_period_end * 1000).toISOString()
            : null,
          payment_method_type: paymentMethodType,
          payment_method_last4: paymentMethodLast4,
          currency: subscription.currency || 'eur',
          country: customer.address?.country || null,
          lifetime_value: 0, // Will be calculated from invoices later
          last_payment_at: null, // Will be set from latest invoice
          last_payment_status: null,
          created_at: new Date(customer.created * 1000).toISOString(),
          updated_at: now,
        };

        subscribers.push(subscriberData);
      }

      hasMore = subscriptions.has_more;
      if (subscriptions.data.length > 0) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
      }
    }

    // Also fetch customers without subscriptions
    hasMore = true;
    startingAfter = undefined;

    while (hasMore) {
      const customers: Stripe.ApiList<Stripe.Customer> = await stripe.customers.list({
        limit: 100,
        ...(startingAfter && { starting_after: startingAfter }),
      });

      for (const customer of customers.data) {
        if (customer.deleted) continue;

        // Skip if already have this customer from subscriptions
        if (subscribers.some(s => s.stripe_customer_id === customer.id)) continue;

        const now = new Date().toISOString();
        subscribers.push({
          user_id: user.id,
          stripe_customer_id: customer.id,
          email: customer.email ?? null,
          name: customer.name ?? null,
          subscription_status: 'none',
          mrr: 0,
          plan_name: null,
          plan_interval: null,
          current_period_start: null,
          current_period_end: null,
          payment_method_type: null,
          payment_method_last4: null,
          currency: 'eur',
          country: customer.address?.country || null,
          lifetime_value: 0,
          last_payment_at: null,
          last_payment_status: null,
          created_at: new Date(customer.created * 1000).toISOString(),
          updated_at: now,
        });
      }

      hasMore = customers.has_more;
      if (customers.data.length > 0) {
        startingAfter = customers.data[customers.data.length - 1].id;
      }
    }

    // Upsert subscribers to database
    let synced = 0;
    for (const subscriber of subscribers) {
      const { error: upsertError } = await supabase
        .from('subscriber')
        .upsert(subscriber, {
          onConflict: 'user_id,stripe_customer_id',
        });

      if (upsertError) {
        console.error('Failed to upsert subscriber:', upsertError);
      } else {
        synced++;
      }
    }

    // Update last_sync_at on user
    await supabase
      .from('user')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      synced,
      total: subscribers.length,
    });
  } catch (err) {
    console.error('Sync error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    // Check if it's a Stripe error
    if (err && typeof err === 'object' && 'type' in err) {
      const stripeErr = err as { type: string; message?: string };
      console.error('Stripe error type:', stripeErr.type);
      return NextResponse.json({
        error: 'stripe_error',
        details: stripeErr.message || stripeErr.type
      }, { status: 500 });
    }
    return NextResponse.json({ error: 'sync_failed', details: message }, { status: 500 });
  }
}

// Also support GET for simple form submissions
export async function GET() {
  return POST();
}
