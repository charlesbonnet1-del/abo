-- Add action_id to agent_communication to link emails to actions
ALTER TABLE public.agent_communication
ADD COLUMN IF NOT EXISTS action_id UUID REFERENCES public.agent_action(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_communication_action_id
ON public.agent_communication(action_id);

-- Add column to track learning outcome detection
ALTER TABLE public.agent_action
ADD COLUMN IF NOT EXISTS outcome TEXT DEFAULT 'pending', -- pending, success, failure, partial
ADD COLUMN IF NOT EXISTS outcome_detected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS outcome_details JSONB;

COMMENT ON COLUMN public.agent_communication.action_id IS 'Links the communication to the agent action that triggered it';
COMMENT ON COLUMN public.agent_action.outcome IS 'The outcome of this action: pending, success, failure, partial';
