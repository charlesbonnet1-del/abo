-- Migration: Behavioral tracking SDK events and API keys

-- Add SDK API key to user table for SDK authentication
ALTER TABLE public."user" ADD COLUMN IF NOT EXISTS sdk_api_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sdk_api_key ON public."user"(sdk_api_key) WHERE sdk_api_key IS NOT NULL;

-- Create behavioral_event table
CREATE TABLE IF NOT EXISTS public.behavioral_event (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES public.subscriber(id) ON DELETE SET NULL,

    -- Identification (at least one should be set)
    visitor_id TEXT, -- anonymous visitor ID (generated client-side)
    email TEXT,
    stripe_customer_id TEXT,
    external_user_id TEXT, -- custom userId from the SDK user

    -- Event data
    event_type TEXT NOT NULL, -- page_view, click, scroll, session_start, session_end, feature_use, custom
    event_name TEXT, -- custom event name or feature name
    event_data JSONB DEFAULT '{}'::jsonb, -- flexible payload

    -- Page context
    page_url TEXT,
    page_title TEXT,
    page_path TEXT,
    referrer TEXT,

    -- Session context
    session_id TEXT,

    -- Device context
    device_type TEXT, -- desktop, mobile, tablet
    browser TEXT,
    os TEXT,
    screen_width INTEGER,
    screen_height INTEGER,

    -- Timestamps
    event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_behavioral_event_user_id ON public.behavioral_event(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_event_subscriber_id ON public.behavioral_event(subscriber_id) WHERE subscriber_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_behavioral_event_visitor_id ON public.behavioral_event(visitor_id) WHERE visitor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_behavioral_event_email ON public.behavioral_event(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_behavioral_event_type ON public.behavioral_event(user_id, event_type, event_at);
CREATE INDEX IF NOT EXISTS idx_behavioral_event_session ON public.behavioral_event(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_behavioral_event_created ON public.behavioral_event(created_at);

-- RLS policies
ALTER TABLE public.behavioral_event ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own behavioral events"
    ON public.behavioral_event FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to behavioral events"
    ON public.behavioral_event
    USING (auth.jwt() ->> 'role' = 'service_role');
