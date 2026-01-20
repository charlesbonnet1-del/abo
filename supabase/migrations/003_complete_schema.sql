-- =============================================
-- ABO - COMPLETE DATABASE SCHEMA
-- =============================================

-- =============================================
-- PARTIE D: MISE À JOUR TABLE USER
-- =============================================

-- Ajouter les colonnes Stripe si elles n'existent pas
ALTER TABLE public.user
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_name TEXT,
ADD COLUMN IF NOT EXISTS stripe_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_access_token TEXT,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- Supprimer les anciennes colonnes si elles existent (migration)
ALTER TABLE public.user
DROP COLUMN IF EXISTS stripeaccountid,
DROP COLUMN IF EXISTS stripeaccesstoken,
DROP COLUMN IF EXISTS stripeconnectedat;

-- =============================================
-- PARTIE B: TABLE SUBSCRIBER
-- =============================================

DROP TABLE IF EXISTS public.subscriber CASCADE;

CREATE TABLE public.subscriber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  email TEXT,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  subscription_status TEXT DEFAULT 'none', -- active, past_due, canceled, trialing, paused, none
  mrr INTEGER DEFAULT 0, -- en centimes
  plan_name TEXT,
  plan_interval TEXT, -- month, year
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  payment_method_type TEXT, -- card, sepa_debit, etc.
  payment_method_last4 TEXT,
  currency TEXT DEFAULT 'eur',
  country TEXT,
  lifetime_value INTEGER DEFAULT 0, -- en centimes
  last_payment_at TIMESTAMPTZ,
  last_payment_status TEXT, -- succeeded, failed
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, stripe_customer_id)
);

-- =============================================
-- PARTIE B: TABLE SUBSCRIPTION
-- =============================================

CREATE TABLE IF NOT EXISTS public.subscription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES public.subscriber(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL,
  status TEXT, -- active, past_due, canceled, trialing, paused
  plan_name TEXT,
  plan_amount INTEGER, -- en centimes
  plan_interval TEXT, -- month, year
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(subscriber_id, stripe_subscription_id)
);

-- =============================================
-- PARTIE B: TABLE INVOICE
-- =============================================

CREATE TABLE IF NOT EXISTS public.invoice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES public.subscriber(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL,
  amount INTEGER, -- en centimes
  currency TEXT DEFAULT 'eur',
  status TEXT, -- paid, open, failed, uncollectible
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(subscriber_id, stripe_invoice_id)
);

-- =============================================
-- PARTIE B: TABLE BRAND_SETTINGS
-- =============================================

CREATE TABLE IF NOT EXISTS public.brand_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT,
  tone TEXT DEFAULT 'neutral', -- formal, neutral, casual, friendly
  humor TEXT DEFAULT 'none', -- none, subtle, yes
  language TEXT DEFAULT 'fr',
  values TEXT[], -- array de valeurs
  never_say TEXT[], -- choses à ne jamais dire
  always_mention TEXT[], -- choses à toujours mentionner
  example_emails TEXT[], -- exemples d'emails
  signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PARTIE B: TABLE AGENT_CONFIG
-- =============================================

CREATE TABLE IF NOT EXISTS public.agent_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL, -- recovery, retention, conversion
  is_active BOOLEAN DEFAULT FALSE,
  confidence_level TEXT DEFAULT 'review_all', -- review_all, auto_with_copy, full_auto
  notification_channels TEXT[] DEFAULT '{app}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, agent_type)
);

-- =============================================
-- PARTIE B: TABLE AGENT_ACTION_RULES
-- =============================================

CREATE TABLE IF NOT EXISTS public.agent_action_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_config_id UUID NOT NULL REFERENCES public.agent_config(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- send_email, offer_discount, refund, etc.
  requires_approval BOOLEAN DEFAULT TRUE,
  max_auto_amount INTEGER, -- en centimes, nullable
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PARTIE B: TABLE AGENT_ACTION
-- =============================================

CREATE TABLE IF NOT EXISTS public.agent_action (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL, -- recovery, retention, conversion
  action_type TEXT NOT NULL, -- email_sent, discount_offered, refund_processed, etc.
  subscriber_id UUID REFERENCES public.subscriber(id) ON DELETE SET NULL,
  description TEXT,
  status TEXT DEFAULT 'pending_approval', -- pending_approval, approved, rejected, executed, failed
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PARTIE B: TABLE AGENT_COMMUNICATION
-- =============================================

CREATE TABLE IF NOT EXISTS public.agent_communication (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES public.subscriber(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL, -- recovery, retention, conversion
  channel TEXT NOT NULL, -- email, sms, in_app
  subject TEXT,
  content TEXT,
  status TEXT DEFAULT 'sent', -- sent, delivered, opened, clicked, bounced
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- =============================================
-- PARTIE C: ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.subscriber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_action_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_action ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_communication ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean migration)
DROP POLICY IF EXISTS "Users can view own subscribers" ON public.subscriber;
DROP POLICY IF EXISTS "Users can insert own subscribers" ON public.subscriber;
DROP POLICY IF EXISTS "Users can update own subscribers" ON public.subscriber;
DROP POLICY IF EXISTS "Users can delete own subscribers" ON public.subscriber;

-- SUBSCRIBER policies
CREATE POLICY "Users can view own subscribers"
  ON public.subscriber FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscribers"
  ON public.subscriber FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscribers"
  ON public.subscriber FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscribers"
  ON public.subscriber FOR DELETE
  USING (auth.uid() = user_id);

-- SUBSCRIPTION policies (join via subscriber)
CREATE POLICY "Users can view own subscriptions"
  ON public.subscription FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.subscriber
    WHERE subscriber.id = subscription.subscriber_id
    AND subscriber.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own subscriptions"
  ON public.subscription FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.subscriber
    WHERE subscriber.id = subscription.subscriber_id
    AND subscriber.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own subscriptions"
  ON public.subscription FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.subscriber
    WHERE subscriber.id = subscription.subscriber_id
    AND subscriber.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own subscriptions"
  ON public.subscription FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.subscriber
    WHERE subscriber.id = subscription.subscriber_id
    AND subscriber.user_id = auth.uid()
  ));

-- INVOICE policies (join via subscriber)
CREATE POLICY "Users can view own invoices"
  ON public.invoice FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.subscriber
    WHERE subscriber.id = invoice.subscriber_id
    AND subscriber.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own invoices"
  ON public.invoice FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.subscriber
    WHERE subscriber.id = invoice.subscriber_id
    AND subscriber.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own invoices"
  ON public.invoice FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.subscriber
    WHERE subscriber.id = invoice.subscriber_id
    AND subscriber.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own invoices"
  ON public.invoice FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.subscriber
    WHERE subscriber.id = invoice.subscriber_id
    AND subscriber.user_id = auth.uid()
  ));

-- BRAND_SETTINGS policies
CREATE POLICY "Users can view own brand settings"
  ON public.brand_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand settings"
  ON public.brand_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand settings"
  ON public.brand_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand settings"
  ON public.brand_settings FOR DELETE
  USING (auth.uid() = user_id);

-- AGENT_CONFIG policies
CREATE POLICY "Users can view own agent configs"
  ON public.agent_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent configs"
  ON public.agent_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent configs"
  ON public.agent_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own agent configs"
  ON public.agent_config FOR DELETE
  USING (auth.uid() = user_id);

-- AGENT_ACTION_RULES policies (join via agent_config)
CREATE POLICY "Users can view own action rules"
  ON public.agent_action_rules FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.agent_config
    WHERE agent_config.id = agent_action_rules.agent_config_id
    AND agent_config.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own action rules"
  ON public.agent_action_rules FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.agent_config
    WHERE agent_config.id = agent_action_rules.agent_config_id
    AND agent_config.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own action rules"
  ON public.agent_action_rules FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.agent_config
    WHERE agent_config.id = agent_action_rules.agent_config_id
    AND agent_config.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own action rules"
  ON public.agent_action_rules FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.agent_config
    WHERE agent_config.id = agent_action_rules.agent_config_id
    AND agent_config.user_id = auth.uid()
  ));

-- AGENT_ACTION policies
CREATE POLICY "Users can view own agent actions"
  ON public.agent_action FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent actions"
  ON public.agent_action FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent actions"
  ON public.agent_action FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own agent actions"
  ON public.agent_action FOR DELETE
  USING (auth.uid() = user_id);

-- AGENT_COMMUNICATION policies (join via subscriber)
CREATE POLICY "Users can view own communications"
  ON public.agent_communication FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.subscriber
    WHERE subscriber.id = agent_communication.subscriber_id
    AND subscriber.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own communications"
  ON public.agent_communication FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.subscriber
    WHERE subscriber.id = agent_communication.subscriber_id
    AND subscriber.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own communications"
  ON public.agent_communication FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.subscriber
    WHERE subscriber.id = agent_communication.subscriber_id
    AND subscriber.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own communications"
  ON public.agent_communication FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.subscriber
    WHERE subscriber.id = agent_communication.subscriber_id
    AND subscriber.user_id = auth.uid()
  ));

-- =============================================
-- PARTIE E: INDEXES
-- =============================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_user_stripe_account_id ON public.user(stripe_account_id);

-- Subscriber indexes
CREATE INDEX IF NOT EXISTS idx_subscriber_user_id ON public.subscriber(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriber_stripe_customer_id ON public.subscriber(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriber_status ON public.subscriber(subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscriber_email ON public.subscriber(email);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_subscription_subscriber_id ON public.subscription(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscription_status ON public.subscription(status);

-- Invoice indexes
CREATE INDEX IF NOT EXISTS idx_invoice_subscriber_id ON public.invoice(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON public.invoice(status);

-- Agent action indexes
CREATE INDEX IF NOT EXISTS idx_agent_action_user_id ON public.agent_action(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_action_user_created ON public.agent_action(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_action_status ON public.agent_action(status);

-- Agent communication indexes
CREATE INDEX IF NOT EXISTS idx_agent_communication_subscriber_id ON public.agent_communication(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_agent_communication_status ON public.agent_communication(status);

-- Agent config indexes
CREATE INDEX IF NOT EXISTS idx_agent_config_user_id ON public.agent_config(user_id);

-- Brand settings indexes
CREATE INDEX IF NOT EXISTS idx_brand_settings_user_id ON public.brand_settings(user_id);
