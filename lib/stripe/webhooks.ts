import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

// Helper to get user ID from Stripe account ID
async function getUserIdFromStripeAccount(stripeAccountId: string): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from('user')
    .select('id')
    .eq('stripeaccountid', stripeAccountId)
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
    userid: userId,
    stripecustomerid: customerId,
    ...data,
    updatedat: now,
  };

  await supabase
    .from('subscriber')
    .upsert(subscriberData, {
      onConflict: 'stripecustomerid,userid',
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

  const now = new Date().toISOString();
  await upsertSubscriber(userId, customer.id, {
    email: customer.email,
    name: customer.name,
    status: 'active',
    healthscore: 70,
    firstseenat: new Date(customer.created * 1000).toISOString(),
    createdat: now,
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
  const priceItem = subscription.items.data[0];
  if (priceItem?.price) {
    const price = priceItem.price;
    const amount = price.unit_amount || 0;
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

  // Access current_period_end from raw subscription data
  const rawSub = subscription as unknown as { current_period_end?: number };

  await upsertSubscriber(userId, customerId, {
    status: subscription.status,
    plan: planName,
    mrr,
    healthscore: subscription.status === 'active' ? 85 : 60,
    currentperiodend: rawSub.current_period_end
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
    status: 'canceled',
    healthscore: 10,
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
    .select('ltv')
    .eq('userid', userId)
    .eq('stripecustomerid', customerId)
    .single();

  const currentLtv = subscriber?.ltv || 0;
  const invoiceAmount = invoice.amount_paid || 0;

  await upsertSubscriber(userId, customerId, {
    status: 'active',
    healthscore: 85,
    ltv: currentLtv + invoiceAmount,
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
    status: 'past_due',
    healthscore: 30,
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

  // Set card expiry date
  const expDate = new Date(source.exp_year, source.exp_month - 1);

  await upsertSubscriber(userId, customerId, {
    cardexpiresat: expDate.toISOString(),
  });

  console.log(`Card expiring for customer ${customerId}`);
}
