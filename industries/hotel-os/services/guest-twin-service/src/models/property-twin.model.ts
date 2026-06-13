import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// PROPERTY TWIN DOCUMENT INTERFACE
// ============================================================================

export interface IVenue {
  venue_id: string;
  name: string;
  type: 'restaurant' | 'bar' | 'spa' | 'gym' | 'pool' | 'meeting_room';
  capacity: number;
  hours?: {
    [key: string]: { open: string; close: string } | undefined;
  };
  pos_revenue_center_id?: string;
}

export interface IPropertyTwin extends Document {
  _id: mongoose.Types.ObjectId;

  // Identity
  property_id: string;
  twin_id: string;
  brand: string;
  name: string;

  // Location
  location: {
    address: string;
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    timezone: string;
  };

  // Inventory
  inventory: {
    total_rooms: number;
    by_type: {
      standard: number;
      deluxe: number;
      suite: number;
      penthouse: number;
      accessible: number;
    };
    available_today: number;
    available_tomorrow: number;
  };

  // Venues
  venues: IVenue[];

  // Staff
  staff: {
    total_count: number;
    by_department: {
      front_desk: number;
      housekeeping: number;
      f_and_b: number;
      maintenance: number;
      management: number;
      spa: number;
      concierge: number;
    };
    on_duty_now: number;
  };

  // Services
  services: {
    check_in_24h: boolean;
    concierge_available: boolean;
    room_service_hours?: { start: string; end: string };
    housekeeping_schedule?: { start: string; end: string };
  };

  // Revenue
  revenue: {
    today_revenue: number;
    mtd_revenue: number;
    ytd_revenue: number;
    revpar: number;
    adr: number;
    occupancy_rate: number;
  };

  // Settings
  settings: {
    brand_standards_version?: string;
    upsell_config?: Record<string, any>;
    pricing_rules?: Record<string, any>;
  };

  // Metadata
  version: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// PROPERTY TWIN SCHEMA
// ============================================================================

const VenueSchema = new Schema<IVenue>({
  venue_id: { type: String, required: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['restaurant', 'bar', 'spa', 'gym', 'pool', 'meeting_room'],
    required: true,
  },
  capacity: { type: Number, default: 0 },
  hours: {
    type: Map,
    of: new Schema({
      open: { type: String },
      close: { type: String },
    }, { _id: false }),
  },
  pos_revenue_center_id: String,
}, { _id: false });

const PropertyTwinSchema = new Schema<IPropertyTwin>({
  property_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  twin_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  brand: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },

  // Location
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    timezone: { type: String, default: 'UTC' },
  },

  // Inventory
  inventory: {
    total_rooms: { type: Number, default: 0 },
    by_type: {
      standard: { type: Number, default: 0 },
      deluxe: { type: Number, default: 0 },
      suite: { type: Number, default: 0 },
      penthouse: { type: Number, default: 0 },
      accessible: { type: Number, default: 0 },
    },
    available_today: { type: Number, default: 0 },
    available_tomorrow: { type: Number, default: 0 },
  },

  // Venues
  venues: [VenueSchema],

  // Staff
  staff: {
    total_count: { type: Number, default: 0 },
    by_department: {
      front_desk: { type: Number, default: 0 },
      housekeeping: { type: Number, default: 0 },
      f_and_b: { type: Number, default: 0 },
      maintenance: { type: Number, default: 0 },
      management: { type: Number, default: 0 },
      spa: { type: Number, default: 0 },
      concierge: { type: Number, default: 0 },
    },
    on_duty_now: { type: Number, default: 0 },
  },

  // Services
  services: {
    check_in_24h: { type: Boolean, default: false },
    concierge_available: { type: Boolean, default: false },
    room_service_hours: {
      start: String,
      end: String,
    },
    housekeeping_schedule: {
      start: String,
      end: String,
    },
  },

  // Revenue
  revenue: {
    today_revenue: { type: Number, default: 0 },
    mtd_revenue: { type: Number, default: 0 },
    ytd_revenue: { type: Number, default: 0 },
    revpar: { type: Number, default: 0 },
    adr: { type: Number, default: 0 },
    occupancy_rate: { type: Number, default: 0, min: 0, max: 100 },
  },

  // Settings
  settings: {
    brand_standards_version: String,
    upsell_config: Schema.Types.Mixed,
    pricing_rules: Schema.Types.Mixed,
  },

  // Metadata
  version: { type: Number, default: 1 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Compound indexes
PropertyTwinSchema.index({ brand: 1, 'location.city': 1 });
PropertyTwinSchema.index({ 'inventory.available_today': 1 });
PropertyTwinSchema.index({ 'revenue.occupancy_rate': -1 });

// Virtual for id
PropertyTwinSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

PropertyTwinSchema.set('toJSON', { virtuals: true });
PropertyTwinSchema.set('toObject', { virtuals: true });

// ============================================================================
// MODEL EXPORT
// ============================================================================

export const PropertyTwinModel: Model<IPropertyTwin> = mongoose.model<IPropertyTwin>('PropertyTwin', PropertyTwinSchema);