/**
 * REZ Signal Service - Signal Model
 *
 * Stores detected intent signals and behavioral data
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// Types
// ============================================================================

export type SignalType =
  | 'jobPosting'
  | 'funding'
  | 'news'
  | 'technologyChange'
  | 'expansion'
  | 'executiveChange'
  | 'partnership'
  | 'productLaunch'
  | 'regulatory'
  | 'socialEngagement'
  | 'websiteVisit'
  | 'contentEngagement'
  | 'emailEngagement'
  | 'adEngagement';

export type IntentStage = 'awareness' | 'consideration' | 'decision' | 'purchase';

export type SignalSource = 'linkedin' | 'twitter' | 'news' | 'jobBoard' | 'website' | 'email' | 'ad' | 'manual' | 'api';

export interface ISignalEvent {
  type: SignalType;
  source: SignalSource;
  title: string;
  description: string;
  url?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface IIntentScore {
  awareness: number;
  consideration: number;
  decision: number;
  purchase: number;
}

export interface ISignal extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: string;
  companyId: string;
  companyName: string;

  // Signal data
  type: SignalType;
  source: SignalSource;
  title: string;
  description: string;
  url?: string;
  timestamp: Date;

  // Scoring
  score: number; // 0-100
  confidence: number; // 0-1
  intentStage: IntentStage;
  intentScore: IIntentScore;

  // Relevance
  tags: string[];
  categories: string[];
  relatedProducts?: string[];
  relatedCompetitors?: string[];

  // Metadata
  metadata?: Record<string, any>;

  // Engagement tracking
  engagementScore?: number;
  engagementCount?: number;
  lastEngagedAt?: Date;

  // Status
  isActive: boolean;
  isNotable: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Schema
// ============================================================================

const SignalEventSchema = new Schema<ISignalEvent>({
  type: { type: String, required: true },
  source: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  url: String,
  timestamp: { type: Date, required: true },
  metadata: { type: Schema.Types.Mixed },
}, { _id: false });

const SignalSchema = new Schema<ISignal>({
  tenantId: { type: String, required: true, index: true },
  companyId: { type: String, required: true, index: true },
  companyName: { type: String, required: true },

  type: {
    type: String,
    enum: [
      'jobPosting', 'funding', 'news', 'technologyChange', 'expansion',
      'executiveChange', 'partnership', 'productLaunch', 'regulatory',
      'socialEngagement', 'websiteVisit', 'contentEngagement',
      'emailEngagement', 'adEngagement'
    ],
    required: true,
    index: true,
  },
  source: {
    type: String,
    enum: ['linkedin', 'twitter', 'news', 'jobBoard', 'website', 'email', 'ad', 'manual', 'api'],
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  url: String,
  timestamp: { type: Date, required: true, index: true },

  score: { type: Number, required: true, min: 0, max: 100, index: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  intentStage: {
    type: String,
    enum: ['awareness', 'consideration', 'decision', 'purchase'],
    required: true,
  },
  intentScore: {
    awareness: { type: Number, default: 0 },
    consideration: { type: Number, default: 0 },
    decision: { type: Number, default: 0 },
    purchase: { type: Number, default: 0 },
  },

  tags: [{ type: String }],
  categories: [{ type: String }],
  relatedProducts: [{ type: String }],
  relatedCompetitors: [{ type: String }],

  metadata: { type: Schema.Types.Mixed },

  engagementScore: { type: Number, default: 0 },
  engagementCount: { type: Number, default: 0 },
  lastEngagedAt: Date,

  isActive: { type: Boolean, default: true, index: true },
  isNotable: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// Compound indexes
SignalSchema.index({ tenantId: 1, companyId: 1, type: 1 });
SignalSchema.index({ tenantId: 1, score: -1 });
SignalSchema.index({ tenantId: 1, intentStage: 1 });
SignalSchema.index({ tenantId: 1, timestamp: -1 });
SignalSchema.index({ isActive: 1, score: -1 });

// TTL index - auto-delete old signals after 90 days
SignalSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// ============================================================================
// Model
// ============================================================================

export const SignalModel: Model<ISignal> = mongoose.model<ISignal>('Signal', SignalSchema);
export default SignalModel;
