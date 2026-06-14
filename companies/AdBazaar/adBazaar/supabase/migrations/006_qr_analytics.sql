-- QR Analytics: per-creative labels, device type, city from IP

-- Allow each QR code to have a label (e.g. "MG Road Billboard – Creative A")
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS qr_label TEXT DEFAULT 'QR Code';
-- Which poster/image index this QR belongs to (1-based)
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS poster_index INTEGER DEFAULT 1;
-- Optional creative image snapshot for reference
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS creative_image_url TEXT;

-- Enrich scan events with derived data at capture time
ALTER TABLE scan_events ADD COLUMN IF NOT EXISTS device_type TEXT; -- 'mobile' | 'desktop' | 'tablet' | 'unknown'
ALTER TABLE scan_events ADD COLUMN IF NOT EXISTS city_derived TEXT;
ALTER TABLE scan_events ADD COLUMN IF NOT EXISTS country_derived TEXT;
ALTER TABLE scan_events ADD COLUMN IF NOT EXISTS referrer TEXT;

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_qr_codes_booking ON qr_codes(booking_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_campaign ON qr_codes(campaign_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_brand ON qr_codes(brand_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_device ON scan_events(device_type);
CREATE INDEX IF NOT EXISTS idx_scan_events_city ON scan_events(city_derived);
CREATE INDEX IF NOT EXISTS idx_scan_events_date ON scan_events(timestamp);
