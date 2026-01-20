-- =============================================
-- RLS POLICIES FOR USER TABLE
-- =============================================

-- Enable RLS on user table if not already enabled
ALTER TABLE public.user ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON public.user;
DROP POLICY IF EXISTS "Users can update own data" ON public.user;
DROP POLICY IF EXISTS "Users can insert own data" ON public.user;

-- Users can view their own row
CREATE POLICY "Users can view own data"
  ON public.user FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own row
CREATE POLICY "Users can update own data"
  ON public.user FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own row (for initial profile creation)
CREATE POLICY "Users can insert own data"
  ON public.user FOR INSERT
  WITH CHECK (auth.uid() = id);
