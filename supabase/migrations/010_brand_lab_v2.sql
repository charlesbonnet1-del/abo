-- Brand Lab v2: Multi-products, detailed features, Stripe plan sync
-- Migration 010

-- Table des produits (un user peut avoir plusieurs produits)
CREATE TABLE IF NOT EXISTS public.product (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  product_type TEXT, -- 'saas', 'mobile_app', 'api', 'marketplace', etc.
  aha_moment_description TEXT,
  target_audience TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des features (liées à un produit)
CREATE TABLE IF NOT EXISTS public.product_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.product(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL, -- identifiant unique: "dashboard", "export", "api"
  name TEXT NOT NULL, -- nom affichable: "Tableaux de bord personnalisés"
  description_short TEXT, -- "Créez des dashboards sur mesure"
  description_long TEXT, -- description détaillée
  benefit TEXT, -- "Gagnez du temps dans vos analyses"
  how_to_access TEXT, -- "Menu > Analytics > Nouveau dashboard"
  use_cases TEXT[], -- ["Suivi des ventes", "Reporting équipe"]
  keywords TEXT[], -- ["dashboard", "analytics", "KPI"]
  is_core BOOLEAN DEFAULT true, -- feature "safe" présente depuis toujours
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, feature_key)
);

-- Table des plans (sync depuis Stripe + enrichissement)
CREATE TABLE IF NOT EXISTS public.plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.product(id) ON DELETE SET NULL,
  stripe_product_id TEXT, -- prod_xxx depuis Stripe
  stripe_price_id TEXT, -- price_xxx depuis Stripe
  name TEXT NOT NULL, -- "Pro", "Business"
  description TEXT, -- description marketing
  price_amount INTEGER, -- en centimes
  price_currency TEXT DEFAULT 'eur',
  billing_interval TEXT, -- 'month', 'year'
  features_from_stripe TEXT[], -- features depuis metadata Stripe
  features_manual TEXT[], -- features configurées manuellement (override)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de liaison plan <-> features (pour config manuelle détaillée)
CREATE TABLE IF NOT EXISTS public.plan_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.plan(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES public.product_feature(id) ON DELETE CASCADE,
  limit_value INTEGER, -- NULL = illimité, sinon limite (ex: 5 dashboards)
  limit_description TEXT, -- "5 dashboards maximum"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, feature_id)
);

-- Ajouter entitled_features et product_id au subscriber
ALTER TABLE public.subscriber
ADD COLUMN IF NOT EXISTS entitled_features TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.product(id) ON DELETE SET NULL;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_product_user ON public.product(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_product ON public.product_feature(product_id);
CREATE INDEX IF NOT EXISTS idx_feature_key ON public.product_feature(feature_key);
CREATE INDEX IF NOT EXISTS idx_plan_user ON public.plan(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_stripe_product ON public.plan(stripe_product_id);
CREATE INDEX IF NOT EXISTS idx_plan_stripe_price ON public.plan(stripe_price_id);
CREATE INDEX IF NOT EXISTS idx_plan_feature_plan ON public.plan_feature(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriber_product ON public.subscriber(product_id);

-- RLS
ALTER TABLE public.product ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_feature ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_feature ENABLE ROW LEVEL SECURITY;

-- Policies pour product
DROP POLICY IF EXISTS "Users can view their products" ON public.product;
CREATE POLICY "Users can view their products" ON public.product
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their products" ON public.product;
CREATE POLICY "Users can create their products" ON public.product
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their products" ON public.product;
CREATE POLICY "Users can update their products" ON public.product
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their products" ON public.product;
CREATE POLICY "Users can delete their products" ON public.product
  FOR DELETE USING (auth.uid() = user_id);

-- Policies pour product_feature
DROP POLICY IF EXISTS "Users can view features of their products" ON public.product_feature;
CREATE POLICY "Users can view features of their products" ON public.product_feature
  FOR SELECT USING (
    product_id IN (SELECT id FROM public.product WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create features for their products" ON public.product_feature;
CREATE POLICY "Users can create features for their products" ON public.product_feature
  FOR INSERT WITH CHECK (
    product_id IN (SELECT id FROM public.product WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update features of their products" ON public.product_feature;
CREATE POLICY "Users can update features of their products" ON public.product_feature
  FOR UPDATE USING (
    product_id IN (SELECT id FROM public.product WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete features of their products" ON public.product_feature;
CREATE POLICY "Users can delete features of their products" ON public.product_feature
  FOR DELETE USING (
    product_id IN (SELECT id FROM public.product WHERE user_id = auth.uid())
  );

-- Policies pour plan
DROP POLICY IF EXISTS "Users can view their plans" ON public.plan;
CREATE POLICY "Users can view their plans" ON public.plan
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their plans" ON public.plan;
CREATE POLICY "Users can create their plans" ON public.plan
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their plans" ON public.plan;
CREATE POLICY "Users can update their plans" ON public.plan
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their plans" ON public.plan;
CREATE POLICY "Users can delete their plans" ON public.plan
  FOR DELETE USING (auth.uid() = user_id);

-- Policies pour plan_feature
DROP POLICY IF EXISTS "Users can view their plan features" ON public.plan_feature;
CREATE POLICY "Users can view their plan features" ON public.plan_feature
  FOR SELECT USING (
    plan_id IN (SELECT id FROM public.plan WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create their plan features" ON public.plan_feature;
CREATE POLICY "Users can create their plan features" ON public.plan_feature
  FOR INSERT WITH CHECK (
    plan_id IN (SELECT id FROM public.plan WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update their plan features" ON public.plan_feature;
CREATE POLICY "Users can update their plan features" ON public.plan_feature
  FOR UPDATE USING (
    plan_id IN (SELECT id FROM public.plan WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete their plan features" ON public.plan_feature;
CREATE POLICY "Users can delete their plan features" ON public.plan_feature
  FOR DELETE USING (
    plan_id IN (SELECT id FROM public.plan WHERE user_id = auth.uid())
  );

-- Comments
COMMENT ON TABLE public.product IS 'Products owned by a user (multi-product support)';
COMMENT ON TABLE public.product_feature IS 'Features of a product with rich metadata';
COMMENT ON TABLE public.plan IS 'Pricing plans synced from Stripe with feature configuration';
COMMENT ON TABLE public.plan_feature IS 'Feature limits per plan';
COMMENT ON COLUMN public.product_feature.feature_key IS 'Unique identifier for the feature within the product';
COMMENT ON COLUMN public.product_feature.is_core IS 'Core features are safe and have been available since launch';
COMMENT ON COLUMN public.plan.features_from_stripe IS 'Features extracted from Stripe metadata';
COMMENT ON COLUMN public.plan.features_manual IS 'Manually configured features that override Stripe';
COMMENT ON COLUMN public.subscriber.entitled_features IS 'Feature keys this subscriber has access to';
