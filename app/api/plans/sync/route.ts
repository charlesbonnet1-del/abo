import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// Lazy initialization for Stripe
let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-12-15.clover',
    });
  }
  return stripe;
}

interface SyncResult {
  synced: number;
  created: number;
  updated: number;
  errors: string[];
}

export async function POST() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's Stripe account ID
  const { data: userData } = await supabase
    .from('user')
    .select('stripe_account_id')
    .eq('id', user.id)
    .single();

  if (!userData?.stripe_account_id) {
    return NextResponse.json(
      { error: 'Stripe account not connected' },
      { status: 400 }
    );
  }

  const stripeAccountId = userData.stripe_account_id;
  const stripeClient = getStripe();

  const result: SyncResult = {
    synced: 0,
    created: 0,
    updated: 0,
    errors: [],
  };

  try {
    // Fetch all active products from connected Stripe account
    const products = await stripeClient.products.list(
      { active: true, limit: 100 },
      { stripeAccount: stripeAccountId }
    );

    // Fetch all active prices
    const prices = await stripeClient.prices.list(
      { active: true, limit: 100, expand: ['data.product'] },
      { stripeAccount: stripeAccountId }
    );

    // Group prices by product
    const pricesByProduct: Record<string, Stripe.Price[]> = {};
    for (const price of prices.data) {
      const productId = typeof price.product === 'string'
        ? price.product
        : price.product.id;

      if (!pricesByProduct[productId]) {
        pricesByProduct[productId] = [];
      }
      pricesByProduct[productId].push(price);
    }

    // Process each product with its prices
    for (const product of products.data) {
      const productPrices = pricesByProduct[product.id] || [];

      // Extract features from product metadata
      const featuresFromMetadata = product.metadata?.features
        ? product.metadata.features.split(',').map((f) => f.trim())
        : [];

      for (const price of productPrices) {
        // Skip non-recurring prices for subscription-based sync
        if (!price.recurring) continue;

        try {
          // Check if plan already exists
          const { data: existingPlan } = await supabase
            .from('plan')
            .select('id')
            .eq('user_id', user.id)
            .eq('stripe_price_id', price.id)
            .single();

          const planData = {
            user_id: user.id,
            stripe_product_id: product.id,
            stripe_price_id: price.id,
            name: product.name,
            description: product.description || null,
            price_amount: price.unit_amount || 0,
            price_currency: price.currency,
            billing_interval: price.recurring?.interval || 'month',
            features_from_stripe: featuresFromMetadata,
            is_active: true,
            updated_at: new Date().toISOString(),
          };

          if (existingPlan) {
            // Update existing plan
            const { error } = await supabase
              .from('plan')
              .update(planData)
              .eq('id', existingPlan.id);

            if (error) {
              result.errors.push(`Error updating plan ${product.name}: ${error.message}`);
            } else {
              result.updated++;
            }
          } else {
            // Create new plan
            const { error } = await supabase
              .from('plan')
              .insert({
                ...planData,
                features_manual: [],
                created_at: new Date().toISOString(),
              });

            if (error) {
              result.errors.push(`Error creating plan ${product.name}: ${error.message}`);
            } else {
              result.created++;
            }
          }

          result.synced++;
        } catch (planError) {
          result.errors.push(
            `Error processing ${product.name} - ${price.id}: ${String(planError)}`
          );
        }
      }
    }

    // Deactivate plans that no longer exist in Stripe
    const allSyncedPriceIds = prices.data
      .filter((p) => p.recurring)
      .map((p) => p.id);

    if (allSyncedPriceIds.length > 0) {
      await supabase
        .from('plan')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .not('stripe_price_id', 'is', null)
        .not('stripe_price_id', 'in', `(${allSyncedPriceIds.map((id) => `"${id}"`).join(',')})`);
    }

    return NextResponse.json({
      success: true,
      ...result,
      message: `Synced ${result.synced} plans (${result.created} created, ${result.updated} updated)`,
    });
  } catch (error) {
    console.error('Error syncing plans from Stripe:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync plans from Stripe',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
