-- Add trial_end column to subscriber table
ALTER TABLE public.subscriber
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN public.subscriber.trial_end IS 'End date of trial period (if applicable)';
