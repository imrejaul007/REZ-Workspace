import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// AUDIENCE TWIN DOCUMENT INTERFACE
// ============================================================================

export interface IAudienceTwin extends Document {
  _id: mongoose.Types.ObjectId;

  // Identity
  audience_id: string;
  twin_id: string;
  segment_type: 'demographic' | 'behavioral' | 'contextual' | 'intent' | 'lookalike';

  // Profile
  name: string;
  description?: string;

  // Attributes
  attributes: {
    demographics: {
      age_ranges: string[];
      gender: string[];
      income_brackets: string[];
      education_levels: string[];
      geographic_focus: Array<{
        country: string;
        region?: string;
        city?: string;
      }>;
    };
    psychographics: {
      interests: string[];
      values: string[];
      lifestyle: string[];
    };
    behavioral: {
      purchase_frequency?: string;
      brand_loyalty: number;
      engagement_level: 'low' | 'medium' | 'high' | 'super';
      media_consumption: {
        social: number;
        streaming: number;
        broadcast: number;
        print: number;
      };
    };
  };

  // Size estimates
  size_estimate: {
    total_reach: number;
    confidence: number;
    last_updated: Date;
  };

  // Engagement metrics
  engagement_metrics: {
    avg_session_duration: number;
    content_interactions: number;
    conversion_rate: number;
    nps: number;
    sentiment: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };

  // Relationships
  relationships: {
    venues: Array<{
      venue_id: string;
      relationship_type: string;
      affinity_score?: number;
    }>;
    events: Array<{
      event_id: string;
      attendance_status: string;
    }>;
    creators: Array<{
      creator_id: string;
      follow_status: string;
    }>;
  };

  // Metadata
  version: number;
  created_at: Date;
  updated_at: Date;
  managing_agent?: string;
}

// ============================================================================
// AUDIENCE TWIN SCHEMA
// ============================================================================

const AudienceTwinSchema = new Schema<IAudienceTwin>({
  audience_id: {
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
  segment_type: {
    type: String,
    enum: ['demographic', 'behavioral', 'contextual', 'intent', 'lookalike'],
    required: true,
    index: true,
  },

  name: {
    type: String,
    required: true,
  },
  description: String,

  attributes: {
    demographics: {
      age_ranges: [{ type: String }],
      gender: [{ type: String }],
      income_brackets: [{ type: String }],
      education_levels: [{ type: String }],
      geographic_focus: [{
        country: String,
        region: String,
        city: String,
      }],
    },
    psychographics: {
      interests: [{ type: String }],
      values: [{ type: String }],
      lifestyle: [{ type: String }],
    },
    behavioral: {
      purchase_frequency: String,
      brand_loyalty: { type: Number, default: 0, min: 0, max: 100 },
      engagement_level: {
        type: String,
        enum: ['low', 'medium', 'high', 'super'],
        default: 'medium'
      },
      media_consumption: {
        social: { type: Number, default: 0 },
        streaming: { type: Number, default: 0 },
        broadcast: { type: Number, default: 0 },
        print: { type: Number, default: 0 },
      },
    },
  },

  size_estimate: {
    total_reach: { type: Number, default: 0 },
    confidence: { type: Number, default: 0, min: 0, max: 100 },
    last_updated: Date,
  },

  engagement_metrics: {
    avg_session_duration: { type: Number, default: 0 },
    content_interactions: { type: Number, default: 0 },
    conversion_rate: { type: Number, default: 0 },
    nps: { type: Number, default: 0, min: -100, max: 100 },
    sentiment: {
      positive: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 },
      negative: { type: Number, default: 0 },
    },
  },

  relationships: {
    venues: [{
      venue_id: String,
      relationship_type: String,
      affinity_score: Number,
    }],
    events: [{
      event_id: String,
      attendance_status: String,
    }],
    creators: [{
      creator_id: String,
      follow_status: String,
    }],
  },

  version: { type: Number, default: 1 },
  managing_agent: { type: String, default: 'audience-agent' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Compound indexes
AudienceTwinSchema.index({ segment_type: 1, 'attributes.demographics.age_ranges': 1 });
AudienceTwinSchema.index({ 'engagement_metrics.sentiment.positive': -1 });
AudienceTwinSchema.index({ 'size_estimate.total_reach': -1 });
AudienceTwinSchema.index({ 'relationships.venues.venue_id': 1 });
AudienceTwinSchema.index({ 'relationships.events.event_id': 1 });
AudienceTwinSchema.index({ 'relationships.creators.creator_id': 1 });

// Virtual for id
AudienceTwinSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

AudienceTwinSchema.set('toJSON', { virtuals: true });
AudienceTwinSchema.set('toObject', { virtuals: true });

// ============================================================================
// MODEL EXPORT
// ============================================================================

export const AudienceTwinModel: Model<IAudienceTwin> = mongoose.model<IAudienceTwin>('AudienceTwin', AudienceTwinSchema);
