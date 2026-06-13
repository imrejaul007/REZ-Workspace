import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// GUEST TWIN DOCUMENT INTERFACE
// ============================================================================

export interface IGuestTwin extends Document {
  _id: mongoose.Types.ObjectId;

  // Identity
  guest_id: string;
  twin_id: string;
  property_id?: string;

  // Profile
  profile: {
    name: string;
    email: string;
    phone?: string;
    nationality?: string;
    language_preference: string;
    accessibility_needs: string[];
  };

  // Loyalty
  loyalty: {
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    points_balance: number;
    member_since?: Date;
    total_stays: number;
    total_spend: number;
  };

  // Preferences
  preferences: {
    room: {
      floor_preference?: string;
      view_preference?: string;
      bed_configuration?: string;
      temperature_setting?: {
        default: number;
        range?: { min: number; max: number };
      };
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

  // Stay patterns
  stay_patterns: {
    typical_check_in_time?: string;
    typical_check_out_time?: string;
    weekend_vs_weekday?: 'weekend' | 'weekday' | 'equal';
    seasonal_patterns: string[];
    booking_lead_time?: number;
  };

  // Sentiment
  sentiment: {
    current_score: number;
    trend: 'improving' | 'stable' | 'declining';
    last_feedback_date?: Date;
    key_topics: string[];
  };

  // Lifetime value
  lifetime_value: {
    clv: number;
    potential_clv: number;
    churn_risk: 'low' | 'medium' | 'high';
    recommendation_eligibility: boolean;
  };

  // Current stay
  current_stay: {
    room_id?: string;
    check_in?: Date;
    check_out?: Date;
    adults: number;
    children: number;
    rate_code?: string;
    special_requests: string[];
    occasion?: string | null;
  };

  // Stay history
  stay_history: Array<{
    room_id: string;
    check_in: Date;
    check_out: Date;
    total_spend: number;
    rating?: number;
  }>;

  // Metadata
  version: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// GUEST TWIN SCHEMA
// ============================================================================

const GuestTwinSchema = new Schema<IGuestTwin>({
  guest_id: {
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
  property_id: {
    type: String,
    index: true,
  },

  // Profile
  profile: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    nationality: String,
    language_preference: { type: String, default: 'en' },
    accessibility_needs: [{ type: String }],
  },

  // Loyalty
  loyalty: {
    tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
    points_balance: { type: Number, default: 0 },
    member_since: Date,
    total_stays: { type: Number, default: 0 },
    total_spend: { type: Number, default: 0 },
  },

  // Preferences
  preferences: {
    room: {
      floor_preference: String,
      view_preference: String,
      bed_configuration: String,
      temperature_setting: {
        default: Number,
        range: {
          min: Number,
          max: Number,
        },
      },
      lighting_preference: String,
      noise_tolerance: Number,
    },
    dining: {
      dietary_restrictions: [{ type: String }],
      allergies: [{ type: String }],
      favorite_items: [{ type: String }],
      beverage_preferences: [{ type: String }],
      typical_spend_range: {
        min: Number,
        max: Number,
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
        start: String,
        end: String,
      },
    },
  },

  // Stay patterns
  stay_patterns: {
    typical_check_in_time: String,
    typical_check_out_time: String,
    weekend_vs_weekday: String,
    seasonal_patterns: [{ type: String }],
    booking_lead_time: Number,
  },

  // Sentiment
  sentiment: {
    current_score: { type: Number, default: 50, min: 0, max: 100 },
    trend: { type: String, enum: ['improving', 'stable', 'declining'], default: 'stable' },
    last_feedback_date: Date,
    key_topics: [{ type: String }],
  },

  // Lifetime value
  lifetime_value: {
    clv: { type: Number, default: 0 },
    potential_clv: { type: Number, default: 0 },
    churn_risk: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    recommendation_eligibility: { type: Boolean, default: true },
  },

  // Current stay
  current_stay: {
    room_id: String,
    check_in: Date,
    check_out: Date,
    adults: { type: Number, default: 1 },
    children: { type: Number, default: 0 },
    rate_code: String,
    special_requests: [{ type: String }],
    occasion: String,
  },

  // Stay history
  stay_history: [{
    room_id: String,
    check_in: Date,
    check_out: Date,
    total_spend: { type: Number, default: 0 },
    rating: Number,
  }],

  // Metadata
  version: { type: Number, default: 1 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Compound indexes
GuestTwinSchema.index({ 'loyalty.tier': 1, 'sentiment.current_score': -1 });
GuestTwinSchema.index({ 'lifetime_value.churn_risk': 1 });
GuestTwinSchema.index({ 'current_stay.check_out': 1 });
GuestTwinSchema.index({ property_id: 1, 'profile.email': 1 });

// Virtual for id
GuestTwinSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

GuestTwinSchema.set('toJSON', { virtuals: true });
GuestTwinSchema.set('toObject', { virtuals: true });

// ============================================================================
// MODEL EXPORT
// ============================================================================

export const GuestTwinModel: Model<IGuestTwin> = mongoose.model<IGuestTwin>('GuestTwin', GuestTwinSchema);