/**
 * MonitoringKeyword Model - Mongoose schema for monitoring keywords/mentions
 */

import mongoose, { Document, Schema } from 'mongoose';

export enum KeywordType {
  BRAND = 'brand',
  COMPETITOR = 'competitor',
  CRISIS = 'crisis',
  CUSTOM = 'custom',
}

export enum KeywordSentiment {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
}

export enum AlertChannel {
  SLACK = 'slack',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
}

export interface IMonitoringKeyword extends Document {
  keywordId: string;
  keyword: string;
  type: KeywordType;
  sentiment: KeywordSentiment;
  threshold: number; // Alert when mentions exceed this
  alertChannels: AlertChannel[];
  enabled: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const monitoringKeywordSchema = new Schema<IMonitoringKeyword>(
  {
    keywordId: { type: String, required: true, unique: true, index: true },
    keyword: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: Object.values(KeywordType),
      required: true,
      index: true,
    },
    sentiment: {
      type: String,
      enum: Object.values(KeywordSentiment),
      required: true,
    },
    threshold: { type: Number, required: true, default: 100 },
    alertChannels: [
      {
        type: String,
        enum: Object.values(AlertChannel),
      },
    ],
    enabled: { type: Boolean, default: true, index: true },
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
monitoringKeywordSchema.index({ type: 1, enabled: 1 });
monitoringKeywordSchema.index({ keyword: 'text' });

export const MonitoringKeyword = mongoose.model<IMonitoringKeyword>('MonitoringKeyword', monitoringKeywordSchema);
export default MonitoringKeyword;
