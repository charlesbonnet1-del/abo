-- Create subscriber table for imported Stripe customers
CREATE TABLE IF NOT EXISTS public.subscriber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userid UUID NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,

  -- Stripe identifiers
  stripecustomerid TEXT NOT NULL,

  -- Customer info
  email TEXT,
  name TEXT,

  -- Subscription info
  status TEXT NOT NULL DEFAULT 'active', -- active, trialing, past_due, canceled, unpaid
  plan TEXT,
  mrr INTEGER DEFAULT 0, -- Monthly recurring revenue in cents
  ltv INTEGER DEFAULT 0, -- Lifetime value in cents

  -- Dates
  currentperiodend TIMESTAMPTZ,
  cardexpiresat TIMESTAMPTZ,
  firstseenat TIMESTAMPTZ DEFAULT NOW(),
  createdat TIMESTAMPTZ DEFAULT NOW(),
  updatedat TIMESTAMPTZ DEFAULT NOW(),

  -- Health & engagement
  healthscore INTEGER DEFAULT 70, -- 0-100

  -- Unique constraint per user per customer
  UNIQUE(userid, stripecustomerid)
);

-- Enable RLS
ALTER TABLE public.subscriber ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own subscribers
CREATE POLICY "Users can view own subscribers"
  ON public.subscriber FOR SELECT
  USING (auth.uid() = userid);

CREATE POLICY "Users can insert own subscribers"
  ON public.subscriber FOR INSERT
  WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can update own subscribers"
  ON public.subscriber FOR UPDATE
  USING (auth.uid() = userid);

CREATE POLICY "Users can delete own subscribers"
  ON public.subscriber FOR DELETE
  USING (auth.uid() = userid);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriber_userid ON public.subscriber(userid);
CREATE INDEX IF NOT EXISTS idx_subscriber_status ON public.subscriber(status);
CREATE INDEX IF NOT EXISTS idx_subscriber_email ON public.subscriber(email);
CREATE INDEX IF NOT EXISTS idx_subscriber_stripecustomerid ON public.subscriber(stripecustomerid);

-- Composite index for upsert operations
CREATE INDEX IF NOT EXISTS idx_subscriber_userid_customerid ON public.subscriber(userid, stripecustomerid);
