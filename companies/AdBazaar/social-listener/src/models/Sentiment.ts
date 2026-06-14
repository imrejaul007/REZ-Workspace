import mongoose, { Document, Schema } from 'mongoose';

export type SentimentLabel = 'positive' | 'negative' | 'neutral';

export interface ISentiment extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  keywordId?: mongoose.Types.ObjectId;
  mentionId?: mongoose.Types.ObjectId;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'all';
  label: SentimentLabel;
  score: number;
  confidence: number;
  keywords: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  analyzedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SentimentSchema = new Schema<ISentiment>(
  {
    userId: { type: String, required: true, index: true },
    keywordId: { type: Schema.Types.ObjectId, ref: 'Keyword' },
    mentionId: { type: Schema.Types.ObjectId, ref: 'Mention' },
    platform: {
      type: String,
      enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'all'],
      default: 'all'
    },
    label: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      required: true,
      index: true
    },
    score: { type: Number, required: true },
    confidence: { type: Number, default: 0 },
    keywords: {
      positive: { type: [String], default: [] },
      negative: { type: [String], default: [] },
      neutral: { type: [String], default: [] }
    },
    analyzedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

SentimentSchema.index({ userId: 1, label: 1, analyzedAt: -1 });
SentimentSchema.index({ keywordId: 1, analyzedAt: -1 });

export const Sentiment = mongoose.model<ISentiment>('Sentiment', SentimentSchema);