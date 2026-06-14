-- Migration 003: add missing columns

-- rejection_reason on listings (written by admin review route)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
