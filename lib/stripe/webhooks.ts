import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

// Helper to get user ID from Stripe account ID
async function getUserIdFromStripeAccount(stripeAccountId: string): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from('user')
    .select('id')
    .eq('stripe_account_id', stripeAccountId)
    .single();

  return data?.id || null;
}

// Helper to get or create subscriber
async function upsertSubscriber(
  userId: string,
  customerId: string,
  data: Record<string, unknown>
) {
  const supabase = await createClient();
  if (!supabase) return;

  const now = new Date().toISOString();
  const subscriberData = {
    user_id: userId,
    stripe_customer_id: customerId,
    ...data,
    updated_at: now,
  };

  await supabase
    .from('subscriber')
    .upsert(subscriberData, {
      onConflict: 'user_id,stripe_customer_id',
    });
}

export async function handleCustomerCreated(
  customer: Stripe.Customer,
  stripeAccountId?: string
) {
  if (!stripeAccountId) {
    console.log('No Stripe account ID for customer.created event');
    return;
  }

  const userId = await getUserIdFromStripeAccount(stripeAccountId);
  if (!userId) {
    console.log(`No user found for Stripe account ${stripeAccountId}`);
    return;
  }

  await upsertSubscriber(userId, customer.id, {
    email: customer.email,
    name: customer.name,
    subscription_status: 'none',
    created_at: new Date(customer.created * 1000).toISOString(),
  });

  console.log(`Created subscriber for customer ${customer.id}`);
}

export async function handleCustomerUpdated(
  customer: Stripe.Customer,
  stripeAccountId?: string
) {
  if (!stripeAccountId) return;

  const userId = await getUserIdFromStripeAccount(stripeAccountId);
  if (!userId) return;

  await upsertSubscriber(userId, customer.id, {
    email: customer.email,
    name: customer.name,
  });

  console.log(`Updated subscriber for customer ${customer.id}`);
}

export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  stripeAccountId?: string
) {
  if (!stripeAccountId) return;

  const userId = await getUserIdFromStripeAccount(stripeAccountId);
  if (!userId) return;

  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  // Calculate MRR
  let mrr = 0;
  let planInterval: string | null = null;
  const priceItem = subscription.items.data[0];
  if (priceItem?.price) {
    const price = priceItem.price;
    const amount = price.unit_amount || 0;
    planInterval = price.recurring?.interval || null;

    if (price.recurring?.interval === 'year') {
      mrr = Math.round(amount / 12);
    } else if (price.recurring?.interval === 'month') {
      mrr = amount;
    }
  }

  // Get plan name
  let planName: string | null = null;
  if (priceItem?.price?.nickname) {
    planName = priceItem.price.nickname;
  }

  // Access period dates from raw subscription data
  const rawSub = subscription as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };

  await upsertSubscriber(userId, customerId, {
    subscription_status: subscription.status,
    plan_name: planName,
    plan_interval: planInterval,
    mrr,
    currency: subscription.currency || 'eur',
    current_period_start: rawSub.current_period_start
      ? new Date(rawSub.current_period_start * 1000).toISOString()
      : null,
    current_period_end: rawSub.current_period_end
      ? new Date(rawSub.current_period_end * 1000).toISOString()
      : null,
  });

  console.log(`Created/updated subscription for customer ${customerId}`);
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  stripeAccountId?: string
) {
  // Same logic as created
  await handleSubscriptionCreated(subscription, stripeAccountId);
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  stripeAccountId?: string
) {
  if (!stripeAccountId) return;

  const userId = await getUserIdFromStripeAccount(stripeAccountId);
  if (!userId) return;

  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  await upsertSubscriber(userId, customerId, {
    subscription_status: 'canceled',
  });

  console.log(`Marked subscription as canceled for customer ${customerId}`);
}

export async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  stripeAccountId?: string
) {
  if (!stripeAccountId) return;

  const userId = await getUserIdFromStripeAccount(stripeAccountId);
  if (!userId) return;

  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) return;

  // Update LTV
  const supabase = await createClient();
  if (!supabase) return;

  const { data: subscriber } = await supabase
    .from('subscriber')
    .select('lifetime_value')
    .eq('user_id', userId)
    .eq('stripe_customer_id', customerId)
    .single();

  const currentLtv = subscriber?.lifetime_value || 0;
  const invoiceAmount = invoice.amount_paid || 0;
  const paidAt = invoice.status_transitions?.paid_at
    ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
    : new Date().toISOString();

  await upsertSubscriber(userId, customerId, {
    subscription_status: 'active',
    lifetime_value: currentLtv + invoiceAmount,
    last_payment_at: paidAt,
    last_payment_status: 'succeeded',
  });

  console.log(`Invoice paid for customer ${customerId}, updated LTV`);
}

export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  stripeAccountId?: string
) {
  if (!stripeAccountId) return;

  const userId = await getUserIdFromStripeAccount(stripeAccountId);
  if (!userId) return;

  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) return;

  await upsertSubscriber(userId, customerId, {
    subscription_status: 'past_due',
    last_payment_status: 'failed',
  });

  console.log(`Payment failed for customer ${customerId}`);
}

export async function handleCustomerSourceExpiring(
  source: Stripe.Card,
  stripeAccountId?: string
) {
  if (!stripeAccountId) return;

  const userId = await getUserIdFromStripeAccount(stripeAccountId);
  if (!userId) return;

  const customerId = typeof source.customer === 'string'
    ? source.customer
    : source.customer?.id;

  if (!customerId) return;

  // Just log, we don't have a card_expires_at column anymore
  // Could add a notification or agent action here
  console.log(`Card expiring for customer ${customerId}`);
}
