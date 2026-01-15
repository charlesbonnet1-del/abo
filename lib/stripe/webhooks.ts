import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { syncSingleCustomer } from './sync';

// Helper to safely get current_period_end from subscription
function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const subAny = subscription as unknown as Record<string, unknown>;
  const periodEnd = subAny.current_period_end as number | undefined;
  return periodEnd ? new Date(periodEnd * 1000) : null;
}

export async function handleCustomerCreated(customer: Stripe.Customer) {
  // Find user by stripe account
  const user = await prisma.user.findFirst({
    where: {
      stripeAccountId: { not: null },
    },
  });

  if (!user || !user.stripeAccessToken) return;

  await syncSingleCustomer(user.id, user.stripeAccessToken, customer.id);
}

export async function handleCustomerUpdated(customer: Stripe.Customer) {
  if (customer.deleted) return;

  const subscriber = await prisma.subscriber.findFirst({
    where: { stripeCustomerId: customer.id },
    include: { user: true },
  });

  if (!subscriber) return;

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: {
      email: customer.email || subscriber.email,
      name: customer.name,
    },
  });
}

export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  const subscriber = await prisma.subscriber.findFirst({
    where: { stripeCustomerId: customerId },
    include: { user: true },
  });

  if (!subscriber || !subscriber.user.stripeAccessToken) return;

  // Calculate MRR
  let mrr = 0;
  for (const item of subscription.items.data) {
    const price = item.price;
    if (price.recurring) {
      let monthlyAmount = price.unit_amount || 0;
      if (price.recurring.interval === 'year') {
        monthlyAmount = monthlyAmount / 12;
      }
      mrr += Math.round(monthlyAmount / 100);
    }
  }

  const plan = subscription.items.data[0]?.price?.nickname || 'Unknown';
  const status = subscription.status === 'trialing' ? 'TRIAL' : 'ACTIVE';

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: {
      status,
      plan,
      mrr,
      currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
    },
  });

  await prisma.event.create({
    data: {
      subscriberId: subscriber.id,
      type: 'SUBSCRIPTION_CREATED',
      source: 'STRIPE',
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        plan,
        mrr,
      },
    },
  });
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  const subscriber = await prisma.subscriber.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!subscriber) return;

  let mrr = 0;
  for (const item of subscription.items.data) {
    const price = item.price;
    if (price.recurring) {
      let monthlyAmount = price.unit_amount || 0;
      if (price.recurring.interval === 'year') {
        monthlyAmount = monthlyAmount / 12;
      }
      mrr += Math.round(monthlyAmount / 100);
    }
  }

  const plan = subscription.items.data[0]?.price?.nickname || 'Unknown';
  let status = subscriber.status;

  if (subscription.status === 'active') {
    status = 'ACTIVE';
  } else if (subscription.status === 'trialing') {
    status = 'TRIAL';
  } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    status = 'CHURNED';
    mrr = 0;
  }

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: {
      status,
      plan,
      mrr,
      currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
    },
  });

  await prisma.event.create({
    data: {
      subscriberId: subscriber.id,
      type: 'SUBSCRIPTION_UPDATED',
      source: 'STRIPE',
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        plan,
        mrr,
      },
    },
  });
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  const subscriber = await prisma.subscriber.findFirst({
    where: { stripeCustomerId: customerId },
    include: { user: true },
  });

  if (!subscriber) return;

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: {
      status: 'CHURNED',
      mrr: 0,
    },
  });

  await prisma.event.create({
    data: {
      subscriberId: subscriber.id,
      type: 'SUBSCRIPTION_CANCELED',
      source: 'STRIPE',
      data: {
        subscriptionId: subscription.id,
      },
    },
  });

  // Create alert
  await prisma.alert.create({
    data: {
      userId: subscriber.userId,
      subscriberId: subscriber.id,
      type: 'CHURN_RISK',
      message: `${subscriber.name || subscriber.email} a annulé son abonnement`,
    },
  });
}

export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) return;

  const subscriber = await prisma.subscriber.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!subscriber) return;

  // Update LTV
  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: {
      ltv: {
        increment: Math.round((invoice.amount_paid || 0) / 100),
      },
    },
  });

  await prisma.event.create({
    data: {
      subscriberId: subscriber.id,
      type: 'PAYMENT_SUCCESS',
      source: 'STRIPE',
      data: {
        invoiceId: invoice.id,
        amount: invoice.amount_paid,
      },
    },
  });
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) return;

  const subscriber = await prisma.subscriber.findFirst({
    where: { stripeCustomerId: customerId },
    include: { user: true },
  });

  if (!subscriber) return;

  // Mark as at risk
  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: {
      status: 'AT_RISK',
      healthScore: Math.max(0, (subscriber.healthScore || 50) - 30),
    },
  });

  await prisma.event.create({
    data: {
      subscriberId: subscriber.id,
      type: 'PAYMENT_FAILED',
      source: 'STRIPE',
      data: {
        invoiceId: invoice.id,
        amount: invoice.amount_due,
      },
    },
  });

  // Create alert
  await prisma.alert.create({
    data: {
      userId: subscriber.userId,
      subscriberId: subscriber.id,
      type: 'PAYMENT_FAILED',
      message: `Paiement échoué pour ${subscriber.name || subscriber.email}`,
    },
  });

  // Create action
  await prisma.action.create({
    data: {
      subscriberId: subscriber.id,
      type: 'UPDATE_CARD',
    },
  });
}

export async function handleCustomerSourceExpiring(source: Stripe.Card) {
  const customerId = source.customer as string;
  if (!customerId) return;

  const subscriber = await prisma.subscriber.findFirst({
    where: { stripeCustomerId: customerId },
    include: { user: true },
  });

  if (!subscriber) return;

  // Update card expiry
  if (source.exp_month && source.exp_year) {
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        cardExpiresAt: new Date(source.exp_year, source.exp_month - 1),
      },
    });
  }

  // Create alert
  await prisma.alert.create({
    data: {
      userId: subscriber.userId,
      subscriberId: subscriber.id,
      type: 'CARD_EXPIRING',
      message: `La carte de ${subscriber.name || subscriber.email} expire bientôt`,
    },
  });

  // Create action
  await prisma.action.create({
    data: {
      subscriberId: subscriber.id,
      type: 'UPDATE_CARD',
    },
  });
}
