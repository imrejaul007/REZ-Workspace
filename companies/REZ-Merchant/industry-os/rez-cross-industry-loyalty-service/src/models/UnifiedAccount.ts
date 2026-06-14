import mongoose, { Document, Schema } from 'mongoose';
import { UnifiedLoyaltyAccount, LoyaltyVertical } from '../types';

// Mongoose document interface
export interface IUnifiedAccount extends Document {
  accountId: string;
  userId: string;
  phone: string;
  email?: string;
  totalPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  verticals: LoyaltyVertical[];
  createdAt: Date;
  updatedAt: Date;
}

// Vertical subdocument schema
const LoyaltyVerticalSchema = new Schema<LoyaltyVertical>({
  vertical: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  transactions: {
    type: Number,
    default: 0
  }
}, { _id: false });

// Main account schema
const UnifiedAccountSchema = new Schema<IUnifiedAccount>({
  accountId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    sparse: true,
    index: true
  },
  totalPoints: {
    type: Number,
    default: 0,
    index: true // For leaderboard queries
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze',
    index: true
  },
  verticals: [LoyaltyVerticalSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'unified_accounts'
});

// Compound indexes for common queries
UnifiedAccountSchema.index({ userId: 1, phone: 1 });
UnifiedAccountSchema.index({ tier: 1, totalPoints: -1 }); // Leaderboard by tier
UnifiedAccountSchema.index({ 'verticals.vertical': 1, totalPoints: -1 }); // Vertical leaderboard

// Pre-save middleware to update timestamps
UnifiedAccountSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Instance method to get points by vertical
UnifiedAccountSchema.methods.getPointsByVertical = function(vertical: string): number {
  const v = this.verticals.find((v: LoyaltyVertical) => v.vertical === vertical);
  return v ? v.points : 0;
};

// Instance method to add or update vertical
UnifiedAccountSchema.methods.updateVertical = function(vertical: string, pointsDelta: number) {
  const existingIndex = this.verticals.findIndex((v: LoyaltyVertical) => v.vertical === vertical);

  if (existingIndex >= 0) {
    this.verticals[existingIndex].points += pointsDelta;
    this.verticals[existingIndex].lastActivity = new Date();
    this.verticals[existingIndex].transactions += 1;
  } else {
    this.verticals.push({
      vertical,
      points: pointsDelta,
      lastActivity: new Date(),
      transactions: 1
    });
  }

  // Recalculate total points
  this.totalPoints = this.verticals.reduce((sum: number, v: LoyaltyVertical) => sum + v.points, 0);
  return this;
};

export const UnifiedAccount = mongoose.model<IUnifiedAccount>('UnifiedAccount', UnifiedAccountSchema);

export default UnifiedAccount;