import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { createStripeClient } from './client';
import { calculateHealthScore, determineStatus } from '@/lib/health-score';
import { SubscriberStatus } from '@prisma/client';

export async function syncStripeData(userId: string, accessToken: string) {
  const stripe = createStripeClient(accessToken);

  // Fetch all customers with pagination
  const customers: Stripe.Customer[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const response = await stripe.customers.list({
      limit: 100,
      starting_after: startingAfter,
    });

    customers.push(...response.data);
    hasMore = response.has_more;
    if (response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  console.log(`Syncing ${customers.length} customers for user ${userId}`);

  // Process each customer
  for (const customer of customers) {
    if (customer.deleted) continue;

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 100,
    });

    // Calculate MRR from active subscriptions
    let mrr = 0;
    let ltv = 0;
    let plan: string | null = null;
    let currentPeriodEnd: Date | null = null;
    let status: SubscriberStatus = 'ACTIVE';

    const activeSubscription = subscriptions.data.find(
      (sub) => sub.status === 'active' || sub.status === 'trialing'
    );

    if (activeSubscription) {
      // Calculate MRR (convert to monthly if different interval)
      for (const item of activeSubscription.items.data) {
        const price = item.price;
        if (price.recurring) {
          let monthlyAmount = price.unit_amount || 0;
          if (price.recurring.interval === 'year') {
            monthlyAmount = monthlyAmount / 12;
          } else if (price.recurring.interval === 'week') {
            monthlyAmount = monthlyAmount * 4;
          }
          mrr += Math.round(monthlyAmount / 100); // Convert cents to currency
        }
      }

      plan = activeSubscription.items.data[0]?.price?.nickname ||
             activeSubscription.items.data[0]?.price?.product?.toString() ||
             'Unknown';

      // Access current_period_end safely with type assertion
      const subAny = activeSubscription as unknown as Record<string, unknown>;
      const periodEnd = subAny.current_period_end as number | undefined;
      if (periodEnd) {
        currentPeriodEnd = new Date(periodEnd * 1000);
      }

      if (activeSubscription.status === 'trialing') {
        status = 'TRIAL';
      }
    } else if (subscriptions.data.some((sub) => sub.status === 'canceled')) {
      status = 'CHURNED';
    }

    // Get payment history for LTV calculation
    const invoices = await stripe.invoices.list({
      customer: customer.id,
      limit: 100,
      status: 'paid',
    });

    ltv = invoices.data.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0) / 100;

    // Check card expiry
    let cardExpiresAt: Date | null = null;
    if (customer.default_source && typeof customer.default_source === 'object') {
      const source = customer.default_source as Stripe.Card;
      if (source.exp_month && source.exp_year) {
        cardExpiresAt = new Date(source.exp_year, source.exp_month - 1);
      }
    }

    // Get or create payment methods for card expiry
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customer.id,
        type: 'card',
        limit: 1,
      });
      if (paymentMethods.data.length > 0) {
        const card = paymentMethods.data[0].card;
        if (card?.exp_month && card?.exp_year) {
          cardExpiresAt = new Date(card.exp_year, card.exp_month - 1);
        }
      }
    } catch {
      // Ignore payment method errors
    }

    // Calculate health score
    const healthData = {
      failedPayments: invoices.data.filter((inv) => inv.status === 'uncollectible').length,
      successfulPayments: invoices.data.length,
      firstPaymentDate: invoices.data.length > 0
        ? new Date(invoices.data[invoices.data.length - 1].created * 1000)
        : new Date(),
      plan,
      cardExpiresAt,
    };
    const healthScore = calculateHealthScore(healthData);
    const suggestedStatus = determineStatus(healthScore, status);

    // Upsert subscriber
    const subscriber = await prisma.subscriber.upsert({
      where: {
        userId_stripeCustomerId: {
          userId,
          stripeCustomerId: customer.id,
        },
      },
      update: {
        email: customer.email || '',
        name: customer.name,
        status: suggestedStatus,
        healthScore,
        plan,
        mrr,
        ltv: Math.round(ltv),
        currentPeriodEnd,
        cardExpiresAt,
        updatedAt: new Date(),
      },
      create: {
        userId,
        stripeCustomerId: customer.id,
        email: customer.email || '',
        name: customer.name,
        status: suggestedStatus,
        healthScore,
        plan,
        mrr,
        ltv: Math.round(ltv),
        currentPeriodEnd,
        cardExpiresAt,
        firstSeenAt: new Date(customer.created * 1000),
      },
    });

    // Create subscription event if active
    if (activeSubscription) {
      await prisma.event.create({
        data: {
          subscriberId: subscriber.id,
          type: 'SUBSCRIPTION_CREATED',
          source: 'STRIPE',
          data: {
            subscriptionId: activeSubscription.id,
            status: activeSubscription.status,
            plan,
            mrr,
          },
          occurredAt: new Date(activeSubscription.created * 1000),
        },
      });
    }
  }

  console.log(`Sync completed for user ${userId}`);
}

export async function syncSingleCustomer(
  userId: string,
  accessToken: string,
  customerId: string
) {
  const stripe = createStripeClient(accessToken);

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    // Mark subscriber as churned
    await prisma.subscriber.updateMany({
      where: {
        userId,
        stripeCustomerId: customerId,
      },
      data: {
        status: 'CHURNED',
        mrr: 0,
      },
    });
    return;
  }

  // Simplified sync for single customer
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 10,
  });

  let mrr = 0;
  let plan: string | null = null;
  let currentPeriodEnd: Date | null = null;
  let status: SubscriberStatus = 'ACTIVE';

  const activeSubscription = subscriptions.data.find(
    (sub) => sub.status === 'active' || sub.status === 'trialing'
  );

  if (activeSubscription) {
    for (const item of activeSubscription.items.data) {
      const price = item.price;
      if (price.recurring) {
        let monthlyAmount = price.unit_amount || 0;
        if (price.recurring.interval === 'year') {
          monthlyAmount = monthlyAmount / 12;
        }
        mrr += Math.round(monthlyAmount / 100);
      }
    }

    plan = activeSubscription.items.data[0]?.price?.nickname || 'Unknown';

    // Access current_period_end safely with type assertion
    const subAny = activeSubscription as unknown as Record<string, unknown>;
    const periodEnd = subAny.current_period_end as number | undefined;
    if (periodEnd) {
      currentPeriodEnd = new Date(periodEnd * 1000);
    }

    if (activeSubscription.status === 'trialing') {
      status = 'TRIAL';
    }
  } else {
    status = 'CHURNED';
    mrr = 0;
  }

  await prisma.subscriber.upsert({
    where: {
      userId_stripeCustomerId: {
        userId,
        stripeCustomerId: customerId,
      },
    },
    update: {
      email: customer.email || '',
      name: customer.name,
      status,
      plan,
      mrr,
      currentPeriodEnd,
      updatedAt: new Date(),
    },
    create: {
      userId,
      stripeCustomerId: customerId,
      email: customer.email || '',
      name: customer.name,
      status,
      plan,
      mrr,
      currentPeriodEnd,
      firstSeenAt: new Date(customer.created * 1000),
    },
  });
}
