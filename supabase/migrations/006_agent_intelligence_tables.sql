-- Migration: Agent Intelligence Infrastructure
-- Description: Creates tables and functions for intelligent agents with memory and learning
-- Date: 2025-01-23

-- ============================================
-- 1. ENABLE PGVECTOR EXTENSION
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 2. TABLE AGENT_MEMORY (long-term memory)
-- ============================================
CREATE TABLE IF NOT EXISTS public.agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES public.subscriber(id) ON DELETE CASCADE,
  agent_type TEXT, -- 'recovery', 'retention', 'conversion', 'global'

  memory_type TEXT NOT NULL, -- 'interaction', 'preference', 'pattern', 'outcome', 'fact'

  content JSONB NOT NULL,
  -- Examples of content by memory_type:
  -- interaction: {type: "email_sent", subject: "...", response: "opened", date: "..."}
  -- preference: {prefers_discount: true, best_time: "morning", responsive_to: "urgency"}
  -- pattern: {trigger: "payment_failed", best_action: "email_friendly", success_rate: 0.7}
  -- outcome: {action: "offered_20_discount", result: "accepted", revenue_saved: 4900}
  -- fact: {plan: "pro", tenure_months: 14, total_spent: 68600, support_tickets: 3}

  -- Embedding for semantic search (dimension 1536 for OpenAI, 384 for all-MiniLM)
  embedding vector(1536),

  -- Metadata
  importance_score DECIMAL DEFAULT 0.5, -- 0 to 1, for pruning
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- NULL = never expires
);

-- Vector index for semantic search (ivfflat for performance)
CREATE INDEX IF NOT EXISTS idx_agent_memory_embedding ON public.agent_memory
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Classic indexes
CREATE INDEX IF NOT EXISTS idx_agent_memory_subscriber ON public.agent_memory(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_user_type ON public.agent_memory(user_id, agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_memory_type ON public.agent_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_agent_memory_importance ON public.agent_memory(importance_score DESC);

-- RLS
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own agent_memory" ON public.agent_memory;
CREATE POLICY "Users own agent_memory" ON public.agent_memory
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 3. TABLE AGENT_EPISODES (experience-based learning)
-- ============================================
CREATE TABLE IF NOT EXISTS public.agent_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  subscriber_id UUID REFERENCES public.subscriber(id) ON DELETE SET NULL,

  -- Initial situation (snapshot at action time)
  situation JSONB NOT NULL,
  -- Example: {
  --   subscriber: {plan: "pro", mrr: 7900, tenure_months: 8, health_score: 0.3},
  --   trigger: "cancel_pending",
  --   context: {previous_interactions: 2, last_contact: "2025-01-10"}
  -- }

  -- Action taken by the agent
  action_taken JSONB NOT NULL,
  -- Example: {
  --   type: "email",
  --   strategy: "offer_discount",
  --   details: {discount_percent: 20, duration_months: 3}
  -- }

  -- Observed outcome
  outcome TEXT NOT NULL, -- 'success', 'failure', 'partial', 'pending', 'ignored'
  outcome_details JSONB,
  -- Example: {
  --   result: "accepted",
  --   revenue_impact: 4740,
  --   time_to_resolution: "2 days"
  -- }

  -- Lessons extracted by AI
  lessons_learned JSONB,
  -- Example: [{
  --   insight: "Pro clients with 6+ months respond well to 20% discounts",
  --   confidence: 0.7,
  --   applicable_to: {plan: "pro", tenure_min: 6}
  -- }]

  -- Situation embedding to find similar cases
  situation_embedding vector(1536),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Vector index
CREATE INDEX IF NOT EXISTS idx_agent_episodes_embedding ON public.agent_episodes
  USING ivfflat (situation_embedding vector_cosine_ops) WITH (lists = 100);

-- Classic indexes
CREATE INDEX IF NOT EXISTS idx_agent_episodes_user_type ON public.agent_episodes(user_id, agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_episodes_outcome ON public.agent_episodes(outcome);
CREATE INDEX IF NOT EXISTS idx_agent_episodes_subscriber ON public.agent_episodes(subscriber_id);

-- RLS
ALTER TABLE public.agent_episodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own agent_episodes" ON public.agent_episodes;
CREATE POLICY "Users own agent_episodes" ON public.agent_episodes
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 4. TABLE AGENT_REASONING_LOGS (reasoning observability)
-- ============================================
CREATE TABLE IF NOT EXISTS public.agent_reasoning_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_action_id UUID NOT NULL REFERENCES public.agent_action(id) ON DELETE CASCADE,

  -- Reasoning step
  step_number INTEGER NOT NULL,
  step_type TEXT NOT NULL,
  -- Types: 'context_gathering', 'memory_retrieval', 'option_generation', 'evaluation', 'decision', 'plan_creation'

  -- Reasoning content in natural language
  thought TEXT NOT NULL,

  -- Associated structured data
  data JSONB,
  -- Examples by step_type:
  -- context_gathering: {subscriber_data: {...}, recent_events: [...]}
  -- memory_retrieval: {memories_found: 5, relevant_memories: [...]}
  -- option_generation: {options: [{action: "email", strategy: "friendly"}, ...]}
  -- evaluation: {scores: [{option: 0, score: 0.7, reasons: [...]}, ...]}
  -- decision: {chosen_option: 0, confidence: 0.75, reasoning: "..."}

  confidence_score DECIMAL, -- 0 to 1
  duration_ms INTEGER, -- time taken for this step

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reasoning_logs_action ON public.agent_reasoning_logs(agent_action_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_logs_step ON public.agent_reasoning_logs(step_type);

-- RLS (via agent_action)
ALTER TABLE public.agent_reasoning_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own reasoning_logs" ON public.agent_reasoning_logs;
CREATE POLICY "Users own reasoning_logs" ON public.agent_reasoning_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.agent_action
      WHERE agent_action.id = agent_reasoning_logs.agent_action_id
      AND agent_action.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. TABLE AGENT_PLANS (adaptive plans)
-- ============================================
CREATE TABLE IF NOT EXISTS public.agent_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES public.subscriber(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,

  -- Plan goal
  goal TEXT NOT NULL, -- Ex: "Recover failed payment of 79EUR"

  -- Plan steps
  steps JSONB NOT NULL,
  -- Example: [
  --   {step: 1, action: "send_friendly_email", status: "completed", result: "no_response"},
  --   {step: 2, action: "send_urgent_email", status: "pending", scheduled_at: "..."},
  --   {step: 3, action: "offer_discount", status: "contingent", condition: "if step 2 fails"}
  -- ]

  current_step INTEGER DEFAULT 1,

  -- Alternative plans
  contingencies JSONB,
  -- Example: {
  --   "if_no_response_after_step_2": {action: "escalate_to_phone", priority: "high"},
  --   "if_email_bounces": {action: "try_sms", immediate: true}
  -- }

  status TEXT DEFAULT 'active', -- 'active', 'completed', 'failed', 'abandoned', 'paused'

  -- Metrics
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  success_score DECIMAL, -- 0 to 1, final evaluation

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_plans_subscriber ON public.agent_plans(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_agent_plans_status ON public.agent_plans(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_agent_plans_user_type ON public.agent_plans(user_id, agent_type);

-- RLS
ALTER TABLE public.agent_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own agent_plans" ON public.agent_plans;
CREATE POLICY "Users own agent_plans" ON public.agent_plans
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 6. TABLE AGENT_FEEDBACK (for learning)
-- ============================================
CREATE TABLE IF NOT EXISTS public.agent_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_action_id UUID REFERENCES public.agent_action(id) ON DELETE SET NULL,
  subscriber_id UUID REFERENCES public.subscriber(id) ON DELETE SET NULL,

  feedback_type TEXT NOT NULL, -- 'approved', 'rejected', 'converted', 'churned', 'recovered', 'manual_rating'

  -- Context at feedback time
  context JSONB,

  -- Manual rating (optional, 1-5)
  rating INTEGER,

  -- User comment
  comment TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_feedback_user ON public.agent_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_feedback_type ON public.agent_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_agent_feedback_action ON public.agent_feedback(agent_action_id);

-- RLS
ALTER TABLE public.agent_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own agent_feedback" ON public.agent_feedback;
CREATE POLICY "Users own agent_feedback" ON public.agent_feedback
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 7. RPC FUNCTIONS FOR VECTOR SEARCH
-- ============================================

-- 7.1 Search for similar memories
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid,
  p_agent_type text
)
RETURNS TABLE (
  id uuid,
  subscriber_id uuid,
  memory_type text,
  content jsonb,
  importance_score decimal,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    am.id,
    am.subscriber_id,
    am.memory_type,
    am.content,
    am.importance_score,
    1 - (am.embedding <=> query_embedding) as similarity
  FROM public.agent_memory am
  WHERE am.user_id = p_user_id
    AND (am.agent_type = p_agent_type OR am.agent_type = 'global')
    AND am.embedding IS NOT NULL
    AND 1 - (am.embedding <=> query_embedding) > match_threshold
  ORDER BY am.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 7.2 Search for similar episodes
CREATE OR REPLACE FUNCTION match_episodes(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid,
  p_agent_type text
)
RETURNS TABLE (
  id uuid,
  subscriber_id uuid,
  situation jsonb,
  action_taken jsonb,
  outcome text,
  outcome_details jsonb,
  lessons_learned jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ae.id,
    ae.subscriber_id,
    ae.situation,
    ae.action_taken,
    ae.outcome,
    ae.outcome_details,
    ae.lessons_learned,
    1 - (ae.situation_embedding <=> query_embedding) as similarity
  FROM public.agent_episodes ae
  WHERE ae.user_id = p_user_id
    AND ae.agent_type = p_agent_type
    AND ae.situation_embedding IS NOT NULL
    AND 1 - (ae.situation_embedding <=> query_embedding) > match_threshold
  ORDER BY ae.situation_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 7.3 Memory reinforcement
CREATE OR REPLACE FUNCTION reinforce_memory(
  p_memory_id uuid,
  p_boost decimal
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.agent_memory
  SET
    importance_score = LEAST(1.0, GREATEST(0.0, importance_score + p_boost)),
    access_count = access_count + 1,
    last_accessed_at = NOW()
  WHERE id = p_memory_id;
END;
$$;

-- 7.4 Cleanup expired or low-importance memories
CREATE OR REPLACE FUNCTION cleanup_old_memories(
  p_user_id uuid,
  p_min_importance decimal DEFAULT 0.1,
  p_max_age_days integer DEFAULT 365
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.agent_memory
  WHERE user_id = p_user_id
    AND (
      -- Expired memories
      (expires_at IS NOT NULL AND expires_at < NOW())
      OR
      -- Very low importance memories never accessed for a long time
      (importance_score < p_min_importance
       AND last_accessed_at < NOW() - (p_max_age_days || ' days')::interval
       AND access_count < 3)
    );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================
-- 8. TRIGGER FOR UPDATED_AT
-- ============================================

-- Generic trigger function (create if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to agent_plans table
DROP TRIGGER IF EXISTS update_agent_plans_updated_at ON public.agent_plans;
CREATE TRIGGER update_agent_plans_updated_at
  BEFORE UPDATE ON public.agent_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUMMARY OF CREATED OBJECTS
-- ============================================
-- Tables:
--   - agent_memory (with vector index)
--   - agent_episodes (with vector index)
--   - agent_reasoning_logs
--   - agent_plans
--   - agent_feedback
--
-- Functions:
--   - match_memories(query_embedding, match_threshold, match_count, p_user_id, p_agent_type)
--   - match_episodes(query_embedding, match_threshold, match_count, p_user_id, p_agent_type)
--   - reinforce_memory(p_memory_id, p_boost)
--   - cleanup_old_memories(p_user_id, p_min_importance, p_max_age_days)
--   - update_updated_at_column() [trigger function]
--
-- Indexes:
--   - idx_agent_memory_embedding (ivfflat vector)
--   - idx_agent_memory_subscriber
--   - idx_agent_memory_user_type
--   - idx_agent_memory_type
--   - idx_agent_memory_importance
--   - idx_agent_episodes_embedding (ivfflat vector)
--   - idx_agent_episodes_user_type
--   - idx_agent_episodes_outcome
--   - idx_agent_episodes_subscriber
--   - idx_reasoning_logs_action
--   - idx_reasoning_logs_step
--   - idx_agent_plans_subscriber
--   - idx_agent_plans_status (partial)
--   - idx_agent_plans_user_type
--   - idx_agent_feedback_user
--   - idx_agent_feedback_type
--   - idx_agent_feedback_action
--
-- RLS Policies:
--   - All tables have RLS enabled
--   - Users can only access their own data
