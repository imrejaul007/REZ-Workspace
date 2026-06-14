import mongoose, { Schema, Types } from 'mongoose';
import { ICampaign, ReferralType } from '../types/referral';

export interface CampaignDocument extends Omit<ICampaign, '_id'>, mongoose.Document {
  isValid(): { valid: boolean; reason?: string };
  calculateReward(type: 'referrer' | 'referee', orderAmount?: number): number;
  trackSpend(amount: number): Promise<void>;
  isLive: boolean;
  isBudgetAvailable: boolean;
}

interface CampaignModel extends mongoose.Model<CampaignDocument> {
  findActive(filters?: { companyId?: string; type?: ReferralType }): Promise<CampaignDocument[]>;
}

const campaignSchema = new Schema<CampaignDocument>(
  {
    type: {
      type: String,
      required: true,
      enum: ['consumer', 'merchant', 'creator'],
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      default: 'rez',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    sponsorId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    sponsorType: {
      type: String,
      enum: ['merchant', 'brand'],
    },
    budget: {
      type: Number,
      min: 0,
    },
    spent: {
      type: Number,
      default: 0,
      min: 0,
    },
    referrerReward: {
      type: {
        type: String,
        required: true,
        enum: ['fixed', 'percentage', 'coins', 'discount'],
      },
      value: {
        type: Number,
        required: true,
        min: 0,
      },
      coinType: {
        type: String,
      },
    },
    refereeReward: {
      type: {
        type: String,
        required: true,
        enum: ['fixed', 'percentage', 'coins', 'discount'],
      },
      value: {
        type: Number,
        required: true,
        min: 0,
      },
      coinType: {
        type: String,
      },
    },
    targetSegments: {
      type: [String],
      default: [],
    },
    categories: {
      type: [String],
      default: [],
    },
    companies: {
      type: [String],
      default: [],
    },
    maxRewards: {
      type: Number,
      min: 0,
    },
    maxRewardsPerUser: {
      type: Number,
      min: 0,
    },
    minPurchaseAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes for common queries
campaignSchema.index({ companyId: 1, isActive: 1, startDate: 1, endDate: 1 });
campaignSchema.index({ sponsorId: 1, isActive: 1 });
campaignSchema.index({ type: 1, isActive: 1 });

// Virtual to check if campaign is within date range
campaignSchema.virtual('isLive').get(function () {
  const now = new Date();
  const withinRange = now >= this.startDate && (!this.endDate || now <= this.endDate);
  return this.isActive && withinRange;
});

// Virtual to check budget status
campaignSchema.virtual('isBudgetAvailable').get(function () {
  if (!this.budget) return true;
  return (this.spent || 0) < this.budget;
});

// Ensure virtuals are included in JSON
campaignSchema.set('toJSON', { virtuals: true });
campaignSchema.set('toObject', { virtuals: true });

// Method to check if campaign is valid
campaignSchema.methods.isValid = function (): { valid: boolean; reason?: string } {
  const now = new Date();

  if (!this.isActive) {
    return { valid: false, reason: 'Campaign is not active' };
  }

  if (now < this.startDate) {
    return { valid: false, reason: 'Campaign has not started yet' };
  }

  if (this.endDate && now > this.endDate) {
    return { valid: false, reason: 'Campaign has ended' };
  }

  if (this.budget && this.spent && this.spent >= this.budget) {
    return { valid: false, reason: 'Campaign budget exhausted' };
  }

  return { valid: true };
};

// Method to calculate reward
campaignSchema.methods.calculateReward = function (
  type: 'referrer' | 'referee',
  orderAmount?: number
): number {
  const reward = type === 'referrer' ? this.referrerReward : this.refereeReward;
  if (!reward) return 0;

  switch (reward.type) {
    case 'fixed':
      return reward.value;
    case 'percentage':
      return orderAmount ? (orderAmount * reward.value) / 100 : 0;
    case 'coins':
    case 'discount':
      return reward.value;
    default:
      return 0;
  }
};

// Method to track spending
campaignSchema.methods.trackSpend = async function (amount: number): Promise<void> {
  this.spent = (this.spent || 0) + amount;
  await this.save();
};

// Static method to find active campaigns
campaignSchema.statics.findActive = async function (filters?: {
  companyId?: string;
  type?: ReferralType;
}): Promise<CampaignDocument[]> {
  const now = new Date();
  const query: Record<string, unknown> = {
    isActive: true,
    startDate: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $gte: now } }],
  };

  if (filters?.companyId) query.companyId = filters.companyId;
  if (filters?.type) query.type = filters.type;

  return this.find(query).sort({ createdAt: -1 });
};

export const Campaign = mongoose.model<CampaignDocument, CampaignModel>('Campaign', campaignSchema);
