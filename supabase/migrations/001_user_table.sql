-- Create user table for storing user profiles with Stripe connection info
CREATE TABLE IF NOT EXISTS public.user (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Stripe Connect fields
  stripeaccountid TEXT,
  stripeaccesstoken TEXT,
  stripeconnectedat TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.user ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/modify their own data
CREATE POLICY "Users can view own profile"
  ON public.user FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_stripeaccountid ON public.user(stripeaccountid);
