-- Phase 3: Payout fields on users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_ifsc TEXT,
  ADD COLUMN IF NOT EXISTS upi_id TEXT;
