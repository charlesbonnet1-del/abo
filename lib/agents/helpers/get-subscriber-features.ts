import { createAdminClient } from '@/lib/supabase/server';

export interface ProductFeature {
  id: string;
  feature_key: string;
  name: string;
  description_short: string | null;
  description_long: string | null;
  benefit: string | null;
  how_to_access: string | null;
  use_cases: string[];
  keywords: string[];
  is_core: boolean;
}

export interface SubscriberFeaturesResult {
  features: ProductFeature[];
  isConfigured: boolean;
  fallbackMode: 'specific' | 'plan_default' | 'generic';
  productId: string | null;
  planId: string | null;
}

/**
 * Gets the features a subscriber has access to.
 *
 * Priority:
 * 1. Subscriber's entitled_features (specific to them)
 * 2. Features from their current plan (via plan_feature or features_manual)
 * 3. Empty array if nothing configured (generic mode)
 */
export async function getSubscriberFeatures(
  subscriberId: string
): Promise<SubscriberFeaturesResult> {
  const supabase = createAdminClient();
  if (!supabase) {
    return {
      features: [],
      isConfigured: false,
      fallbackMode: 'generic',
      productId: null,
      planId: null,
    };
  }

  // Get subscriber with product info
  const { data: subscriber, error: subscriberError } = await supabase
    .from('subscriber')
    .select(`
      id,
      user_id,
      entitled_features,
      product_id,
      subscription (
        stripe_subscription_id,
        status,
        plan_name
      )
    `)
    .eq('id', subscriberId)
    .single();

  if (subscriberError || !subscriber) {
    console.error('Error fetching subscriber:', subscriberError);
    return {
      features: [],
      isConfigured: false,
      fallbackMode: 'generic',
      productId: null,
      planId: null,
    };
  }

  // Case 1: Subscriber has specific entitled_features
  if (subscriber.entitled_features && subscriber.entitled_features.length > 0) {
    const features = await getFeaturesByKeys(
      subscriber.product_id,
      subscriber.entitled_features,
      supabase
    );

    return {
      features,
      isConfigured: features.length > 0,
      fallbackMode: 'specific',
      productId: subscriber.product_id,
      planId: null,
    };
  }

  // Case 2: Try to find plan and its features
  // Get the active subscription
  const subscriptions = (subscriber.subscription || []) as Array<{
    stripe_subscription_id: string;
    status: string;
    plan_name: string | null;
  }>;

  const activeSubscription = subscriptions.find(
    (s) => s.status === 'active' || s.status === 'trialing'
  );

  if (activeSubscription) {
    // Find plan by looking up via subscription table
    const { data: subscriptionData } = await supabase
      .from('subscription')
      .select('stripe_subscription_id')
      .eq('subscriber_id', subscriberId)
      .eq('status', activeSubscription.status)
      .single();

    if (subscriptionData) {
      // Get the plan associated with this subscription from plan table
      // We need to match by name since we don't have direct FK
      const { data: plan } = await supabase
        .from('plan')
        .select(`
          id,
          product_id,
          features_manual,
          features_from_stripe,
          plan_feature (
            id,
            limit_value,
            limit_description,
            feature:product_feature (*)
          )
        `)
        .eq('user_id', subscriber.user_id)
        .eq('name', activeSubscription.plan_name)
        .single();

      if (plan) {
        // Check if plan has detailed feature links
        const planFeatures = (plan.plan_feature || []) as unknown as Array<{
          id: string;
          limit_value: number | null;
          limit_description: string | null;
          feature: ProductFeature | null;
        }>;

        if (planFeatures.length > 0) {
          const features = planFeatures
            .filter((pf) => pf.feature)
            .map((pf) => pf.feature as ProductFeature);

          return {
            features,
            isConfigured: true,
            fallbackMode: 'plan_default',
            productId: plan.product_id,
            planId: plan.id,
          };
        }

        // Fallback to features_manual or features_from_stripe
        const featureKeys =
          plan.features_manual && plan.features_manual.length > 0
            ? plan.features_manual
            : plan.features_from_stripe || [];

        if (featureKeys.length > 0) {
          const features = await getFeaturesByKeys(
            plan.product_id,
            featureKeys,
            supabase
          );

          return {
            features,
            isConfigured: features.length > 0,
            fallbackMode: 'plan_default',
            productId: plan.product_id,
            planId: plan.id,
          };
        }
      }
    }
  }

  // Case 3: Nothing configured, generic mode
  return {
    features: [],
    isConfigured: false,
    fallbackMode: 'generic',
    productId: subscriber.product_id,
    planId: null,
  };
}

/**
 * Gets feature details by their keys
 */
async function getFeaturesByKeys(
  productId: string | null,
  featureKeys: string[],
  supabase: ReturnType<typeof createAdminClient>
): Promise<ProductFeature[]> {
  if (!supabase || !productId || featureKeys.length === 0) {
    return [];
  }

  const { data: features, error } = await supabase
    .from('product_feature')
    .select('*')
    .eq('product_id', productId)
    .in('feature_key', featureKeys);

  if (error) {
    console.error('Error fetching features by keys:', error);
    return [];
  }

  return (features || []) as ProductFeature[];
}

/**
 * Gets all features for a product
 */
export async function getAllProductFeatures(
  productId: string
): Promise<ProductFeature[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data: features, error } = await supabase
    .from('product_feature')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching product features:', error);
    return [];
  }

  return (features || []) as ProductFeature[];
}

/**
 * Gets a feature's full description for use in agent prompts
 */
export function formatFeatureForPrompt(feature: ProductFeature): string {
  const parts: string[] = [];

  parts.push(`**${feature.name}** (${feature.feature_key})`);

  if (feature.description_short) {
    parts.push(feature.description_short);
  }

  if (feature.benefit) {
    parts.push(`Bénéfice: ${feature.benefit}`);
  }

  if (feature.how_to_access) {
    parts.push(`Accès: ${feature.how_to_access}`);
  }

  if (feature.use_cases && feature.use_cases.length > 0) {
    parts.push(`Cas d'usage: ${feature.use_cases.join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * Formats all features for use in agent prompts
 */
export function formatFeaturesForPrompt(features: ProductFeature[]): string {
  if (features.length === 0) {
    return 'Aucune feature configurée. Les agents utiliseront des descriptions génériques.';
  }

  return features.map(formatFeatureForPrompt).join('\n\n---\n\n');
}
