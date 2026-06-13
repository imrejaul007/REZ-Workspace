import mongoose, { Schema, Document } from 'mongoose';

// ============================================================================
// Guest Twin Model
// ============================================================================

export interface IGuestTwin extends Document {
  guest_id: string;
  twin_id: string;
  profile: {
    name: string;
    email: string;
    phone?: string;
    nationality?: string;
    language_preference: string;
    accessibility_needs: string[];
  };
  loyalty?: {
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    points_balance: number;
    member_since?: string;
    total_stays: number;
    total_spend: number;
  };
  preferences?: {
    room: {
      floor_preference?: string;
      view_preference?: string;
      bed_configuration?: string;
      temperature_setting?: { default: number; range?: { min: number; max: number } };
      lighting_preference?: string;
      noise_tolerance?: number;
    };
    dining: {
      dietary_restrictions: string[];
      allergies: string[];
      favorite_items: string[];
      beverage_preferences: string[];
      typical_spend_range?: { min: number; max: number };
    };
    amenities: {
      spa_interests: string[];
      fitness_habits: boolean;
      pool_usage: boolean;
      business_amenities: string[];
    };
    communication: {
      preferred_channel: 'email' | 'sms' | 'app_push' | 'whatsapp';
      opt_ins: string[];
      quiet_hours?: { start: string; end: string };
    };
  };
  stay_patterns?: {
    typical_check_in_time?: string;
    typical_check_out_time?: string;
    weekend_vs_weekday?: 'weekend' | 'weekday' | 'mixed';
    seasonal_patterns: string[];
    booking_lead_time?: number;
  };
  sentiment?: {
    current_score: number;
    trend: 'improving' | 'stable' | 'declining';
    last_feedback_date?: string;
    key_topics: string[];
  };
  lifetime_value?: {
    clv: number;
    potential_clv: number;
    churn_risk: 'low' | 'medium' | 'high';
    recommendation_eligibility: boolean;
  };
  current_stay?: {
    room_id: string;
    check_in: string;
    check_out: string;
    adults: number;
    children: number;
    rate_code?: string;
    special_requests: string[];
    occasion?: string | null;
  };
  preferred_property_id?: string;
  created_at: Date;
  updated_at: Date;
}

const GuestTwinProfileSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  nationality: { type: String },
  language_preference: { type: String, default: 'en' },
  accessibility_needs: [{ type: String }],
}, { _id: false });

const GuestTwinLoyaltySchema = new Schema({
  tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'] },
  points_balance: { type: Number, default: 0 },
  member_since: { type: String },
  total_stays: { type: Number, default: 0 },
  total_spend: { type: Number, default: 0 },
}, { _id: false });

const GuestTwinPreferencesSchema = new Schema({
  room: {
    floor_preference: { type: String },
    view_preference: { type: String },
    bed_configuration: { type: String },
    temperature_setting: {
      default: { type: Number },
      range: {
        min: { type: Number },
        max: { type: Number },
      },
    },
    lighting_preference: { type: String },
    noise_tolerance: { type: Number, min: 1, max: 10 },
  },
  dining: {
    dietary_restrictions: [{ type: String }],
    allergies: [{ type: String }],
    favorite_items: [{ type: String }],
    beverage_preferences: [{ type: String }],
    typical_spend_range: {
      min: { type: Number },
      max: { type: Number },
    },
  },
  amenities: {
    spa_interests: [{ type: String }],
    fitness_habits: { type: Boolean, default: false },
    pool_usage: { type: Boolean, default: false },
    business_amenities: [{ type: String }],
  },
  communication: {
    preferred_channel: { type: String, enum: ['email', 'sms', 'app_push', 'whatsapp'], default: 'email' },
    opt_ins: [{ type: String }],
    quiet_hours: {
      start: { type: String },
      end: { type: String },
    },
  },
}, { _id: false });

const GuestTwinStayPatternsSchema = new Schema({
  typical_check_in_time: { type: String },
  typical_check_out_time: { type: String },
  weekend_vs_weekday: { type: String, enum: ['weekend', 'weekday', 'mixed'] },
  seasonal_patterns: [{ type: String }],
  booking_lead_time: { type: Number },
}, { _id: false });

const GuestTwinSentimentSchema = new Schema({
  current_score: { type: Number, min: 0, max: 100, default: 50 },
  trend: { type: String, enum: ['improving', 'stable', 'declining'], default: 'stable' },
  last_feedback_date: { type: String },
  key_topics: [{ type: String }],
}, { _id: false });

const GuestTwinLifetimeValueSchema = new Schema({
  clv: { type: Number, default: 0 },
  potential_clv: { type: Number, default: 0 },
  churn_risk: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  recommendation_eligibility: { type: Boolean, default: true },
}, { _id: false });

const GuestTwinCurrentStaySchema = new Schema({
  room_id: { type: String },
  check_in: { type: String },
  check_out: { type: String },
  adults: { type: Number, default: 1 },
  children: { type: Number, default: 0 },
  rate_code: { type: String },
  special_requests: [{ type: String }],
  occasion: { type: String },
}, { _id: false });

const GuestTwinSchema = new Schema({
  guest_id: { type: String, required: true, unique: true, index: true },
  twin_id: { type: String, required: true, unique: true },
  profile: { type: GuestTwinProfileSchema, required: true },
  loyalty: { type: GuestTwinLoyaltySchema },
  preferences: { type: GuestTwinPreferencesSchema },
  stay_patterns: { type: GuestTwinStayPatternsSchema },
  sentiment: { type: GuestTwinSentimentSchema },
  lifetime_value: { type: GuestTwinLifetimeValueSchema },
  current_stay: { type: GuestTwinCurrentStaySchema },
  preferred_property_id: { type: String, index: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

export const GuestTwinModel = mongoose.model<IGuestTwin>('GuestTwin', GuestTwinSchema);

// ============================================================================
// Room Twin Model
// ============================================================================

export interface IRoomTwin extends Document {
  room_id: string;
  twin_id: string;
  property_id: string;
  room_number: string;
  room_type: 'standard' | 'deluxe' | 'suite' | 'penthouse' | 'accessible';
  floor: number;
  view: 'city' | 'pool' | 'garden' | 'ocean' | 'mountain';
  capacity: {
    max_adults: number;
    max_children: number;
    max_occupancy: number;
  };
  bed_configuration: {
    bed_count: number;
    bed_type: 'king' | 'queen' | 'twin' | 'bunk';
    rollaway_available: boolean;
  };
  amenities: {
    smart_tv: boolean;
    smart_speaker: boolean;
    minibar: boolean;
    coffee_machine: boolean;
    safe: boolean;
    balcony: boolean;
    jacuzzi: boolean;
  };
  status: {
    current: 'available' | 'occupied' | 'blocked' | 'out_of_order' | 'cleaning' | 'inspected';
    next_available?: string;
    maintenance_alerts: string[];
  };
  iot_state?: {
    thermostat?: { current: number; target: number; mode: string };
    lighting?: { scene: string; brightness: number };
    blinds?: 'open' | 'closed' | 'partial';
    door_lock?: 'locked' | 'unlocked';
    minibar_door?: 'closed' | 'open';
    occupancy_sensor?: boolean;
  };
  housekeeping: {
    last_cleaned?: string;
    next_scheduled?: string;
    frequency: 'daily' | 'weekly' | 'on_departure';
    supply_status: 'adequate' | 'low' | 'critical';
  };
  revenue: {
    base_rate: number;
    rack_rate: number;
    minibar_balance: number;
    last_rate_update?: string;
  };
  created_at: Date;
  updated_at: Date;
}

const RoomTwinSchema = new Schema({
  room_id: { type: String, required: true, unique: true, index: true },
  twin_id: { type: String, required: true, unique: true },
  property_id: { type: String, required: true, index: true },
  room_number: { type: String, required: true },
  room_type: { type: String, enum: ['standard', 'deluxe', 'suite', 'penthouse', 'accessible'], required: true },
  floor: { type: Number, required: true },
  view: { type: String, enum: ['city', 'pool', 'garden', 'ocean', 'mountain'], required: true },
  capacity: {
    max_adults: { type: Number, default: 2 },
    max_children: { type: Number, default: 0 },
    max_occupancy: { type: Number, default: 2 },
  },
  bed_configuration: {
    bed_count: { type: Number, default: 1 },
    bed_type: { type: String, enum: ['king', 'queen', 'twin', 'bunk'] },
    rollaway_available: { type: Boolean, default: false },
  },
  amenities: {
    smart_tv: { type: Boolean, default: false },
    smart_speaker: { type: Boolean, default: false },
    minibar: { type: Boolean, default: false },
    coffee_machine: { type: Boolean, default: false },
    safe: { type: Boolean, default: false },
    balcony: { type: Boolean, default: false },
    jacuzzi: { type: Boolean, default: false },
  },
  status: {
    current: { type: String, enum: ['available', 'occupied', 'blocked', 'out_of_order', 'cleaning', 'inspected'], required: true },
    next_available: { type: String },
    maintenance_alerts: [{ type: String }],
  },
  iot_state: {
    thermostat: {
      current: { type: Number },
      target: { type: Number },
      mode: { type: String },
    },
    lighting: {
      scene: { type: String },
      brightness: { type: Number },
    },
    blinds: { type: String, enum: ['open', 'closed', 'partial'] },
    door_lock: { type: String, enum: ['locked', 'unlocked'] },
    minibar_door: { type: String, enum: ['closed', 'open'] },
    occupancy_sensor: { type: Boolean },
  },
  housekeeping: {
    last_cleaned: { type: String },
    next_scheduled: { type: String },
    frequency: { type: String, enum: ['daily', 'weekly', 'on_departure'], default: 'daily' },
    supply_status: { type: String, enum: ['adequate', 'low', 'critical'], default: 'adequate' },
  },
  revenue: {
    base_rate: { type: Number, required: true },
    rack_rate: { type: Number, required: true },
    minibar_balance: { type: Number, default: 0 },
    last_rate_update: { type: String },
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

export const RoomTwinModel = mongoose.model<IRoomTwin>('RoomTwin', RoomTwinSchema);

// ============================================================================
// Property Twin Model
// ============================================================================

export interface IPropertyTwin extends Document {
  property_id: string;
  twin_id: string;
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
    by_type: Record<string, number>;
    available_today: number;
    available_tomorrow: number;
  };
  venues: Array<{
    venue_id: string;
    name: string;
    type: 'restaurant' | 'bar' | 'spa' | 'gym' | 'pool' | 'meeting_room';
    capacity: number;
    hours: Record<string, string>;
    pos_revenue_center_id?: string;
  }>;
  staff: {
    total_count: number;
    by_department: Record<string, number>;
    on_duty_now: number;
  };
  services: {
    check_in_24h: boolean;
    concierge_available: boolean;
    room_service_hours?: { start: string; end: string };
    housekeeping_schedule?: { start: string; end: string };
  };
  revenue: {
    today_revenue: number;
    mtd_revenue: number;
    ytd_revenue: number;
    revpar?: number;
    adr?: number;
    occupancy_rate?: number;
  };
  settings: {
    brand_standards_version?: string;
    upsell_config?: Record<string, unknown>;
    pricing_rules?: Record<string, unknown>;
  };
  created_at: Date;
  updated_at: Date;
}

const PropertyTwinSchema = new Schema({
  property_id: { type: String, required: true, unique: true, index: true },
  twin_id: { type: String, required: true, unique: true },
  brand: { type: String, required: true },
  name: { type: String, required: true },
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    timezone: { type: String, required: true },
  },
  inventory: {
    total_rooms: { type: Number, default: 0 },
    by_type: { type: Map, of: Number },
    available_today: { type: Number, default: 0 },
    available_tomorrow: { type: Number, default: 0 },
  },
  venues: [{
    venue_id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['restaurant', 'bar', 'spa', 'gym', 'pool', 'meeting_room'], required: true },
    capacity: { type: Number, required: true },
    hours: { type: Map, of: String },
    pos_revenue_center_id: { type: String },
  }],
  staff: {
    total_count: { type: Number, default: 0 },
    by_department: { type: Map, of: Number },
    on_duty_now: { type: Number, default: 0 },
  },
  services: {
    check_in_24h: { type: Boolean, default: false },
    concierge_available: { type: Boolean, default: false },
    room_service_hours: {
      start: { type: String },
      end: { type: String },
    },
    housekeeping_schedule: {
      start: { type: String },
      end: { type: String },
    },
  },
  revenue: {
    today_revenue: { type: Number, default: 0 },
    mtd_revenue: { type: Number, default: 0 },
    ytd_revenue: { type: Number, default: 0 },
    revpar: { type: Number },
    adr: { type: Number },
    occupancy_rate: { type: Number },
  },
  settings: {
    brand_standards_version: { type: String },
    upsell_config: { type: Map, of: Object },
    pricing_rules: { type: Map, of: Object },
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

export const PropertyTwinModel = mongoose.model<IPropertyTwin>('PropertyTwin', PropertyTwinSchema);

// ============================================================================
// Housekeeping Models
// ============================================================================

export interface IHousekeeper extends Document {
  staff_id: string;
  name: string;
  property_id: string;
  department: 'housekeeping';
  level: 'junior' | 'senior' | 'lead' | 'manager';
  certifications: string[];
  languages: string[];
  max_rooms_per_shift: number;
  efficiency_rating: number;
  created_at: Date;
  updated_at: Date;
}

const HousekeeperSchema = new Schema({
  staff_id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  property_id: { type: String, required: true, index: true },
  department: { type: String, enum: ['housekeeping'], required: true },
  level: { type: String, enum: ['junior', 'senior', 'lead', 'manager'], required: true },
  certifications: [{ type: String }],
  languages: [{ type: String }],
  max_rooms_per_shift: { type: Number, default: 15 },
  efficiency_rating: { type: Number, min: 0, max: 100, default: 80 },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

export const HousekeeperModel = mongoose.model<IHousekeeper>('Housekeeper', HousekeeperSchema);

export interface ICleaningTask extends Document {
  task_id: string;
  room_id: string;
  room_number: string;
  room_type: 'standard' | 'deluxe' | 'suite' | 'penthouse' | 'accessible';
  priority: 'high' | 'medium' | 'low';
  task_type: 'checkout' | 'turndown' | 'daily' | 'deep_clean' | 'maintenance';
  estimated_duration_minutes: number;
  special_requirements: string[];
  assigned_to?: string;
  scheduled_time?: string;
  completed_at?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

const CleaningTaskSchema = new Schema({
  task_id: { type: String, required: true, unique: true, index: true },
  room_id: { type: String, required: true, index: true },
  room_number: { type: String, required: true },
  room_type: { type: String, enum: ['standard', 'deluxe', 'suite', 'penthouse', 'accessible'], required: true },
  priority: { type: String, enum: ['high', 'medium', 'low'], required: true },
  task_type: { type: String, enum: ['checkout', 'turndown', 'daily', 'deep_clean', 'maintenance'], required: true },
  estimated_duration_minutes: { type: Number, default: 25 },
  special_requirements: [{ type: String }],
  assigned_to: { type: String, index: true },
  scheduled_time: { type: String },
  completed_at: { type: String },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

export const CleaningTaskModel = mongoose.model<ICleaningTask>('CleaningTask', CleaningTaskSchema);

export interface ISchedule extends Document {
  schedule_id: string;
  property_id: string;
  date: string;
  shift_start: string;
  shift_end: string;
  assignments: Array<{
    task_id: string;
    housekeeper_id: string;
    start_time: string;
    end_time: string;
  }>;
  unassigned_task_ids: string[];
  total_tasks: number;
  completed_tasks: number;
  efficiency_score: number;
  generated_at: Date;
  created_at: Date;
  updated_at: Date;
}

const ScheduleAssignmentSchema = new Schema({
  task_id: { type: String, required: true },
  housekeeper_id: { type: String, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
}, { _id: false });

const ScheduleSchema = new Schema({
  schedule_id: { type: String, required: true, unique: true, index: true },
  property_id: { type: String, required: true, index: true },
  date: { type: String, required: true, index: true },
  shift_start: { type: String, required: true },
  shift_end: { type: String, required: true },
  assignments: [ScheduleAssignmentSchema],
  unassigned_task_ids: [{ type: String }],
  total_tasks: { type: Number, default: 0 },
  completed_tasks: { type: Number, default: 0 },
  efficiency_score: { type: Number, min: 0, max: 100, default: 0 },
  generated_at: { type: Date, required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

export const ScheduleModel = mongoose.model<ISchedule>('Schedule', ScheduleSchema);
