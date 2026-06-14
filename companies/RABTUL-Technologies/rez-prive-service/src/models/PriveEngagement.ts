/**
 * PriveEngagement Model
 * Tracks engagement signals for 6-Pillar scoring
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { EngagementAction, EcosystemService } from '../types';

export interface IPriveEngagement extends Document {
  userId: mongoose.Types.ObjectId;

  // Action details
  action: EngagementAction;
  source: EcosystemService;
  metadata?: Record<string, unknown>;

  // Impact on pillars
  pillarImpact?: {
    pillarId: string;
    scoreChange: number;
  }[];

  // Attribution
  campaignId?: string;
  creatorId?: string;
  bookingId?: string;

  // Status
  processed: boolean;
  processedAt?: Date;

  // Audit
  createdAt: Date;
}

const PriveEngagementSchema = new Schema<IPriveEngagement>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },

  action: {
    type: String,
    required: true,
    enum: ['booking', 'review', 'campaign', 'referral', 'dooh_scan', 'social_share', 'checkin'],
  },

  source: {
    type: String,
    required: true,
    enum: ['creator_qr', 'adbazaar', 'dooh', 'karma', 'rendez', 'intent_graph'],
  },

  metadata: Schema.Types.Mixed,

  pillarImpact: [{
    pillarId: { type: String, required: true },
    scoreChange: { type: Number, required: true },
  }],

  campaignId: String,
  creatorId: String,
  bookingId: String,

  processed: {
    type: Boolean,
    default: false,
  },

  processedAt: Date,
}, { timestamps: true });

// Indexes
PriveEngagementSchema.index({ userId: 1, createdAt: -1 });
PriveEngagementSchema.index({ action: 1, createdAt: -1 });
PriveEngagementSchema.index({ source: 1, processed: 1 });
PriveEngagementSchema.index({ campaignId: 1 });

export const PriveEngagement: Model<IPriveEngagement> =
  mongoose.models.PriveEngagement || mongoose.model<IPriveEngagement>('PriveEngagement', PriveEngagementSchema);
