/**
 * Membership Plan Model - Salon membership plans
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IMembershipPlan extends Document {
  planId: string;
  salonId: string;
  name: string;
  tier: 'basic' | 'silver' | 'gold' | 'platinum' | 'vip';
  description?: string;
  durationMonths: number;
  price: number;
  currency: string;
  discountPercent: number;
  pointsMultiplier: number;
  benefits: string[];
  maxVisitsPerMonth?: number;
  freeServices: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipPlanSchema = new Schema<IMembershipPlan>({
  planId: { type: String, required: true, unique: true, index: true },
  salonId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  tier: {
    type: String,
    enum: ['basic', 'silver', 'gold', 'platinum', 'vip'],
    required: true,
  },
  description: String,
  durationMonths: { type: Number, required: true, min: 1, max: 24 },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  pointsMultiplier: { type: Number, default: 1, min: 1 },
  benefits: [String],
  maxVisitsPerMonth: Number,
  freeServices: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

MembershipPlanSchema.index({ salonId: 1, isActive: 1 });
MembershipPlanSchema.index({ tier: 1, price: 1 });

export const MembershipPlan = mongoose.model<IMembershipPlan>('MembershipPlan', MembershipPlanSchema);
