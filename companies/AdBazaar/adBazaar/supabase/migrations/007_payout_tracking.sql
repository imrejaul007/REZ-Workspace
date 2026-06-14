-- Payout tracking on bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payout_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payout_initiated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bookings_payout ON bookings(payout_id) WHERE payout_id IS NOT NULL;
