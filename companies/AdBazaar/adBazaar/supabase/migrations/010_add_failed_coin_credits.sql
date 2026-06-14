-- Migration: 010_add_failed_coin_credits.sql
-- XF-1: Dead-letter queue for failed REZ coin credits
-- Catches scan events where the REZ API call failed so they can be retried automatically.

CREATE TABLE IF NOT EXISTS failed_coin_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_event_id UUID NOT NULL REFERENCES scan_events(id),
  user_id TEXT NOT NULL,
  merchant_id TEXT NOT NULL,
  coins_amount INTEGER NOT NULL,
  attempts INTEGER DEFAULT 0,
  last_attempt TIMESTAMPTZ,
  next_retry TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'retrying', 'manual_review', 'resolved')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial index on rows eligible for retry: pending or retrying, and next_retry is due
CREATE INDEX IF NOT EXISTS idx_failed_coin_credits_status_next_retry
  ON failed_coin_credits (status, next_retry)
  WHERE status IN ('pending', 'retrying');
