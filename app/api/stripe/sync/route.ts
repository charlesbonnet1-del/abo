import { NextResponse } from 'next/server';
import { createAdminClient, getUser } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for large syncs

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

interface SubscriptionData {
  subscriber_id: string;
  stripe_subscription_id: string;
  status: string;
  plan_name: string | null;
  plan_amount: number;
  plan_interval: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
}

interface InvoiceData {
  subscriber_id: string;
  stripe_invoice_id: string;
  amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    console.error('Failed to create admin client - check SUPABASE_SERVICE_ROLE_KEY');
    return NextResponse.json({ error: 'database_error' }, { status: 500 });
  }

  const { data: userData, error: userError } = await supabase
    .from('user')
    .select('stripe_account_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.stripe_account_id) {
    return NextResponse.json({ error: 'not_connected' }, { status: 400 });
  }

  const stripeAccountId = userData.stripe_account_id;

  try {
    const stripe = getStripe();

    // Maps to track data
    const customerMap = new Map<string, SubscriberData>();
    const subscriptionsByCustomer = new Map<string, Stripe.Subscription[]>();
    const invoicesByCustomer = new Map<string, Stripe.Invoice[]>();

    // =====================
    // 1. FETCH ALL CUSTOMERS
    // =====================
    console.log('Fetching customers...');
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const customers: Stripe.ApiList<Stripe.Customer> = await stripe.customers.list({
        limit: 100,
        ...(startingAfter && { starting_after: startingAfter }),
      }, {
        stripeAccount: stripeAccountId,
      });

      for (const customer of customers.data) {
        if (customer.deleted) continue;

        const now = new Date().toISOString();
        customerMap.set(customer.id, {
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

    console.log(`Found ${customerMap.size} customers`);

    // =====================
    // 2. FETCH ALL SUBSCRIPTIONS
    // =====================
    console.log('Fetching subscriptions...');
    hasMore = true;
    startingAfter = undefined;

    while (hasMore) {
      const subscriptions: Stripe.ApiList<Stripe.Subscription> = await stripe.subscriptions.list({
        status: 'all',
        expand: ['data.items.data.price', 'data.default_payment_method'],
        limit: 100,
        ...(startingAfter && { starting_after: startingAfter }),
      }, {
        stripeAccount: stripeAccountId,
      });

      for (const sub of subscriptions.data) {
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

        if (!subscriptionsByCustomer.has(customerId)) {
          subscriptionsByCustomer.set(customerId, []);
        }
        subscriptionsByCustomer.get(customerId)!.push(sub);

        // Update customer subscription data
        const customerData = customerMap.get(customerId);
        if (customerData) {
          // Get payment method
          const pm = sub.default_payment_method as Stripe.PaymentMethod | null;
          if (pm) {
            customerData.payment_method_type = pm.type;
            if (pm.card) {
              customerData.payment_method_last4 = pm.card.last4;
            } else if (pm.sepa_debit) {
              customerData.payment_method_last4 = pm.sepa_debit.last4 || null;
            }
          }

          // Calculate MRR (only for active/trialing subscriptions)
          if (sub.status === 'active' || sub.status === 'trialing') {
            const priceItem = sub.items.data[0];
            if (priceItem?.price) {
              const amount = priceItem.price.unit_amount || 0;
              const interval = priceItem.price.recurring?.interval;

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
              customerData.mrr += monthlyAmount;

              // Set plan info from most recent active subscription
              if (!customerData.plan_name || sub.status === 'active') {
                customerData.plan_name = priceItem.price.nickname || priceItem.price.id;
                customerData.plan_interval = interval || null;
              }
            }
          }

          // Set subscription status (prioritize active > trialing > others)
          const statusPriority: Record<string, number> = {
            active: 1,
            trialing: 2,
            past_due: 3,
            paused: 4,
            canceled: 5,
            incomplete: 6,
            incomplete_expired: 7,
            unpaid: 8,
          };

          const currentPriority = statusPriority[customerData.subscription_status] || 99;
          const newPriority = statusPriority[sub.status] || 99;

          if (newPriority < currentPriority || customerData.subscription_status === 'none') {
            customerData.subscription_status = sub.status;
            // Access period dates (they exist but aren't in the type definition for newer API versions)
            const subWithPeriod = sub as unknown as {
              current_period_start?: number;
              current_period_end?: number;
            };
            customerData.current_period_start = subWithPeriod.current_period_start
              ? new Date(subWithPeriod.current_period_start * 1000).toISOString()
              : null;
            customerData.current_period_end = subWithPeriod.current_period_end
              ? new Date(subWithPeriod.current_period_end * 1000).toISOString()
              : null;
          }

          customerData.currency = sub.currency || customerData.currency;
        }
      }

      hasMore = subscriptions.has_more;
      if (subscriptions.data.length > 0) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
      }
    }

    console.log(`Found subscriptions for ${subscriptionsByCustomer.size} customers`);

    // =====================
    // 3. FETCH ALL INVOICES (for lifetime value)
    // =====================
    console.log('Fetching invoices...');
    hasMore = true;
    startingAfter = undefined;

    while (hasMore) {
      const invoices: Stripe.ApiList<Stripe.Invoice> = await stripe.invoices.list({
        limit: 100,
        ...(startingAfter && { starting_after: startingAfter }),
      }, {
        stripeAccount: stripeAccountId,
      });

      for (const invoice of invoices.data) {
        const customerId = typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id;

        if (!customerId) continue;

        if (!invoicesByCustomer.has(customerId)) {
          invoicesByCustomer.set(customerId, []);
        }
        invoicesByCustomer.get(customerId)!.push(invoice);

        // Update customer lifetime value and payment info
        const customerData = customerMap.get(customerId);
        if (customerData && invoice.status === 'paid' && invoice.amount_paid) {
          customerData.lifetime_value += invoice.amount_paid;

          // Track most recent payment
          const paidAt = invoice.status_transitions?.paid_at;
          if (paidAt) {
            const paidDate = new Date(paidAt * 1000).toISOString();
            if (!customerData.last_payment_at || paidDate > customerData.last_payment_at) {
              customerData.last_payment_at = paidDate;
              customerData.last_payment_status = 'succeeded';
            }
          }
        } else if (customerData && invoice.status === 'open' && invoice.attempted) {
          // Failed payment attempt
          const attemptedAt = invoice.created;
          const attemptDate = new Date(attemptedAt * 1000).toISOString();
          if (!customerData.last_payment_at || attemptDate > customerData.last_payment_at) {
            customerData.last_payment_at = attemptDate;
            customerData.last_payment_status = 'failed';
          }
        }
      }

      hasMore = invoices.has_more;
      if (invoices.data.length > 0) {
        startingAfter = invoices.data[invoices.data.length - 1].id;
      }
    }

    console.log(`Found invoices for ${invoicesByCustomer.size} customers`);

    // =====================
    // 4. UPSERT SUBSCRIBERS
    // =====================
    console.log('Upserting subscribers...');
    let syncedSubscribers = 0;
    const subscriberIdMap = new Map<string, string>(); // stripe_customer_id -> subscriber.id

    for (const [stripeCustomerId, subscriberData] of Array.from(customerMap.entries())) {
      // First try to find existing subscriber
      const { data: existing } = await supabase
        .from('subscriber')
        .select('id')
        .eq('user_id', user.id)
        .eq('stripe_customer_id', stripeCustomerId)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('subscriber')
          .update(subscriberData)
          .eq('id', existing.id);

        if (!error) {
          syncedSubscribers++;
          subscriberIdMap.set(stripeCustomerId, existing.id);
        } else {
          console.error('Failed to update subscriber:', error);
        }
      } else {
        // Insert new
        const { data: inserted, error } = await supabase
          .from('subscriber')
          .insert(subscriberData)
          .select('id')
          .single();

        if (!error && inserted) {
          syncedSubscribers++;
          subscriberIdMap.set(stripeCustomerId, inserted.id);
        } else {
          console.error('Failed to insert subscriber:', error);
        }
      }
    }

    console.log(`Synced ${syncedSubscribers} subscribers`);

    // =====================
    // 5. UPSERT SUBSCRIPTIONS
    // =====================
    console.log('Upserting subscriptions...');
    let syncedSubscriptions = 0;

    for (const [stripeCustomerId, subs] of Array.from(subscriptionsByCustomer.entries())) {
      const subscriberId = subscriberIdMap.get(stripeCustomerId);
      if (!subscriberId) continue;

      for (const sub of subs) {
        const priceItem = sub.items.data[0];
        // Access period dates (they exist but aren't in the type definition for newer API versions)
        const subPeriod = sub as unknown as {
          current_period_start?: number;
          current_period_end?: number;
        };
        const subscriptionData: SubscriptionData = {
          subscriber_id: subscriberId,
          stripe_subscription_id: sub.id,
          status: sub.status,
          plan_name: priceItem?.price?.nickname || priceItem?.price?.id || null,
          plan_amount: priceItem?.price?.unit_amount || 0,
          plan_interval: priceItem?.price?.recurring?.interval || null,
          current_period_start: subPeriod.current_period_start
            ? new Date(subPeriod.current_period_start * 1000).toISOString()
            : null,
          current_period_end: subPeriod.current_period_end
            ? new Date(subPeriod.current_period_end * 1000).toISOString()
            : null,
          cancel_at_period_end: sub.cancel_at_period_end,
          canceled_at: sub.canceled_at
            ? new Date(sub.canceled_at * 1000).toISOString()
            : null,
          created_at: new Date(sub.created * 1000).toISOString(),
        };

        const { error } = await supabase
          .from('subscription')
          .upsert(subscriptionData, {
            onConflict: 'subscriber_id,stripe_subscription_id',
          });

        if (!error) {
          syncedSubscriptions++;
        } else {
          console.error('Failed to upsert subscription:', error);
        }
      }
    }

    console.log(`Synced ${syncedSubscriptions} subscriptions`);

    // =====================
    // 6. UPSERT INVOICES
    // =====================
    console.log('Upserting invoices...');
    let syncedInvoices = 0;

    for (const [stripeCustomerId, invs] of Array.from(invoicesByCustomer.entries())) {
      const subscriberId = subscriberIdMap.get(stripeCustomerId);
      if (!subscriberId) continue;

      for (const inv of invs) {
        const invoiceData: InvoiceData = {
          subscriber_id: subscriberId,
          stripe_invoice_id: inv.id,
          amount: inv.amount_paid || inv.amount_due || 0,
          currency: inv.currency || 'eur',
          status: inv.status || 'draft',
          paid_at: inv.status_transitions?.paid_at
            ? new Date(inv.status_transitions.paid_at * 1000).toISOString()
            : null,
          created_at: new Date(inv.created * 1000).toISOString(),
        };

        const { error } = await supabase
          .from('invoice')
          .upsert(invoiceData, {
            onConflict: 'subscriber_id,stripe_invoice_id',
          });

        if (!error) {
          syncedInvoices++;
        } else {
          console.error('Failed to upsert invoice:', error);
        }
      }
    }

    console.log(`Synced ${syncedInvoices} invoices`);

    // =====================
    // 7. UPDATE LAST SYNC
    // =====================
    await supabase
      .from('user')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      synced: syncedSubscribers,
      subscriptions: syncedSubscriptions,
      invoices: syncedInvoices,
      total: customerMap.size,
    });
  } catch (err) {
    console.error('Sync error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';

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

export async function GET() {
  return POST();
}
