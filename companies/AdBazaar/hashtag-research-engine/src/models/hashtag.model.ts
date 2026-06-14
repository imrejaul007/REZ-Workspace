import mongoose, { Document, Schema } from 'mongoose';

// Zod schemas for validation
export const IHashtagSchema = {
  tag: { type: 'string', required: true },
  usageCount: { type: 'number', required: true, default: 0 },
  trending: { type: 'boolean', default: false },
  trendingDirection: { type: 'enum', enum: ['up', 'down', 'stable'], default: 'stable' },
  category: { type: 'string' },
  avgEngagement: { type: 'number', default: 0 },
  topPosts: { type: 'array', items: { type: 'string' } },
  relatedTags: { type: 'array', items: { type: 'string' } },
  banned: { type: 'boolean', default: false },
  lastUpdated: { type: 'date', default: Date.now },
};

export interface IHashtag extends Document {
  tag: string;
  usageCount: number;
  trending: boolean;
  trendingDirection: 'up' | 'down' | 'stable';
  category?: string;
  avgEngagement: number;
  topPosts?: string[];
  relatedTags: string[];
  banned: boolean;
  lastUpdated: Date;
}

const hashtagSchema = new Schema<IHashtag>(
  {
    tag: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    trending: {
      type: Boolean,
      default: false,
      index: true,
    },
    trendingDirection: {
      type: String,
      enum: ['up', 'down', 'stable'],
      default: 'stable',
    },
    category: {
      type: String,
      index: true,
    },
    avgEngagement: {
      type: Number,
      default: 0,
    },
    topPosts: {
      type: [String],
      default: [],
    },
    relatedTags: {
      type: [String],
      default: [],
      index: true,
    },
    banned: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search
hashtagSchema.index({ tag: 'text', category: 'text' });

// Compound indexes
hashtagSchema.index({ trending: 1, trendingDirection: 1 });
hashtagSchema.index({ usageCount: -1, trending: 1 });
hashtagSchema.index({ category: 1, trending: 1 });

export const Hashtag = mongoose.model<IHashtag>('Hashtag', hashtagSchema);