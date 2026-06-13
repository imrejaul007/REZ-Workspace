import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// AGENT TWIN DOCUMENT INTERFACE
// ============================================================================

export interface IAgentTwin extends Document {
  _id: mongoose.Types.ObjectId;

  // Identity
  agent_id: string;
  twin_id: string;

  // Profile
  profile: {
    name: {
      first: string;
      last: string;
      prefix?: string | null;
    };
    photo_url?: string;
    bio?: string;
    languages: string[];
    specialties: string[];
    license_number: string;
    license_state: string;
    license_expiration: Date;
  };

  // Contact
  contact: {
    phone: string;
    email: string;
    website?: string | null;
    social?: {
      linkedin?: string | null;
      facebook?: string | null;
      instagram?: string | null;
    };
  };

  // Brokerage
  brokerage: {
    brokerage_id: string;
    brokerage_name: string;
    brokerage_address?: string;
    team_name?: string | null;
  };

  // Performance
  performance: {
    transactions_ytd: number;
    volume_ytd: number;
    avg_days_to_close: number;
    list_to_sale_ratio: number;
    client_rating: number;
    review_count: number;
    recommendation_rate: number;
  };

  // Expertise
  expertise: {
    areas: string[];
    property_types: string[];
    price_ranges: {
      min: number;
      max: number;
    };
    years_experience: number;
  };

  // Availability
  availability: {
    status: 'available' | 'busy' | 'unavailable';
    response_time_avg_minutes: number;
    working_hours: {
      monday?: { start: string; end: string } | null;
      tuesday?: { start: string; end: string } | null;
      wednesday?: { start: string; end: string } | null;
      thursday?: { start: string; end: string } | null;
      friday?: { start: string; end: string } | null;
      saturday?: { start: string; end: string } | null;
      sunday?: { start: string; end: string } | null;
    };
  };

  // Lead Preferences
  lead_preferences: {
    min_budget: number;
    max_budget: number;
    property_types: string[];
    areas: string[];
    lead_routing_enabled: boolean;
  };

  // Compensation
  compensation: {
    commission_split: number;
    referral_fee_rate: number;
  };

  // Active listings and deals
  active_listings: string[];
  active_deals: string[];

  // Metadata
  version: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// WORKING HOURS SUB-SCHEMA
// ============================================================================

const DayHoursSchema = new Schema({
  start: { type: String, match: /^\d{2}:\d{2}$/ },
  end: { type: String, match: /^\d{2}:\d{2}$/ },
}, { _id: false });

// ============================================================================
// AGENT TWIN SCHEMA
// ============================================================================

const AgentTwinSchema = new Schema<IAgentTwin>({
  agent_id: {
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

  // Profile
  profile: {
    name: {
      first: { type: String, required: true },
      last: { type: String, required: true },
      prefix: { type: String, default: null },
    },
    photo_url: { type: String, default: '' },
    bio: { type: String, default: '' },
    languages: [{ type: String }],
    specialties: [{ type: String }],
    license_number: { type: String, required: true },
    license_state: { type: String, required: true, minlength: 2, maxlength: 2 },
    license_expiration: { type: Date, required: true },
  },

  // Contact
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    website: { type: String, default: null },
    social: {
      linkedin: { type: String, default: null },
      facebook: { type: String, default: null },
      instagram: { type: String, default: null },
    },
  },

  // Brokerage
  brokerage: {
    brokerage_id: { type: String, required: true },
    brokerage_name: { type: String, required: true },
    brokerage_address: { type: String, default: '' },
    team_name: { type: String, default: null },
  },

  // Performance
  performance: {
    transactions_ytd: { type: Number, default: 0, min: 0 },
    volume_ytd: { type: Number, default: 0, min: 0 },
    avg_days_to_close: { type: Number, default: 0, min: 0 },
    list_to_sale_ratio: { type: Number, default: 0, min: 0, max: 100 },
    client_rating: { type: Number, default: 0, min: 1, max: 5 },
    review_count: { type: Number, default: 0, min: 0 },
    recommendation_rate: { type: Number, default: 0, min: 0, max: 100 },
  },

  // Expertise
  expertise: {
    areas: [{ type: String }],
    property_types: [{
      type: String,
      enum: ['single_family', 'condo', 'townhouse', 'multi_family', 'land', 'commercial', 'industrial', 'mixed_use']
    }],
    price_ranges: {
      min: { type: Number, default: 0, min: 0 },
      max: { type: Number, default: 0, min: 0 },
    },
    years_experience: { type: Number, default: 0, min: 0 },
  },

  // Availability
  availability: {
    status: { type: String, enum: ['available', 'busy', 'unavailable'], default: 'available' },
    response_time_avg_minutes: { type: Number, default: 0, min: 0 },
    working_hours: {
      monday: DayHoursSchema,
      tuesday: DayHoursSchema,
      wednesday: DayHoursSchema,
      thursday: DayHoursSchema,
      friday: DayHoursSchema,
      saturday: DayHoursSchema,
      sunday: DayHoursSchema,
    },
  },

  // Lead Preferences
  lead_preferences: {
    min_budget: { type: Number, default: 0, min: 0 },
    max_budget: { type: Number, default: 0, min: 0 },
    property_types: [{
      type: String,
      enum: ['single_family', 'condo', 'townhouse', 'multi_family', 'land', 'commercial', 'industrial', 'mixed_use']
    }],
    areas: [{ type: String }],
    lead_routing_enabled: { type: Boolean, default: true },
  },

  // Compensation
  compensation: {
    commission_split: { type: Number, default: 70, min: 0, max: 100 },
    referral_fee_rate: { type: Number, default: 25, min: 0, max: 100 },
  },

  // Active listings and deals
  active_listings: [{ type: String, index: true }],
  active_deals: [{ type: String, index: true }],

  // Metadata
  version: { type: Number, default: 1 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// ============================================================================
// INDEXES
// ============================================================================

// Compound indexes for common queries
AgentTwinSchema.index({ 'availability.status': 1, 'lead_preferences.lead_routing_enabled': 1 });
AgentTwinSchema.index({ 'brokerage.brokerage_id': 1 });
AgentTwinSchema.index({ 'performance.volume_ytd': -1 });
AgentTwinSchema.index({ 'performance.transactions_ytd': -1 });
AgentTwinSchema.index({ 'performance.client_rating': -1 });
AgentTwinSchema.index({ 'expertise.areas': 1 });
AgentTwinSchema.index({ 'expertise.property_types': 1 });

// Text index for search
AgentTwinSchema.index({ 'profile.name.first': 'text', 'profile.name.last': 'text', 'profile.bio': 'text' });

// ============================================================================
// VIRTUALS
// ============================================================================

// Virtual for id
AgentTwinSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Virtual for full name
AgentTwinSchema.virtual('full_name').get(function() {
  const prefix = this.profile.name.prefix ? `${this.profile.name.prefix} ` : '';
  return `${prefix}${this.profile.name.first} ${this.profile.name.last}`;
});

// Enable virtuals in JSON
AgentTwinSchema.set('toJSON', { virtuals: true });
AgentTwinSchema.set('toObject', { virtuals: true });

// ============================================================================
// MODEL EXPORT
// ============================================================================

export const AgentTwinModel: Model<IAgentTwin> = mongoose.model<IAgentTwin>('AgentTwin', AgentTwinSchema);