import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// VENUE TWIN DOCUMENT INTERFACE
// ============================================================================

export interface IVenueTwin extends Document {
  _id: mongoose.Types.ObjectId;

  // Identity
  venue_id: string;
  twin_id: string;
  venue_type: 'stadium' | 'arena' | 'theater' | 'club' | 'festival_grounds' | 'cinema' | 'amusement_park' | 'museum' | 'restaurant' | 'retail';

  // Profile
  name: string;
  description?: string;

  // Attributes
  attributes: {
    location: {
      address: string;
      city: string;
      state?: string;
      country: string;
      postal_code?: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
      timezone?: string;
    };
    capacity: {
      max_occupancy: number;
      current_capacity: number;
      vip_capacity: number;
      standing_room: number;
    };
    amenities: string[];
    technology: {
      dooh_screens: number;
      qr_code_readers: number;
      wifi_enabled: boolean;
      beacon_density?: string;
      camera_count: number;
    };
    operating_hours: {
      schedule: Array<{
        day_of_week: number;
        open_time: string;
        close_time: string;
        closed: boolean;
      }>;
    };
  };

  // Operational metrics
  operational_metrics: {
    occupancy_rate: number;
    avg_dwell_time: number;
    peak_hours: string[];
    revenue_per_sqft?: number;
    event_frequency: number;
    customer_satisfaction: number;
  };

  // Audience profile
  audience_profile: {
    primary_segments: string[];
    avg_age: number;
    gender_split: {
      male: number;
      female: number;
      other: number;
    };
    income_bracket?: string;
  };

  // DOOH configuration
  dooh_configuration: {
    screen_count: number;
    screen_locations: Array<{
      screen_id: string;
      location: string;
      size: string;
      orientation: string;
      daily_impressions: number;
    }>;
    avg_dwell_time: number;
    viewability: number;
  };

  // Relationships
  relationships: {
    audiences: Array<{
      audience_id: string;
      affinity_score: number;
    }>;
    events: Array<{
      event_id: string;
      event_name: string;
    }>;
    creators: Array<{
      creator_id: string;
      collaboration_type: string;
    }>;
    brands: Array<{
      brand_id: string;
      sponsorship_level: string;
    }>;
  };

  // Metadata
  version: number;
  created_at: Date;
  updated_at: Date;
  managing_agent?: string;
}

// ============================================================================
// VENUE TWIN SCHEMA
// ============================================================================

const VenueTwinSchema = new Schema<IVenueTwin>({
  venue_id: {
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
  venue_type: {
    type: String,
    enum: ['stadium', 'arena', 'theater', 'club', 'festival_grounds', 'cinema', 'amusement_park', 'museum', 'restaurant', 'retail'],
    required: true,
    index: true,
  },

  name: {
    type: String,
    required: true,
  },
  description: String,

  attributes: {
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: String,
      country: { type: String, required: true },
      postal_code: String,
      coordinates: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
      },
      timezone: String,
    },
    capacity: {
      max_occupancy: { type: Number, required: true, default: 0 },
      current_capacity: { type: Number, default: 0 },
      vip_capacity: { type: Number, default: 0 },
      standing_room: { type: Number, default: 0 },
    },
    amenities: [{ type: String }],
    technology: {
      dooh_screens: { type: Number, default: 0 },
      qr_code_readers: { type: Number, default: 0 },
      wifi_enabled: { type: Boolean, default: false },
      beacon_density: String,
      camera_count: { type: Number, default: 0 },
    },
    operating_hours: {
      schedule: [{
        day_of_week: { type: Number, min: 0, max: 6 },
        open_time: String,
        close_time: String,
        closed: { type: Boolean, default: false },
      }],
    },
  },

  operational_metrics: {
    occupancy_rate: { type: Number, default: 0, min: 0, max: 100 },
    avg_dwell_time: { type: Number, default: 0 },
    peak_hours: [{ type: String }],
    revenue_per_sqft: Number,
    event_frequency: { type: Number, default: 0 },
    customer_satisfaction: { type: Number, default: 0, min: 0, max: 100 },
  },

  audience_profile: {
    primary_segments: [{ type: String }],
    avg_age: { type: Number, default: 0 },
    gender_split: {
      male: { type: Number, default: 0 },
      female: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    income_bracket: String,
  },

  dooh_configuration: {
    screen_count: { type: Number, default: 0 },
    screen_locations: [{
      screen_id: String,
      location: String,
      size: String,
      orientation: String,
      daily_impressions: Number,
    }],
    avg_dwell_time: { type: Number, default: 0 },
    viewability: { type: Number, default: 0 },
  },

  relationships: {
    audiences: [{
      audience_id: String,
      affinity_score: Number,
    }],
    events: [{
      event_id: String,
      event_name: String,
    }],
    creators: [{
      creator_id: String,
      collaboration_type: String,
    }],
    brands: [{
      brand_id: String,
      sponsorship_level: String,
    }],
  },

  version: { type: Number, default: 1 },
  managing_agent: { type: String, default: 'venue-agent' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Compound indexes
VenueTwinSchema.index({ venue_type: 1, 'attributes.location.city': 1 });
VenueTwinSchema.index({ 'operational_metrics.occupancy_rate': -1 });
VenueTwinSchema.index({ 'attributes.location.coordinates': '2dsphere' });
VenueTwinSchema.index({ 'dooh_configuration.screen_count': -1 });
VenueTwinSchema.index({ 'relationships.audiences.audience_id': 1 });

// Virtual for id
VenueTwinSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

VenueTwinSchema.set('toJSON', { virtuals: true });
VenueTwinSchema.set('toObject', { virtuals: true });

// ============================================================================
// MODEL EXPORT
// ============================================================================

export const VenueTwinModel: Model<IVenueTwin> = mongoose.model<IVenueTwin>('VenueTwin', VenueTwinSchema);