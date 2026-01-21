import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Disable body parsing - we need raw body for signature verification
export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('Webhook: Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Webhook: STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    console.error('Webhook: Failed to create Supabase client');
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // For Connect webhooks, get the connected account ID
  const stripeAccountId = event.account;

  // Find the user who owns this Stripe account
  let userId: string | null = null;

  if (stripeAccountId) {
    const { data: userData } = await supabase
      .from('user')
      .select('id')
      .eq('stripe_account_id', stripeAccountId)
      .single();

    if (userData) {
      userId = userData.id;
    }
  }

  console.log(`Webhook received: ${event.type}`, {
    accountId: stripeAccountId,
    userId,
  });

  try {
    switch (event.type) {
      // =====================
      // CUSTOMER EVENTS
      // =====================
      case 'customer.created':
      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer;
        if (!userId) {
          console.log('Skipping customer event - no user found for account');
          break;
        }

        await handleCustomerUpsert(supabase, userId, customer);
        break;
      }

      case 'customer.deleted': {
        const customer = event.data.object as Stripe.Customer;
        if (!userId) break;

        // Delete subscriber (or mark as deleted)
        await supabase
          .from('subscriber')
          .delete()
          .eq('user_id', userId)
          .eq('stripe_customer_id', customer.id);

        console.log(`Deleted subscriber: ${customer.id}`);
        break;
      }

      // =====================
      // SUBSCRIPTION EVENTS
      // =====================
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        if (!userId) break;

        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

        // Get subscriber ID
        const { data: subscriber } = await supabase
          .from('subscriber')
          .select('id')
          .eq('user_id', userId)
          .eq('stripe_customer_id', customerId)
          .single();

        if (!subscriber) {
          console.log('Subscriber not found, creating from subscription event');
          // Create subscriber first
          const { data: newSubscriber } = await supabase
            .from('subscriber')
            .insert({
              user_id: userId,
              stripe_customer_id: customerId,
              subscription_status: subscription.status,
              updated_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (newSubscriber) {
            await handleSubscriptionUpsert(supabase, newSubscriber.id, subscription);
            await recalculateSubscriberMRR(supabase, newSubscriber.id);
          }
        } else {
          await handleSubscriptionUpsert(supabase, subscriber.id, subscription);
          await recalculateSubscriberMRR(supabase, subscriber.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        if (!userId) break;

        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

        const { data: subscriber } = await supabase
          .from('subscriber')
          .select('id')
          .eq('user_id', userId)
          .eq('stripe_customer_id', customerId)
          .single();

        if (subscriber) {
          // Update subscription status to canceled
          await supabase
            .from('subscription')
            .update({
              status: 'canceled',
              canceled_at: new Date().toISOString(),
            })
            .eq('subscriber_id', subscriber.id)
            .eq('stripe_subscription_id', subscription.id);

          await recalculateSubscriberMRR(supabase, subscriber.id);
        }
        break;
      }

      // =====================
      // INVOICE EVENTS
      // =====================
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!userId) break;

        const customerId = typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id;

        if (!customerId) break;

        const { data: subscriber } = await supabase
          .from('subscriber')
          .select('id, lifetime_value')
          .eq('user_id', userId)
          .eq('stripe_customer_id', customerId)
          .single();

        if (subscriber) {
          // Upsert invoice
          await supabase
            .from('invoice')
            .upsert({
              subscriber_id: subscriber.id,
              stripe_invoice_id: invoice.id,
              amount: invoice.amount_paid || 0,
              currency: invoice.currency || 'eur',
              status: 'paid',
              paid_at: new Date().toISOString(),
              created_at: new Date(invoice.created * 1000).toISOString(),
            }, {
              onConflict: 'subscriber_id,stripe_invoice_id',
            });

          // Update subscriber's lifetime value and last payment
          const newLifetimeValue = (subscriber.lifetime_value || 0) + (invoice.amount_paid || 0);
          await supabase
            .from('subscriber')
            .update({
              lifetime_value: newLifetimeValue,
              last_payment_at: new Date().toISOString(),
              last_payment_status: 'succeeded',
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscriber.id);

          console.log(`Invoice paid: ${invoice.id}, amount: ${invoice.amount_paid}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!userId) break;

        const customerId = typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id;

        if (!customerId) break;

        const { data: subscriber } = await supabase
          .from('subscriber')
          .select('id')
          .eq('user_id', userId)
          .eq('stripe_customer_id', customerId)
          .single();

        if (subscriber) {
          // Upsert invoice
          await supabase
            .from('invoice')
            .upsert({
              subscriber_id: subscriber.id,
              stripe_invoice_id: invoice.id,
              amount: invoice.amount_due || 0,
              currency: invoice.currency || 'eur',
              status: 'failed',
              created_at: new Date(invoice.created * 1000).toISOString(),
            }, {
              onConflict: 'subscriber_id,stripe_invoice_id',
            });

          // Update subscriber's last payment status
          await supabase
            .from('subscriber')
            .update({
              last_payment_at: new Date().toISOString(),
              last_payment_status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscriber.id);

          console.log(`Invoice payment failed: ${invoice.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

// =====================
// HELPER FUNCTIONS
// =====================

async function handleCustomerUpsert(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  customer: Stripe.Customer
) {
  if (!supabase || customer.deleted) return;

  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from('subscriber')
    .select('id')
    .eq('user_id', userId)
    .eq('stripe_customer_id', customer.id)
    .single();

  if (existing) {
    await supabase
      .from('subscriber')
      .update({
        email: customer.email ?? null,
        name: customer.name ?? null,
        country: customer.address?.country || null,
        updated_at: now,
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('subscriber')
      .insert({
        user_id: userId,
        stripe_customer_id: customer.id,
        email: customer.email ?? null,
        name: customer.name ?? null,
        subscription_status: 'none',
        mrr: 0,
        country: customer.address?.country || null,
        lifetime_value: 0,
        created_at: new Date(customer.created * 1000).toISOString(),
        updated_at: now,
      });
  }

  console.log(`Customer upserted: ${customer.id}`);
}

async function handleSubscriptionUpsert(
  supabase: ReturnType<typeof createAdminClient>,
  subscriberId: string,
  subscription: Stripe.Subscription
) {
  if (!supabase) return;

  const priceItem = subscription.items.data[0];

  await supabase
    .from('subscription')
    .upsert({
      subscriber_id: subscriberId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      plan_name: priceItem?.price?.nickname || priceItem?.price?.id || null,
      plan_amount: priceItem?.price?.unit_amount || 0,
      plan_interval: priceItem?.price?.recurring?.interval || null,
      current_period_start: (subscription as unknown as { current_period_start?: number }).current_period_start
        ? new Date((subscription as unknown as { current_period_start: number }).current_period_start * 1000).toISOString()
        : null,
      current_period_end: (subscription as unknown as { current_period_end?: number }).current_period_end
        ? new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      created_at: new Date(subscription.created * 1000).toISOString(),
    }, {
      onConflict: 'subscriber_id,stripe_subscription_id',
    });

  console.log(`Subscription upserted: ${subscription.id}`);
}

async function recalculateSubscriberMRR(
  supabase: ReturnType<typeof createAdminClient>,
  subscriberId: string
) {
  if (!supabase) return;

  // Get all active subscriptions for this subscriber
  const { data: subscriptions } = await supabase
    .from('subscription')
    .select('status, plan_amount, plan_interval')
    .eq('subscriber_id', subscriberId)
    .in('status', ['active', 'trialing']);

  let mrr = 0;
  let mainStatus = 'none';
  let planName: string | null = null;
  let planInterval: string | null = null;

  if (subscriptions && subscriptions.length > 0) {
    for (const sub of subscriptions) {
      const amount = sub.plan_amount || 0;
      const interval = sub.plan_interval;

      let monthlyAmount = 0;
      if (interval === 'year') {
        monthlyAmount = Math.round(amount / 12);
      } else if (interval === 'month') {
        monthlyAmount = amount;
      } else if (interval === 'week') {
        monthlyAmount = amount * 4;
      } else if (interval === 'day') {
        monthlyAmount = amount * 30;
      }

      mrr += monthlyAmount;

      // Set main status and plan from first active subscription
      if (sub.status === 'active' || (sub.status === 'trialing' && mainStatus !== 'active')) {
        mainStatus = sub.status;
        planInterval = interval;
      }
    }

    // Get plan name from first subscription
    const { data: firstSub } = await supabase
      .from('subscription')
      .select('plan_name, plan_interval, current_period_start, current_period_end')
      .eq('subscriber_id', subscriberId)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .single();

    if (firstSub) {
      planName = firstSub.plan_name;
      planInterval = firstSub.plan_interval;

      await supabase
        .from('subscriber')
        .update({
          mrr,
          subscription_status: mainStatus,
          plan_name: planName,
          plan_interval: planInterval,
          current_period_start: firstSub.current_period_start,
          current_period_end: firstSub.current_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriberId);
    }
  } else {
    // No active subscriptions
    await supabase
      .from('subscriber')
      .update({
        mrr: 0,
        subscription_status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriberId);
  }

  console.log(`Recalculated MRR for subscriber ${subscriberId}: ${mrr}`);
}
