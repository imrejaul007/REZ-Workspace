-- Loyalty Visits
CREATE TABLE IF NOT EXISTS loyalty_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_id UUID NOT NULL,
  visit_type VARCHAR(50) DEFAULT 'dine_in',
  visit_date TIMESTAMP DEFAULT NOW(),
  coins_earned INTEGER DEFAULT 0,
  karma_level VARCHAR(20),
  loyalty_tier VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_loyalty_visits_user ON loyalty_visits(user_id);
CREATE INDEX idx_loyalty_visits_store ON loyalty_visits(store_id);

-- Loyalty Streaks
CREATE TABLE IF NOT EXISTS loyalty_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  streak_type VARCHAR(20) NOT NULL,
  current INTEGER DEFAULT 0,
  longest INTEGER DEFAULT 0,
  last_activity TIMESTAMP,
  streak_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_loyalty_streaks_user ON loyalty_streaks(user_id);

-- Loyalty Milestones
CREATE TABLE IF NOT EXISTS loyalty_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  milestone_type VARCHAR(20) NOT NULL,
  milestone_id VARCHAR(50) NOT NULL,
  target INTEGER NOT NULL,
  current INTEGER DEFAULT 0,
  reached BOOLEAN DEFAULT FALSE,
  reached_at TIMESTAMP,
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, milestone_id)
);

CREATE INDEX idx_loyalty_milestones_user ON loyalty_milestones(user_id);

-- Loyalty Badges
CREATE TABLE IF NOT EXISTS loyalty_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id VARCHAR(50) NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  rarity VARCHAR(20) DEFAULT 'common',
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_loyalty_badges_user ON loyalty_badges(user_id);

-- Group Sessions
CREATE TABLE IF NOT EXISTS group_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code VARCHAR(6) UNIQUE NOT NULL,
  store_id UUID NOT NULL,
  host_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_group_sessions_code ON group_sessions(session_code);
CREATE INDEX idx_group_sessions_store ON group_sessions(store_id);

-- Group Members
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES group_sessions(id),
  user_id UUID NOT NULL,
  user_name VARCHAR(100),
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP
);

-- Group Items
CREATE TABLE IF NOT EXISTS group_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES group_sessions(id),
  user_id UUID NOT NULL,
  item_id UUID NOT NULL,
  item_name VARCHAR(200),
  price DECIMAL(10,2),
  quantity INTEGER DEFAULT 1,
  added_at TIMESTAMP DEFAULT NOW()
);

-- KDS Orders
CREATE TABLE IF NOT EXISTS kds_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  store_id UUID NOT NULL,
  table_number VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  estimated_ready_at TIMESTAMP
);

CREATE INDEX idx_kds_orders_store ON kds_orders(store_id);
CREATE INDEX idx_kds_orders_status ON kds_orders(status);

-- KDS Order Items
CREATE TABLE IF NOT EXISTS kds_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kds_order_id UUID REFERENCES kds_orders(id),
  item_id UUID NOT NULL,
  item_name VARCHAR(200),
  quantity INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending',
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Room Bundles
CREATE TABLE IF NOT EXISTS room_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL,
  bundle_name VARCHAR(100) NOT NULL,
  bundle_type VARCHAR(50) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pre-Arrival Preferences
CREATE TABLE IF NOT EXISTS pre_arrival_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  guest_id UUID NOT NULL,
  temperature INTEGER DEFAULT 24,
  lighting VARCHAR(20) DEFAULT 'medium',
  pillow_type VARCHAR(20) DEFAULT 'medium',
  dietary_restrictions JSONB DEFAULT '[]',
  allergies JSONB DEFAULT '[]',
  special_occasion VARCHAR(100),
  early_checkin BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pre_arrival_booking ON pre_arrival_prefs(booking_id);
