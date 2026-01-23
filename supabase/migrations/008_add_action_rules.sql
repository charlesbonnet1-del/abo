-- Add action_rules column to agent_config table
-- This column stores HITL (Human-in-the-Loop) validation rules per action type

ALTER TABLE public.agent_config
ADD COLUMN IF NOT EXISTS action_rules JSONB DEFAULT '[]';

COMMENT ON COLUMN public.agent_config.action_rules IS 'HITL validation rules per action type: [{action_type, approval_mode, threshold}]';
