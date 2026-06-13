import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// DRIVER TWIN DOCUMENT INTERFACE
// ============================================================================

export interface IDriverTwin extends Document {
  _id: mongoose.Types.ObjectId;

  // Identity
  driver_id: string;
  twin_id: string;
  fleet_id?: string;

  // Profile
  profile: {
    name: {
      first: string;
      last: string;
    };
    email: string;
    phone: string;
    photo_url?: string;
    date_of_birth?: string;
    language: string;
  };

  // Licensing
  licensing: {
    license_number: string;
    license_type: 'standard' | 'commercial' | 'professional' | 'motorcycle' | 'bus';
    license_expiry: string;
    license_images: string[];
    background_check: {
      status: 'clear' | 'pending' | 'failed';
      completed_at?: Date;
    };
  };

  // Status
  status: {
    current: 'online' | 'busy' | 'offline' | 'break' | 'suspended';
    location?: {
      lat: number;
      lng: number;
      updated_at: Date;
    };
    vehicle_id?: string;
    current_order_id?: string;
  };

  // Performance
  performance: {
    total_trips: number;
    total_distance_km: number;
    total_earnings: number;
    avg_rating: number;
    rating_count: number;
    acceptance_rate: number;
    cancellation_rate: number;
    on_time_rate: number;
  };

  // Earnings
  earnings: {
    today_earnings: number;
    week_earnings: number;
    month_earnings: number;
    pending_payout: number;
    last_payout?: {
      amount: number;
      date: string;
    };
  };

  // Schedule
  schedule: {
    today_hours: number;
    week_hours: number;
    regulatory_hours_remaining: number;
    shift_start?: Date;
    shift_end?: Date;
  };

  // Vehicle assignment
  vehicle_id?: string;

  // Metadata
  version: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// DRIVER TWIN SCHEMA
// ============================================================================

const DriverTwinSchema = new Schema<IDriverTwin>({
  driver_id: {
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
  fleet_id: {
    type: String,
    index: true,
  },

  // Profile
  profile: {
    name: {
      first: { type: String, required: true },
      last: { type: String, required: true },
    },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    photo_url: String,
    date_of_birth: String,
    language: { type: String, default: 'en' },
  },

  // Licensing
  licensing: {
    license_number: { type: String, required: true },
    license_type: { type: String, enum: ['standard', 'commercial', 'professional', 'motorcycle', 'bus'], default: 'standard' },
    license_expiry: { type: String, required: true },
    license_images: [{ type: String }],
    background_check: {
      status: { type: String, enum: ['clear', 'pending', 'failed'], default: 'pending' },
      completed_at: Date,
    },
  },

  // Status
  status: {
    current: { type: String, enum: ['online', 'busy', 'offline', 'break', 'suspended'], default: 'offline' },
    location: {
      lat: Number,
      lng: Number,
      updated_at: Date,
    },
    vehicle_id: String,
    current_order_id: String,
  },

  // Performance
  performance: {
    total_trips: { type: Number, default: 0 },
    total_distance_km: { type: Number, default: 0 },
    total_earnings: { type: Number, default: 0 },
    avg_rating: { type: Number, default: 5, min: 1, max: 5 },
    rating_count: { type: Number, default: 0 },
    acceptance_rate: { type: Number, default: 100, min: 0, max: 100 },
    cancellation_rate: { type: Number, default: 0, min: 0, max: 100 },
    on_time_rate: { type: Number, default: 100, min: 0, max: 100 },
  },

  // Earnings
  earnings: {
    today_earnings: { type: Number, default: 0 },
    week_earnings: { type: Number, default: 0 },
    month_earnings: { type: Number, default: 0 },
    pending_payout: { type: Number, default: 0 },
    last_payout: {
      amount: Number,
      date: String,
    },
  },

  // Schedule
  schedule: {
    today_hours: { type: Number, default: 0 },
    week_hours: { type: Number, default: 0 },
    regulatory_hours_remaining: { type: Number, default: 12 },
    shift_start: Date,
    shift_end: Date,
  },

  // Vehicle assignment
  vehicle_id: {
    type: String,
    index: true,
  },

  // Metadata
  version: { type: Number, default: 1 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Compound indexes
DriverTwinSchema.index({ 'status.current': 1, 'status.location': '2dsphere' });
DriverTwinSchema.index({ fleet_id: 1, 'status.current': 1 });
DriverTwinSchema.index({ vehicle_id: 1, 'status.current': 1 });
DriverTwinSchema.index({ 'performance.avg_rating': -1 });
DriverTwinSchema.index({ 'licensing.background_check.status': 1 });
DriverTwinSchema.index({ 'licensing.license_expiry': 1 });

// Virtual for id
DriverTwinSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

DriverTwinSchema.set('toJSON', { virtuals: true });
DriverTwinSchema.set('toObject', { virtuals: true });

// ============================================================================
// MODEL EXPORT
// ============================================================================

export const DriverTwinModel: Model<IDriverTwin> = mongoose.model<IDriverTwin>('DriverTwin', DriverTwinSchema);
