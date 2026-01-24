-- Migration: Onboarding Agent tables and configuration

-- Create onboarding_sequence table
CREATE TABLE IF NOT EXISTS public.onboarding_sequence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    subscriber_id UUID NOT NULL REFERENCES public.subscriber(id) ON DELETE CASCADE,
    current_step INTEGER NOT NULL DEFAULT 1,
    total_steps INTEGER NOT NULL DEFAULT 3,
    next_action_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'canceled')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient cron queries
CREATE INDEX IF NOT EXISTS idx_onboarding_sequence_status_next_action
    ON public.onboarding_sequence(status, next_action_at);

-- Index for subscriber lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_sequence_subscriber
    ON public.onboarding_sequence(subscriber_id);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_sequence_user
    ON public.onboarding_sequence(user_id);

-- RLS policies for onboarding_sequence
ALTER TABLE public.onboarding_sequence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own onboarding sequences"
    ON public.onboarding_sequence FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding sequences"
    ON public.onboarding_sequence FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding sequences"
    ON public.onboarding_sequence FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to onboarding sequences"
    ON public.onboarding_sequence
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Add updated_at trigger
CREATE TRIGGER update_onboarding_sequence_updated_at
    BEFORE UPDATE ON public.onboarding_sequence
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add default onboarding agent config for existing users who have agent_config
-- This adds the onboarding type to their existing configs
INSERT INTO public.agent_config (user_id, agent_type, is_active, confidence_level, strategy_template, strategy_config)
SELECT DISTINCT
    user_id,
    'onboarding'::text,
    false, -- Not active by default
    'review_all'::text,
    'moderate'::text,
    jsonb_build_object(
        'onboarding_sequence', jsonb_build_object(
            'totalSteps', 3,
            'delayBetweenSteps', 24,
            'welcomeEmailEnabled', true,
            'featureHighlightEnabled', true,
            'ahaMomentEnabled', true
        )
    )
FROM public.agent_config
WHERE NOT EXISTS (
    SELECT 1 FROM public.agent_config ac2
    WHERE ac2.user_id = agent_config.user_id
    AND ac2.agent_type = 'onboarding'
)
ON CONFLICT DO NOTHING;
