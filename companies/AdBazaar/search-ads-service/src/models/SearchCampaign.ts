import mongoose, { Schema } from 'mongoose';
import { ISearchCampaign, NetworkType, CampaignStatus } from '../types';

const SearchCampaignSchema = new Schema<ISearchCampaign>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    advertiserId: {
      type: String,
      required: true,
      index: true,
    },
    budget: {
      daily: {
        type: Number,
        required: true,
        min: 0,
      },
      total: {
        type: Number,
        required: true,
        min: 0,
      },
      spent: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    network: {
      type: String,
      enum: ['google', 'bing', 'yahoo', 'all'] as NetworkType[],
      default: 'all',
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'ended', 'pending'] as CampaignStatus[],
      default: 'pending',
    },
    targeting: {
      locations: [{
        type: String,
      }],
      languages: [{
        type: String,
      }],
      devices: [{
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'all'],
      }],
      ageRanges: [{
        type: String,
      }],
    },
    bidding: {
      strategy: {
        type: String,
        enum: ['cpc', 'cpm', 'target_roas', 'max_conversions'],
        default: 'cpc',
      },
      defaultCpc: {
        type: Number,
        required: true,
        min: 0.01,
      },
      targetRoas: {
        type: Number,
      },
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'search_campaigns',
  }
);

// Indexes
SearchCampaignSchema.index({ advertiserId: 1, status: 1 });
SearchCampaignSchema.index({ status: 1, startDate: 1 });
SearchCampaignSchema.index({ createdAt: -1 });

// Methods
SearchCampaignSchema.methods.canSpend = function(amount: number): boolean {
  return this.budget.spent + amount <= this.budget.daily &&
         this.budget.spent + amount <= this.budget.total;
};

SearchCampaignSchema.methods.addSpend = function(amount: number): void {
  this.budget.spent += amount;
};

SearchCampaignSchema.methods.isActive = function(): boolean {
  return this.status === 'active' &&
         new Date() >= this.startDate &&
         (!this.endDate || new Date() <= this.endDate);
};

// Static methods
SearchCampaignSchema.statics.findByAdvertiser = function(advertiserId: string) {
  return this.find({ advertiserId }).sort({ createdAt: -1 });
};

SearchCampaignSchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    startDate: { $lte: now },
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gte: now } },
    ],
  });
};

export const SearchCampaign = mongoose.model<ISearchCampaign>('SearchCampaign', SearchCampaignSchema);