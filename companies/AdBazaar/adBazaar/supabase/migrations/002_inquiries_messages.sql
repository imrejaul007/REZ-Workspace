-- Migration 002: inquiries and messages tables

CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id),
  vendor_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  budget DECIMAL(12,2),
  start_date DATE,
  end_date DATE,
  requirements TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','quoted','accepted','declined','expired')),
  -- quote fields (filled by vendor)
  quote_amount DECIMAL(12,2),
  quote_message TEXT,
  quote_valid_until TIMESTAMPTZ,
  -- outcome
  booking_id UUID REFERENCES bookings(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  sender_role TEXT NOT NULL CHECK (sender_role IN ('buyer', 'vendor')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_inquiries_buyer ON inquiries(buyer_id);
CREATE INDEX idx_inquiries_vendor ON inquiries(vendor_id);
CREATE INDEX idx_inquiries_listing ON inquiries(listing_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_messages_booking ON messages(booking_id);
CREATE INDEX idx_messages_created ON messages(booking_id, created_at);

-- RLS
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Inquiries: buyer sees their own; vendor sees inquiries for their listings
CREATE POLICY "buyers_own_inquiries" ON inquiries
  FOR ALL USING (buyer_id = auth.uid());

CREATE POLICY "vendors_own_inquiries" ON inquiries
  FOR ALL USING (vendor_id = auth.uid());

-- Messages: only booking participants
CREATE POLICY "booking_participants_messages" ON messages
  FOR ALL USING (
    booking_id IN (
      SELECT id FROM bookings
      WHERE buyer_id = auth.uid() OR vendor_id = auth.uid()
    )
  );
