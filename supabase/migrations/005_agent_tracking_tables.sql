-- =============================================
-- ABO - AGENT TRACKING TABLES MIGRATION
-- =============================================

-- =============================================
-- PART A: NEW TRACKING TABLES
-- =============================================

-- Table recovery_sequence for tracking payment recovery sequences
CREATE TABLE IF NOT EXISTS public.recovery_sequence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES public.subscriber(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoice(id),
  stripe_invoice_id TEXT,
  current_step INTEGER DEFAULT 1, -- 1, 2, 3, 4
  next_action_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- active, recovered, abandoned, canceled
  started_at TIMESTAMPTZ DEFAULT NOW(),
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table retention_alert for tracking retention opportunities
CREATE TABLE IF NOT EXISTS public.retention_alert (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES public.subscriber(id) ON DELETE CASCADE,
  alert_type TEXT, -- 'cancel_pending', 'downgrade', 'expiring_soon', 'inactive'
  status TEXT DEFAULT 'active', -- active, resolved, churned
  action_taken TEXT, -- 'email_sent', 'discount_offered', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Table conversion_opportunity for tracking conversion opportunities
CREATE TABLE IF NOT EXISTS public.conversion_opportunity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES public.subscriber(id) ON DELETE CASCADE,
  opportunity_type TEXT, -- 'trial_ending', 'freemium_inactive', 'no_subscription'
  status TEXT DEFAULT 'active', -- active, converted, lost, expired
  emails_sent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);

-- =============================================
-- PART B: AGENT_CONFIG ADDITIONS
-- =============================================

-- Add agent-specific configuration columns to agent_config
ALTER TABLE public.agent_config
ADD COLUMN IF NOT EXISTS recovery_delays INTEGER[] DEFAULT '{0, 1, 3, 7}',
ADD COLUMN IF NOT EXISTS trial_warning_days INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS freemium_conversion_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS churn_risk_threshold INTEGER DEFAULT 70;

-- =============================================
-- PART C: ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on new tables
ALTER TABLE public.recovery_sequence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_alert ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_opportunity ENABLE ROW LEVEL SECURITY;

-- RECOVERY_SEQUENCE policies
CREATE POLICY "Users can view own recovery sequences"
  ON public.recovery_sequence FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recovery sequences"
  ON public.recovery_sequence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recovery sequences"
  ON public.recovery_sequence FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recovery sequences"
  ON public.recovery_sequence FOR DELETE
  USING (auth.uid() = user_id);

-- RETENTION_ALERT policies
CREATE POLICY "Users can view own retention alerts"
  ON public.retention_alert FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own retention alerts"
  ON public.retention_alert FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own retention alerts"
  ON public.retention_alert FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own retention alerts"
  ON public.retention_alert FOR DELETE
  USING (auth.uid() = user_id);

-- CONVERSION_OPPORTUNITY policies
CREATE POLICY "Users can view own conversion opportunities"
  ON public.conversion_opportunity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversion opportunities"
  ON public.conversion_opportunity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversion opportunities"
  ON public.conversion_opportunity FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversion opportunities"
  ON public.conversion_opportunity FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- PART D: INDEXES
-- =============================================

-- Recovery sequence indexes
CREATE INDEX IF NOT EXISTS idx_recovery_sequence_next_action
  ON public.recovery_sequence(next_action_at)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_recovery_sequence_user
  ON public.recovery_sequence(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_sequence_subscriber
  ON public.recovery_sequence(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_recovery_sequence_stripe_invoice
  ON public.recovery_sequence(stripe_invoice_id);

-- Retention alert indexes
CREATE INDEX IF NOT EXISTS idx_retention_alert_user
  ON public.retention_alert(user_id);
CREATE INDEX IF NOT EXISTS idx_retention_alert_subscriber
  ON public.retention_alert(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_retention_alert_status
  ON public.retention_alert(status)
  WHERE status = 'active';

-- Conversion opportunity indexes
CREATE INDEX IF NOT EXISTS idx_conversion_opportunity_user
  ON public.conversion_opportunity(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_opportunity_subscriber
  ON public.conversion_opportunity(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_conversion_opportunity_status
  ON public.conversion_opportunity(status)
  WHERE status = 'active';

-- Additional index for pending actions
CREATE INDEX IF NOT EXISTS idx_agent_action_pending
  ON public.agent_action(user_id, created_at DESC)
  WHERE status = 'pending_approval';
