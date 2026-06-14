/**
 * PriveAccess Model
 * Tracks user Prive membership and eligibility
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { PriveTier, AccessState, PillarScore, PillarMetrics } from '../types';

export interface IPriveAccess extends Document {
  userId: mongoose.Types.ObjectId;

  // Access status
  tier: PriveTier;
  accessState: AccessState;

  // Scores
  totalScore: number;
  trustScore: number;
  pillars: PillarScore[];

  // Timestamps
  gracePeriodEnds?: Date;
  lastRecalculated?: Date;
  lastUpdated?: Date;

  // Metadata
  source: 'invite' | 'admin_whitelist' | 'auto_qualify' | 'requalified';
  notes?: string;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

const PillarScoreSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  shortName: { type: String },
  score: { type: Number, required: true, min: 0, max: 100 },
  weight: { type: Number, required: true },
  weightedScore: { type: Number },
  trend: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' },
  icon: { type: String },
  color: { type: String },
  description: { type: String },
  improvementTips: [{ type: String }],
}, { _id: false });

const PriveAccessSchema = new Schema<IPriveAccess>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    unique: true,
    index: true,
  },

  tier: {
    type: String,
    enum: ['none', 'entry', 'signature', 'elite'],
    default: 'none',
  },

  accessState: {
    type: String,
    enum: ['active', 'grace_period', 'paused', 'suspended', 'revoked'],
    default: 'active',
  },

  totalScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },

  trustScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100,
  },

  pillars: [PillarScoreSchema],

  gracePeriodEnds: Date,
  lastRecalculated: Date,
  lastUpdated: Date,

  source: {
    type: String,
    enum: ['invite', 'admin_whitelist', 'auto_qualify', 'requalified'],
  },

  notes: String,
}, { timestamps: true });

// Indexes
PriveAccessSchema.index({ tier: 1 });
PriveAccessSchema.index({ accessState: 1 });
PriveAccessSchema.index({ totalScore: -1 });
PriveAccessSchema.index({ 'pillars.id': 1, 'pillars.score': -1 });

export const PriveAccess: Model<IPriveAccess> =
  mongoose.models.PriveAccess || mongoose.model<IPriveAccess>('PriveAccess', PriveAccessSchema);
