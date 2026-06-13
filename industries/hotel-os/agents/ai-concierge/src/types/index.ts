/**
 * AI Concierge Agent - Hotel OS
 * Twin type definitions for Guest, Room, and Property twins
 */

// Guest Twin Types
export interface GuestProfile {
  name: string;
  email: string;
  phone: string;
  nationality?: string;
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
  floor_preference?: string;
  view_preference?: string;
  bed_configuration?: string;
  temperature_setting?: { default: number; range: { min: number; max: number } };
  lighting_preference?: string;
  noise_tolerance?: number;
}

export interface DiningPreferences {
  dietary_restrictions: string[];
  allergies: string[];
  favorite_items: string[];
  beverage_preferences: string[];
  typical_spend_range?: { min: number; max: number };
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
  quiet_hours?: { start: string; end: string };
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
  occasion?: string;
}

export interface GuestTwin {
  twin_id: string;
  guest_id: string;
  profile: GuestProfile;
  loyalty: GuestLoyalty;
  preferences: GuestPreferences;
  stay_patterns: StayPatterns;
  sentiment: GuestSentiment;
  lifetime_value: LifetimeValue;
  current_stay?: CurrentStay;
  created_at: string;
  updated_at: string;
  version: number;
}

// Room Twin Types
export interface RoomCapacity {
  max_adults: number;
  max_children: number;
  max_occupancy: number;
}

export interface BedConfiguration {
  bed_count: number;
  bed_type: 'king' | 'queen' | 'twin' | 'bunk';
  rollaway_available: boolean;
}

export interface RoomAmenities {
  smart_tv: boolean;
  smart_speaker: boolean;
  minibar: boolean;
  coffee_machine: boolean;
  safe: boolean;
  balcony: boolean;
  jacuzzi: boolean;
}

export type RoomStatus = 'available' | 'occupied' | 'blocked' | 'out_of_order' | 'cleaning' | 'inspected';

export interface IoTState {
  thermostat: { current: number; target: number; mode: string };
  lighting: { scene: string; brightness: number };
  blinds: 'open' | 'closed' | 'partial';
  door_lock: 'locked' | 'unlocked';
  minibar_door: 'closed' | 'open';
  occupancy_sensor: boolean;
}

export interface HousekeepingStatus {
  last_cleaned: string;
  next_scheduled: string;
  frequency: 'daily' | 'weekly' | 'on_departure';
  supply_status: 'adequate' | 'low' | 'critical';
}

export interface RoomRevenue {
  base_rate: number;
  rack_rate: number;
  minibar_balance: number;
  last_rate_update: string;
}

export interface RoomStatusInfo {
  current: RoomStatus;
  next_available?: string;
  maintenance_alerts: string[];
}

export interface RoomTwin {
  twin_id: string;
  room_id: string;
  property_id: string;
  room_number: string;
  room_type: 'standard' | 'deluxe' | 'suite' | 'penthouse' | 'accessible';
  floor: number;
  view: 'city' | 'pool' | 'garden' | 'ocean' | 'mountain';
  capacity: RoomCapacity;
  bed_configuration: BedConfiguration;
  amenities: RoomAmenities;
  status: RoomStatusInfo;
  iot_state: IoTState;
  housekeeping: HousekeepingStatus;
  revenue: RoomRevenue;
  created_at: string;
  updated_at: string;
  version: number;
}

// Property Twin Types
export interface VenueLocation {
  lat: number;
  lng: number;
}

export interface VenueHours {
  [day: string]: { open: string; close: string } | null;
}

export interface Venue {
  venue_id: string;
  name: string;
  type: 'restaurant' | 'bar' | 'spa' | 'gym' | 'pool' | 'meeting_room';
  capacity: number;
  hours: VenueHours;
  pos_revenue_center_id?: string;
}

export interface StaffSummary {
  total_count: number;
  by_department: { [key: string]: number };
  on_duty_now: number;
}

export interface PropertyServices {
  check_in_24h: boolean;
  concierge_available: boolean;
  room_service_hours: { start: string; end: string };
  housekeeping_schedule: { start: string; end: string };
}

export interface PropertyRevenue {
  today_revenue: number;
  mtd_revenue: number;
  ytd_revenue: number;
  revpar: number;
  adr: number;
  occupancy_rate: number;
}

export interface PropertySettings {
  brand_standards_version: string;
  upsell_config: { [key: string]: unknown };
  pricing_rules: { [key: string]: unknown };
}

export interface PropertyTwin {
  twin_id: string;
  property_id: string;
  brand: string;
  name: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates: VenueLocation;
    timezone: string;
  };
  inventory: {
    total_rooms: number;
    by_type: { [key: string]: number };
    available_today: number;
    available_tomorrow: number;
  };
  venues: Venue[];
  staff: StaffSummary;
  services: PropertyServices;
  revenue: PropertyRevenue;
  settings: PropertySettings;
  created_at: string;
  updated_at: string;
  version: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    request_id: string;
    version: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: PaginationMeta;
}

// Service Request Types
export interface ServiceRequest {
  request_id: string;
  guest_id: string;
  room_id: string;
  type: 'room_service' | 'concierge' | 'housekeeping' | 'maintenance' | 'dining' | 'spa' | 'transport';
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  completed_at?: string;
  assigned_to?: string;
  notes?: string;
}

// Conversation Types
export interface ConversationMessage {
  message_id: string;
  guest_id: string;
  content: string;
  language: string;
  intent?: string;
  entities?: { [key: string]: unknown };
  timestamp: string;
  channel: 'app' | 'voice' | 'sms' | 'whatsapp' | 'web';
}

export interface ConversationContext {
  guest_id: string;
  room_id?: string;
  property_id: string;
  preferences?: Partial<GuestPreferences>;
  recent_requests: string[];
  conversation_history: ConversationMessage[];
}
