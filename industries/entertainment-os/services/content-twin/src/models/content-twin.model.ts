import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// CONTENT TWIN DOCUMENT INTERFACE
// ============================================================================

export interface IContentTwin extends Document {
  _id: mongoose.Types.ObjectId;

  // Identity
  content_id: string;
  twin_id: string;
  content_type: 'video' | 'audio' | 'image' | 'text' | 'interactive' | 'livestream' | 'podcast' | 'document';

  // Profile
  title: string;
  description?: string;

  // Attributes
  attributes: {
    genre: string[];
    mood: string[];
    theme: string[];
    runtime?: number;
    release_date?: Date;
    rating?: string;
    language: string[];
    target_age: {
      min: number;
      max: number;
    };
    production_quality: 'low' | 'medium' | 'high' | 'premium';
    metadata: {
      director?: string;
      cast?: string[];
      studio?: string;
      distributor?: string;
    };
  };

  // Performance metrics
  performance_metrics: {
    views: number;
    unique_viewers: number;
    avg_watch_time: number;
    completion_rate: number;
    engagement_score: number;
    share_count: number;
    comment_count: number;
    save_count: number;
    revenue: number;
    roi: number;
  };

  // Audience alignment
  audience_alignment: {
    primary_audience: Array<{
      audience_id: string;
      match_score: number;
      segment_size: number;
    }>;
    secondary_audience: Array<{
      audience_id: string;
      match_score: number;
    }>;
    demographic_match: number;
    intent_match: number;
  };

  // Rights management
  rights_management: {
    territories: string[];
    platforms: string[];
    exclusivity: {
      exclusive: boolean;
      exclusive_platforms: string[];
      exclusive_until?: Date;
    };
    licensing_status: string;
  };

  // Placements
  placements: Array<{
    venue_id: string;
    screen_id: string;
    start_date?: Date;
    end_date?: Date;
    position: string;
  }>;

  // Relationships
  relationships: {
    creators: Array<{
      creator_id: string;
      role: string;
    }>;
    events: Array<{
      event_id: string;
      context: string;
    }>;
    brands: Array<{
      brand_id: string;
      integration_type: string;
    }>;
  };

  // Metadata
  version: number;
  created_at: Date;
  updated_at: Date;
  managing_agent?: string;
}

// ============================================================================
// CONTENT TWIN SCHEMA
// ============================================================================

const ContentTwinSchema = new Schema<IContentTwin>({
  content_id: {
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
  content_type: {
    type: String,
    enum: ['video', 'audio', 'image', 'text', 'interactive', 'livestream', 'podcast', 'document'],
    required: true,
    index: true,
  },

  title: {
    type: String,
    required: true,
  },
  description: String,

  attributes: {
    genre: [{ type: String }],
    mood: [{ type: String }],
    theme: [{ type: String }],
    runtime: Number,
    release_date: Date,
    rating: String,
    language: [{ type: String }],
    target_age: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100 },
    },
    production_quality: {
      type: String,
      enum: ['low', 'medium', 'high', 'premium'],
      default: 'medium',
    },
    metadata: {
      director: String,
      cast: [{ type: String }],
      studio: String,
      distributor: String,
    },
  },

  performance_metrics: {
    views: { type: Number, default: 0 },
    unique_viewers: { type: Number, default: 0 },
    avg_watch_time: { type: Number, default: 0 },
    completion_rate: { type: Number, default: 0 },
    engagement_score: { type: Number, default: 0 },
    share_count: { type: Number, default: 0 },
    comment_count: { type: Number, default: 0 },
    save_count: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    roi: { type: Number, default: 0 },
  },

  audience_alignment: {
    primary_audience: [{
      audience_id: String,
      match_score: Number,
      segment_size: Number,
    }],
    secondary_audience: [{
      audience_id: String,
      match_score: Number,
    }],
    demographic_match: { type: Number, default: 0 },
    intent_match: { type: Number, default: 0 },
  },

  rights_management: {
    territories: [{ type: String }],
    platforms: [{ type: String }],
    exclusivity: {
      exclusive: { type: Boolean, default: false },
      exclusive_platforms: [{ type: String }],
      exclusive_until: Date,
    },
    licensing_status: { type: String, default: 'unknown' },
  },

  placements: [{
    venue_id: String,
    screen_id: String,
    start_date: Date,
    end_date: Date,
    position: String,
  }],

  relationships: {
    creators: [{
      creator_id: String,
      role: String,
    }],
    events: [{
      event_id: String,
      context: String,
    }],
    brands: [{
      brand_id: String,
      integration_type: String,
    }],
  },

  version: { type: Number, default: 1 },
  managing_agent: { type: String, default: 'content-agent' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Compound indexes
ContentTwinSchema.index({ content_type: 1, 'attributes.genre': 1 });
ContentTwinSchema.index({ 'performance_metrics.views': -1 });
ContentTwinSchema.index({ 'performance_metrics.engagement_score': -1 });
ContentTwinSchema.index({ 'relationships.creators.creator_id': 1 });
ContentTwinSchema.index({ 'audience_alignment.primary_audience.audience_id': 1 });

// Virtual for id
ContentTwinSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

ContentTwinSchema.set('toJSON', { virtuals: true });
ContentTwinSchema.set('toObject', { virtuals: true });

// ============================================================================
// MODEL EXPORT
// ============================================================================

export const ContentTwinModel: Model<IContentTwin> = mongoose.model<IContentTwin>('ContentTwin', ContentTwinSchema);