/**
 * Brand Model
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IBrand extends Document {
  _id: mongoose.Types.ObjectId;
  brandId: string;
  name: string;
  industry: string;
  website?: string;
  logo?: string;
  description?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    facebook?: string;
  };
  tier: 'basic' | 'silver' | 'gold' | 'platinum';
  registeredAt: Date;
  verified: boolean;
  verifiedAt?: Date;
  userId: string;
  totalCampaigns: number;
  totalBudget: number;
}

const brandSchema = new Schema<IBrand>({
  brandId: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  industry: { type: String, required: true, trim: true },
  website: { type: String },
  logo: { type: String },
  description: { type: String },
  socialLinks: {
    instagram: { type: String },
    twitter: { type: String },
    linkedin: { type: String },
    facebook: { type: String }
  },
  tier: {
    type: String,
    enum: ['basic', 'silver', 'gold', 'platinum'],
    default: 'basic'
  },
  registeredAt: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  userId: { type: String, required: true },
  totalCampaigns: { type: Number, default: 0 },
  totalBudget: { type: Number, default: 0 }
}, {
  timestamps: true
});

brandSchema.index({ userId: 1 });
brandSchema.index({ industry: 1 });
brandSchema.index({ tier: 1 });
brandSchema.index({ verified: 1 });

export const Brand = mongoose.model<IBrand>('Brand', brandSchema);