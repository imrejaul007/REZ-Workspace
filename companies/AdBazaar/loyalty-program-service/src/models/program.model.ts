import mongoose, { Document, Schema } from 'mongoose';

export interface IProgram extends Document {
  programId: string;
  name: string;
  description?: string;
  type: 'points' | 'tiered' | 'cashback' | 'hybrid';
  status: 'active' | 'inactive' | 'archived';
  earningRules: Array<{
    ruleId: string;
    action: string;
    pointsPerUnit: number;
    multiplier?: number;
    conditions?: Record<string, unknown>;
  }>;
  redemptionRules: {
    pointsPerUnit: number;
    minRedemption: number;
    maxRedemption?: number;
    expiryDays?: number;
  };
  tiers?: Array<{
    tierId: string;
    name: string;
    minPoints: number;
    maxPoints?: number;
    benefits: string[];
    multiplier: number;
  }>;
  currency?: string;
  memberCount: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const earningRuleSchema = new Schema({
  ruleId: { type: String, required: true },
  action: { type: String, required: true },
  pointsPerUnit: { type: Number, required: true },
  multiplier: Number,
  conditions: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { _id: false });

const redemptionRuleSchema = new Schema({
  pointsPerUnit: { type: Number, required: true },
  minRedemption: { type: Number, default: 0 },
  maxRedemption: Number,
  expiryDays: Number
}, { _id: false });

const tierSchema = new Schema({
  tierId: { type: String, required: true },
  name: { type: String, required: true },
  minPoints: { type: Number, required: true },
  maxPoints: Number,
  benefits: [String],
  multiplier: { type: Number, default: 1 }
}, { _id: false });

const programSchema = new Schema<IProgram>({
  programId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  type: {
    type: String,
    enum: ['points', 'tiered', 'cashback', 'hybrid'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  earningRules: [earningRuleSchema],
  redemptionRules: redemptionRuleSchema,
  tiers: [tierSchema],
  currency: { type: String, default: 'points' },
  memberCount: { type: Number, default: 0 },
  totalPointsIssued: { type: Number, default: 0 },
  totalPointsRedeemed: { type: Number, default: 0 },
  createdBy: { type: String, required: true }
}, { timestamps: true });

programSchema.index({ programId: 1 });
programSchema.index({ status: 1 });
programSchema.index({ createdBy: 1 });

export const Program = mongoose.model<IProgram>('Program', programSchema);