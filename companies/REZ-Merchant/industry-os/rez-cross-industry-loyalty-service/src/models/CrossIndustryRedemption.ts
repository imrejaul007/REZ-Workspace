import mongoose, { Document, Schema } from 'mongoose';
import { RedemptionStatus } from '../types';

export interface ICrossIndustryRedemption extends Document {
  redemptionId: string;
  accountId: string;
  fromVertical: string;
  toVertical: string;
  points: number;
  convertedValue: number;
  targetVertical: string;
  targetMerchantId: string;
  status: RedemptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const CrossIndustryRedemptionSchema = new Schema<ICrossIndustryRedemption>({
  redemptionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  accountId: {
    type: String,
    required: true,
    index: true
  },
  fromVertical: {
    type: String,
    required: true,
    index: true
  },
  toVertical: {
    type: String,
    required: true,
    index: true
  },
  points: {
    type: Number,
    required: true
  },
  convertedValue: {
    type: Number,
    required: true
  },
  targetVertical: {
    type: String,
    required: true,
    index: true
  },
  targetMerchantId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
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
  collection: 'cross_industry_redemptions'
});

// Compound indexes for common queries
CrossIndustryRedemptionSchema.index({ accountId: 1, status: 1 });
CrossIndustryRedemptionSchema.index({ fromVertical: 1, toVertical: 1 });
CrossIndustryRedemptionSchema.index({ targetMerchantId: 1, status: 1 });
CrossIndustryRedemptionSchema.index({ createdAt: -1 });

// Static method to get redemption history
CrossIndustryRedemptionSchema.statics.getAccountHistory = async function(
  accountId: string,
  limit: number = 50
) {
  return this.find({ accountId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get cross-industry stats
CrossIndustryRedemptionSchema.statics.getCrossIndustryStats = async function(
  fromVertical: string,
  toVertical: string
) {
  const result = await this.aggregate([
    { $match: { fromVertical, toVertical, status: 'completed' } },
    {
      $group: {
        _id: null,
        totalRedemptions: { $sum: 1 },
        totalPointsTransferred: { $sum: '$points' },
        totalConvertedValue: { $sum: '$convertedValue' },
        avgConversionRate: { $avg: { $divide: ['$convertedValue', '$points'] } }
      }
    }
  ]);

  return result[0] || {
    totalRedemptions: 0,
    totalPointsTransferred: 0,
    totalConvertedValue: 0,
    avgConversionRate: 1.0
  };
};

export const CrossIndustryRedemptionModel = mongoose.model<ICrossIndustryRedemption>(
  'CrossIndustryRedemption',
  CrossIndustryRedemptionSchema
);

export default CrossIndustryRedemptionModel;