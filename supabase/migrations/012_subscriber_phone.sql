-- Migration: Add phone to subscriber for WhatsApp agent communication

-- Add phone column to subscriber
ALTER TABLE public.subscriber ADD COLUMN IF NOT EXISTS phone TEXT;

-- Index for phone lookups
CREATE INDEX IF NOT EXISTS idx_subscriber_phone ON public.subscriber(phone) WHERE phone IS NOT NULL;
