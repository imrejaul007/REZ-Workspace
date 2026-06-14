import mongoose, { Document, Schema } from 'mongoose';

export type Platform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'all';

export interface IKeyword extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  keyword: string;
  type: 'track' | 'search' | 'hashtag' | 'mention';
  platforms: Platform[];
  filters: {
    languages?: string[];
    locations?: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
    minFollowers?: number;
  };
  alertEnabled: boolean;
  alertThreshold?: number;
  isActive: boolean;
  matchCount: number;
  lastMatchAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const KeywordSchema = new Schema<IKeyword>(
  {
    userId: { type: String, required: true, index: true },
    keyword: { type: String, required: true, maxlength: 200 },
    type: {
      type: String,
      enum: ['track', 'search', 'hashtag', 'mention'],
      default: 'track'
    },
    platforms: {
      type: [String],
      enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'all'],
      default: ['all']
    },
    filters: {
      languages: [String],
      locations: [String],
      sentiment: { type: String, enum: ['positive', 'negative', 'neutral'] },
      minFollowers: Number
    },
    alertEnabled: { type: Boolean, default: false },
    alertThreshold: Number,
    isActive: { type: Boolean, default: true, index: true },
    matchCount: { type: Number, default: 0 },
    lastMatchAt: Date
  },
  { timestamps: true }
);

KeywordSchema.index({ userId: 1, isActive: 1 });
KeywordSchema.index({ keyword: 'text' });

export const Keyword = mongoose.model<IKeyword>('Keyword', KeywordSchema);