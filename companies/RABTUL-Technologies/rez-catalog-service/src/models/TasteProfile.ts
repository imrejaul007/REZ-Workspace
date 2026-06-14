/**
 * Taste Profile Model
 * Stores user taste preferences for personalized recommendations
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ITasteProfile extends Document {
  userId: string;
  // Spice tolerance level (1-5)
  spiceTolerance: number;
  // Preferred cuisines
  preferredCuisines: string[];
  // Average order value in paise
  avgOrderValue: number;
  // Ordering frequency
  orderingFrequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  // Preferred portion size
  preferredPortionSize: 'small' | 'medium' | 'large' | 'sharing';
  // Average tip percentage
  tipPercentage: number;
  // Dietary restrictions
  dietaryRestrictions: string[];
  // Order statistics
  totalOrders: number;
  totalSpent: number;
  favoriteCategories: string[];
  favoriteItems: string[];
  // Learning data
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TasteProfileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    spiceTolerance: { type: Number, default: 3, min: 1, max: 5 },
    preferredCuisines: { type: [String], default: [] },
    avgOrderValue: { type: Number, default: 0 },
    orderingFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'occasional'],
      default: 'weekly',
    },
    preferredPortionSize: {
      type: String,
      enum: ['small', 'medium', 'large', 'sharing'],
      default: 'medium',
    },
    tipPercentage: { type: Number, default: 10, min: 0, max: 100 },
    dietaryRestrictions: { type: [String], default: [] },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    favoriteCategories: { type: [String], default: [] },
    favoriteItems: { type: [String], default: [] },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'taste_profiles' }
);

// Compound indexes
TasteProfileSchema.index({ userId: 1, updatedAt: -1 });
TasteProfileSchema.index({ orderingFrequency: 1 });
TasteProfileSchema.index({ avgOrderValue: 1 });

// Update lastUpdated on save
TasteProfileSchema.pre('save', function (next) {
  this.lastUpdated = new Date();
  next();
});

export const TasteProfile = mongoose.model<ITasteProfile>('TasteProfile', TasteProfileSchema);
