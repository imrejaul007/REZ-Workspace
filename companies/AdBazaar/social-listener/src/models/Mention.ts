import mongoose, { Document, Schema } from 'mongoose';

export type SentimentLabel = 'positive' | 'negative' | 'neutral';

export interface IMention extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  keywordId: mongoose.Types.ObjectId;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok';
  externalId: string;
  author: {
    id: string;
    username: string;
    displayName?: string;
    followers?: number;
    verified?: boolean;
  };
  content: string;
  originalContent?: string;
  url: string;
  mediaUrls: string[];
  publishedAt: Date;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    reach?: number;
  };
  location?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };
  language?: string;
  sentiment: SentimentLabel;
  sentimentScore: number;
  isProcessed: boolean;
  isAlerted: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MentionSchema = new Schema<IMention>(
  {
    userId: { type: String, required: true, index: true },
    keywordId: { type: Schema.Types.ObjectId, ref: 'Keyword', required: true, index: true },
    platform: {
      type: String,
      enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok'],
      required: true,
      index: true
    },
    externalId: { type: String, required: true },
    author: {
      id: { type: String, required: true },
      username: { type: String, required: true },
      displayName: String,
      followers: Number,
      verified: { type: Boolean, default: false }
    },
    content: { type: String, required: true, maxlength: 5000 },
    originalContent: String,
    url: { type: String, required: true },
    mediaUrls: { type: [String], default: [] },
    publishedAt: { type: Date, required: true, index: true },
    engagement: {
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      reach: Number
    },
    location: {
      country: String,
      city: String,
      coordinates: { type: [Number], length: 2 }
    },
    language: { type: String },
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral',
      index: true
    },
    sentimentScore: { type: Number, default: 0 },
    isProcessed: { type: Boolean, default: false, index: true },
    isAlerted: { type: Boolean, default: false },
    tags: { type: [String], default: [] }
  },
  { timestamps: true }
);

MentionSchema.index({ userId: 1, publishedAt: -1 });
MentionSchema.index({ userId: 1, sentiment: 1 });
MentionSchema.index({ userId: 1, platform: 1 });
MentionSchema.index({ externalId: 1, platform: 1 }, { unique: true });

export const Mention = mongoose.model<IMention>('Mention', MentionSchema);