// Twin Types for Upsell Engine

export interface GuestProfile {
  name: string;
  email: string;
  phone: string;
  nationality: string;
  language_preference: string;
  accessibility_needs: string[];
}

export interface GuestLoyalty {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points_balance: number;
  member_since: string;
  total_stays: number;
  total_spend: number;
}

export interface RoomPreferences {
  floor_preference: string;
  view_preference: string;
  bed_configuration: string;
  temperature_setting: { default: number; range: { min: number; max: number } };
  lighting_preference: string;
  noise_tolerance: number;
}

export interface DiningPreferences {
  dietary_restrictions: string[];
  allergies: string[];
  favorite_items: string[];
  beverage_preferences: string[];
  typical_spend_range: { min: number; max: number };
}

export interface AmenityPreferences {
  spa_interests: string[];
  fitness_habits: boolean;
  pool_usage: boolean;
  business_amenities: string[];
}

export interface CommunicationPreferences {
  preferred_channel: 'email' | 'sms' | 'app_push' | 'whatsapp';
  opt_ins: string[];
  quiet_hours: { start: string; end: string };
}

export interface GuestPreferences {
  room: RoomPreferences;
  dining: DiningPreferences;
  amenities: AmenityPreferences;
  communication: CommunicationPreferences;
}

export interface StayPatterns {
  typical_check_in_time: string;
  typical_check_out_time: string;
  weekend_vs_weekday: 'weekend' | 'weekday' | 'mixed';
  seasonal_patterns: string[];
  booking_lead_time: number;
}

export interface GuestSentiment {
  current_score: number;
  trend: 'improving' | 'stable' | 'declining';
  last_feedback_date: string;
  key_topics: string[];
}

export interface LifetimeValue {
  clv: number;
  potential_clv: number;
  churn_risk: 'low' | 'medium' | 'high';
  recommendation_eligibility: boolean;
}

export interface CurrentStay {
  room_id: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  rate_code: string;
  special_requests: string[];
  occasion: string | null;
}

export interface GuestTwin {
  guest_id: string;
  property_id: string;
  profile: GuestProfile;
  loyalty: GuestLoyalty;
  preferences: GuestPreferences;
  stay_patterns: StayPatterns;
  sentiment: GuestSentiment;
  lifetime_value: LifetimeValue;
  current_stay: CurrentStay | null;
  price_sensitivity: number;
  upgrade_history: UpgradeHistory[];
  created_at: string;
  updated_at: string;
}

export interface UpgradeHistory {
  room_type: string;
  upgrade_date: string;
  accepted: boolean;
  discount_applied?: number;
}

export interface RoomStatus {
  current: 'available' | 'occupied' | 'blocked' | 'out_of_order' | 'cleaning' | 'inspected';
  next_available: string;
  maintenance_alerts: string[];
}

export interface RoomIoTState {
  thermostat: { current: number; target: number; mode: string };
  lighting: { scene: string; brightness: number };
  blinds: 'open' | 'closed' | 'partial';
  door_lock: 'locked' | 'unlocked';
  minibar_door: 'closed' | 'open';
  occupancy_sensor: boolean;
}

export interface RoomRevenue {
  base_rate: number;
  rack_rate: number;
  minibar_balance: number;
  last_rate_update: string;
}

export interface RoomTwin {
  room_id: string;
  property_id: string;
  room_number: string;
  room_type: 'standard' | 'deluxe' | 'suite' | 'penthouse' | 'accessible';
  floor: number;
  view: 'city' | 'pool' | 'garden' | 'ocean' | 'mountain';
  capacity: { max_adults: number; max_children: number; max_occupancy: number };
  bed_configuration: { bed_count: number; bed_type: 'king' | 'queen' | 'twin' | 'bunk'; rollaway_available: boolean };
  amenities: {
    smart_tv: boolean;
    smart_speaker: boolean;
    minibar: boolean;
    coffee_machine: boolean;
    safe: boolean;
    balcony: boolean;
    jacuzzi: boolean;
  };
  status: RoomStatus;
  iot_state: RoomIoTState;
  revenue: RoomRevenue;
  created_at: string;
  updated_at: string;
}

export interface Venue {
  venue_id: string;
  name: string;
  type: 'restaurant' | 'bar' | 'spa' | 'gym' | 'pool' | 'meeting_room';
  capacity: number;
  hours: { [day: string]: { open: string; close: string } };
  pos_revenue_center_id: string;
}

export interface PropertyRevenue {
  today_revenue: number;
  mtd_revenue: number;
  ytd_revenue: number;
  revpar: number;
  adr: number;
  occupancy_rate: number;
}

export interface UpsellConfig {
  max_upgrade_discount: number;
  min_offer_interval_hours: number;
  preferred_offer_times: string[];
  excluded_rate_codes: string[];
  upgrade_thresholds: { occupancy: number; min_rate: number };
}

export interface PricingRules {
  dynamic_pricing_enabled: boolean;
  surge_multiplier_max: number;
  weekend_premium: number;
  seasonal_adjustments: { season: string; multiplier: number }[];
}

export interface PropertyTwin {
  property_id: string;
  brand: string;
  name: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates: { lat: number; lng: number };
    timezone: string;
  };
  inventory: {
    total_rooms: number;
    by_type: { [roomType: string]: number };
    available_today: number;
    available_tomorrow: number;
  };
  venues: Venue[];
  revenue: PropertyRevenue;
  settings: {
    brand_standards_version: string;
    upsell_config: UpsellConfig;
    pricing_rules: PricingRules;
  };
  created_at: string;
  updated_at: string;
}

export interface UpsellOffer {
  offer_id: string;
  guest_id: string;
  room_id: string;
  offer_type: 'upgrade' | 'package' | 'addon' | 'early_checkin' | 'late_checkout';
  title: string;
  description: string;
  original_price: number;
  offer_price: number;
  discount_percentage: number;
  savings: number;
  target_room_type?: string;
  addons?: string[];
  valid_until: string;
  status: 'pending' | 'shown' | 'accepted' | 'declined' | 'expired';
  shown_at?: string;
  responded_at?: string;
  conversion_probability?: number;
  revenue_impact?: number;
  created_at: string;
}

export interface PricingDecision {
  decision_id: string;
  room_id: string;
  room_type: string;
  base_rate: number;
  calculated_rate: number;
  final_rate: number;
  factors: {
    occupancy: number;
    demand_multiplier: number;
    season: string;
    day_of_week: string;
    special_event: boolean;
    guest_loyalty_adjustment: number;
    competitive_adjustment: number;
  };
  confidence: number;
  expires_at: string;
  created_at: string;
}

export interface RevenueMetrics {
  property_id: string;
  date: string;
  total_upsell_revenue: number;
  upgrade_revenue: number;
  package_revenue: number;
  addon_revenue: number;
  conversion_rate: number;
  average_order_value: number;
  offers_presented: number;
  offers_accepted: number;
  revpar: number;
  adr: number;
}
