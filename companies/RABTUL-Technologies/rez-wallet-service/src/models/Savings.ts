/**
 * Savings Module - Data Models
 *
 * Tracks user savings through cashback, rewards, referrals, and more.
 * Provides insights into savings patterns and projections.
 */

import mongoose, { Schema, Document } from 'mongoose';

// TODO: Migrate to import from '@rez/shared-types'
// Example: import { ISavingsEntry, ISavingsGoal, ISavingsStreak, ISavingsInsight, ISavingsProjection, IUserSavingsSummary } from '@rez/shared-types/entities/wallet';

// ─── Savings Entry ─────────────────────────────────────────────────────────────

export interface ISavingsEntry extends Document {
  userId: string;
  entryId: string;
  type: 'cashback' | 'reward' | 'referral' | 'loyalty' | 'promo' | 'cashback_bonus';
  amount: number; // in coins/paise
  source: string; // e.g., 'order_123', 'referral_abc'
  description: string;
  originalAmount?: number; // Original transaction amount (for cashback percentage calculation)
  savingsPercentage?: number; // e.g., 10 for 10% cashback
  category?: string; // 'dining', 'groceries', 'entertainment', etc.
  merchantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SavingsEntrySchema = new Schema<ISavingsEntry>(
  {
    userId: { type: String, required: true, index: true },
    entryId: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ['cashback', 'reward', 'referral', 'loyalty', 'promo', 'cashback_bonus'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    source: { type: String, required: true },
    description: { type: String, required: true },
    originalAmount: { type: Number }, // Original spend amount
    savingsPercentage: { type: Number }, // e.g., 10 for 10%
    category: { type: String }, // Spending category
    merchantId: { type: String },
  },
  { timestamps: true },
);

SavingsEntrySchema.index({ userId: 1, createdAt: -1 });
SavingsEntrySchema.index({ userId: 1, type: 1 });
SavingsEntrySchema.index({ userId: 1, category: 1 });

// ─── Savings Goal ──────────────────────────────────────────────────────────────

export interface ISavingsGoal extends Document {
  userId: string;
  goalId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  category?: string;
  icon?: string;
  color?: string;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SavingsGoalSchema = new Schema<ISavingsGoal>(
  {
    userId: { type: String, required: true, index: true },
    goalId: { type: String, required: true, unique: true },
    name: { type: String, required: true, maxlength: 100 },
    targetAmount: { type: Number, required: true, min: 1 },
    currentAmount: { type: Number, default: 0, min: 0 },
    targetDate: { type: Date },
    category: { type: String },
    icon: { type: String, default: '🎯' },
    color: { type: String, default: '#4CAF50' },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

SavingsGoalSchema.index({ userId: 1, isCompleted: 1 });

// ─── Savings Streak ────────────────────────────────────────────────────────────

export interface ISavingsStreak extends Document {
  userId: string;
  currentStreak: number; // Days in a row with savings
  longestStreak: number;
  lastSavingsDate: Date;
  totalStreakDays: number; // Total days where user earned savings
  streakActive: boolean; // Whether the streak is currently active (saved within last 24h)
  streakHistory: Array<{
    date: Date;
    amount: number;
    streakDay: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const SavingsStreakSchema = new Schema<ISavingsStreak>(
  {
    userId: { type: String, required: true, unique: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastSavingsDate: { type: Date },
    totalStreakDays: { type: Number, default: 0 },
    streakActive: { type: Boolean, default: true },
    streakHistory: [
      {
        date: Date,
        amount: Number,
        streakDay: Number,
      },
    ],
  },
  { timestamps: true },
);

// ─── Savings Insights ──────────────────────────────────────────────────────────

export interface ISavingsInsight extends Document {
  userId: string;
  insightType: 'best_category' | 'peak_savings_day' | 'average_savings' | 'savings_trend' | 'potential_savings';
  title: string;
  description: string;
  value: number;
  comparison?: number; // e.g., vs last month
  comparisonPercent?: number;
  category?: string;
  actionable?: boolean;
  actionText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SavingsInsightSchema = new Schema<ISavingsInsight>(
  {
    userId: { type: String, required: true, index: true },
    insightType: {
      type: String,
      enum: ['best_category', 'peak_savings_day', 'average_savings', 'savings_trend', 'potential_savings'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    value: { type: Number, required: true },
    comparison: { type: Number },
    comparisonPercent: { type: Number },
    category: { type: String },
    actionable: { type: Boolean, default: false },
    actionText: { type: String },
  },
  { timestamps: true },
);

SavingsInsightSchema.index({ userId: 1, insightType: 1 });

// ─── Savings Projection ─────────────────────────────────────────────────────────

export interface ISavingsProjection extends Document {
  userId: string;
  projectedAmount30Days: number;
  projectedAmount90Days: number;
  projectedAmount365Days: number;
  monthlyAverage: number;
  savingsRate: number; // Average savings per day
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  basedOnDays: number; // How many days of data used for projection
  calculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SavingsProjectionSchema = new Schema<ISavingsProjection>(
  {
    userId: { type: String, required: true, unique: true },
    projectedAmount30Days: { type: Number, default: 0 },
    projectedAmount90Days: { type: Number, default: 0 },
    projectedAmount365Days: { type: Number, default: 0 },
    monthlyAverage: { type: Number, default: 0 },
    savingsRate: { type: Number, default: 0 },
    trendDirection: {
      type: String,
      enum: ['increasing', 'decreasing', 'stable'],
      default: 'stable',
    },
    basedOnDays: { type: Number, default: 0 },
    calculatedAt: { type: Date },
  },
  { timestamps: true },
);

// ─── User Savings Summary (Denormalized for fast reads) ─────────────────────────

export interface IUserSavingsSummary extends Document {
  userId: string;
  totalSavings: number;
  totalSavingsAmount: number; // in rupees (coins * conversion rate)
  thisMonth: number;
  thisMonthAmount: number;
  lastMonth: number;
  lastMonthAmount: number;
  thisWeek: number;
  thisWeekAmount: number;
  cashbackTotal: number;
  rewardTotal: number;
  referralTotal: number;
  loyaltyTotal: number;
  promoTotal: number;
  transactionCount: number;
  averageSavingsPerTransaction: number;
  bestSavingsDay: {
    date: Date;
    amount: number;
  };
  bestSavingsMonth: {
    month: string;
    year: number;
    amount: number;
  };
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSavingsSummarySchema = new Schema<IUserSavingsSummary>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    totalSavings: { type: Number, default: 0 },
    totalSavingsAmount: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
    thisMonthAmount: { type: Number, default: 0 },
    lastMonth: { type: Number, default: 0 },
    lastMonthAmount: { type: Number, default: 0 },
    thisWeek: { type: Number, default: 0 },
    thisWeekAmount: { type: Number, default: 0 },
    cashbackTotal: { type: Number, default: 0 },
    rewardTotal: { type: Number, default: 0 },
    referralTotal: { type: Number, default: 0 },
    loyaltyTotal: { type: Number, default: 0 },
    promoTotal: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    averageSavingsPerTransaction: { type: Number, default: 0 },
    bestSavingsDay: {
      date: Date,
      amount: Number,
    },
    bestSavingsMonth: {
      month: String,
      year: Number,
      amount: Number,
    },
    lastUpdated: { type: Date },
  },
  { timestamps: true },
);

// ─── Export Models ─────────────────────────────────────────────────────────────

export const SavingsEntry = mongoose.model<ISavingsEntry>('SavingsEntry', SavingsEntrySchema);
export const SavingsGoal = mongoose.model<ISavingsGoal>('SavingsGoal', SavingsGoalSchema);
export const SavingsStreak = mongoose.model<ISavingsStreak>('SavingsStreakSchema', SavingsStreakSchema);
export const SavingsInsight = mongoose.model<ISavingsInsight>('SavingsInsight', SavingsInsightSchema);
export const SavingsProjection = mongoose.model<ISavingsProjection>('SavingsProjection', SavingsProjectionSchema);
export const UserSavingsSummary = mongoose.model<IUserSavingsSummary>('UserSavingsSummary', UserSavingsSummarySchema);
