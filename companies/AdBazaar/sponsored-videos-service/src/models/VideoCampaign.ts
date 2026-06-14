import mongoose, { Schema, Document } from 'mongoose';
import { ICampaign } from '../types';

export interface IVideoCampaignDocument extends Omit<ICampaign, '_id'>, Document {}

const TargetingSchema = new Schema(
  {
    demographics: {
      ageRange: {
        min: { type: Number, min: 13 },
        max: { type: Number, max: 100 },
      },
      gender: [String],
      location: [String],
      interests: [String],
    },
    devices: [String],
    platforms: [String],
    timeSlots: [
      {
        start: { type: String },
        end: { type: String },
      },
    ],
    customRules: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const BudgetSchema = new Schema(
  {
    total: {
      type: Number,
      required: [true, 'Total budget is required'],
      min: [0, 'Budget cannot be negative'],
    },
    spent: {
      type: Number,
      default: 0,
      min: 0,
    },
    daily: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR', 'GBP'],
    },
  },
  { _id: false }
);

const ScheduleSchema = new Schema(
  {
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: Date,
    frequency: {
      type: Number,
      min: 1,
    },
  },
  { _id: false }
);

const VideoCampaignSchema = new Schema<IVideoCampaignDocument>(
  {
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
      maxlength: [100, 'Campaign name cannot exceed 100 characters'],
    },
    advertiserId: {
      type: String,
      required: [true, 'Advertiser ID is required'],
      index: true,
    },
    videoId: {
      type: String,
      required: [true, 'Video ID is required'],
      index: true,
    },
    targeting: {
      type: TargetingSchema,
      default: () => ({}),
    },
    budget: {
      type: BudgetSchema,
      required: [true, 'Budget is required'],
 },
    schedule: {
      type: ScheduleSchema,
      required: [true, 'Schedule is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed', 'archived'],
      default: 'draft',
      index: true,
    },
    priority: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
VideoCampaignSchema.index({ advertiserId: 1, status: 1 });
VideoCampaignSchema.index({ videoId: 1, status: 1 });
VideoCampaignSchema.index({ status: 1, 'schedule.startDate': 1 });
VideoCampaignSchema.index({ 'budget.spent': 1, 'budget.total': 1 });

// Virtual for budget utilization
VideoCampaignSchema.virtual('budgetUtilization').get(function () {
  if (this.budget.total === 0) return 0;
  return (this.budget.spent / this.budget.total) * 100;
});

// Virtual for remaining budget
VideoCampaignSchema.virtual('remainingBudget').get(function () {
  return this.budget.total - this.budget.spent;
});

// Virtual for is active
VideoCampaignSchema.virtual('isActive').get(function () {
  const now = new Date();
  const scheduleValid =
    this.schedule.startDate <= now &&
    (!this.schedule.endDate || this.schedule.endDate >= now);
  const budgetAvailable = this.budget.spent < this.budget.total;
  return this.status === 'active' && scheduleValid && budgetAvailable;
});

// Pre-save validation
VideoCampaignSchema.pre('save', function (next) {
  if (this.budget.spent > this.budget.total) {
    next(new Error('Spent budget cannot exceed total budget'));
  }
  if (this.schedule.endDate && this.schedule.endDate < this.schedule.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Static method to find active campaigns
VideoCampaignSchema.statics.findActive = function () {
  const now = new Date();
  return this.find({
    status: 'active',
    'schedule.startDate': { $lte: now },
    $or: [{ 'schedule.endDate': null }, { 'schedule.endDate': { $gte: now } }],
  }).sort({ priority: -1 });
};

// Static method to update budget spent
VideoCampaignSchema.statics.addSpending = async function (
  campaignId: string,
  amount: number
) {
  return this.findByIdAndUpdate(campaignId, {
    $inc: { 'budget.spent': amount },
  });
};

export const VideoCampaign = mongoose.model<IVideoCampaignDocument>(
  'VideoCampaign',
  VideoCampaignSchema
);
export default VideoCampaign;