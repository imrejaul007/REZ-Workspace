import mongoose, { Schema, Document } from 'mongoose';
import { PacingStrategy } from '../types';

export interface ICampaignPacingDocument extends Document {
  campaignId: string;
  strategy: PacingStrategy;
  totalBudget: number;
  dailyBudget: number;
  hourlyBudget?: number;
  startDate: Date;
  endDate: Date;
  targetImpressions?: number;
  targetClicks?: number;
  targetConversions?: number;
  isActive: boolean;
  customSchedule?: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignPacingSchema = new Schema<ICampaignPacingDocument>(
  {
    campaignId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    strategy: {
      type: String,
      enum: Object.values(PacingStrategy),
      required: true,
      default: PacingStrategy.EVEN
    },
    totalBudget: {
      type: Number,
      required: true,
      min: 0
    },
    dailyBudget: {
      type: Number,
      required: true,
      min: 0
    },
    hourlyBudget: {
      type: Number,
      min: 0
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    targetImpressions: {
      type: Number,
      min: 0
    },
    targetClicks: {
      type: Number,
      min: 0
    },
    targetConversions: {
      type: Number,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    customSchedule: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
CampaignPacingSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
CampaignPacingSchema.index({ strategy: 1 });
CampaignPacingSchema.index({ createdAt: -1 });

// Virtual for calculating campaign duration in days
CampaignPacingSchema.virtual('durationDays').get(function () {
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for calculating expected daily spend based on strategy
CampaignPacingSchema.virtual('expectedDailySpend').get(function () {
  const durationDays = this.durationDays;
  if (durationDays <= 0) return 0;

  switch (this.strategy) {
    case PacingStrategy.EVEN:
      return this.totalBudget / durationDays;
    case PacingStrategy.FRONT_LOADED:
      return (this.totalBudget * 0.6) / Math.max(1, Math.ceil(durationDays * 0.4));
    case PacingStrategy.BACK_LOADED:
      return (this.totalBudget * 0.6) / Math.max(1, Math.ceil(durationDays * 0.6));
    case PacingStrategy.ACCELERATED:
      return this.totalBudget / Math.max(1, durationDays * 0.7);
    case PacingStrategy.AGGRESSIVE:
      return this.totalBudget / Math.max(1, durationDays * 0.5);
    case PacingStrategy.CONSERVATIVE:
      return this.totalBudget / Math.max(1, durationDays * 1.2);
    default:
      return this.totalBudget / durationDays;
  }
});

// Method to check if campaign is currently active
CampaignPacingSchema.methods.isCurrentlyActive = function (): boolean {
  const now = new Date();
  return this.isActive && now >= this.startDate && now <= this.endDate;
};

// Static method to find active campaigns
CampaignPacingSchema.statics.findActiveCampaigns = function () {
  const now = new Date();
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
};

// Pre-save middleware to calculate hourly budget if not provided
CampaignPacingSchema.pre('save', function (next) {
  if (!this.hourlyBudget && this.dailyBudget) {
    this.hourlyBudget = this.dailyBudget / 24;
  }
  next();
});

export const CampaignPacing = mongoose.model<ICampaignPacingDocument>(
  'CampaignPacing',
  CampaignPacingSchema
);