import mongoose, { Document, Schema } from 'mongoose';
import { CampaignType, CampaignStatus } from '../types';

export interface ILoyaltyCampaign extends Document {
  campaignId: string;
  name: string;
  merchantId: string;
  vertical: string;
  type: CampaignType;
  multiplier: number;
  startDate: Date;
  endDate: Date;
  maxParticipants?: number;
  participantCount: number;
  participants: string[];
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
}

const LoyaltyCampaignSchema = new Schema<ILoyaltyCampaign>({
  campaignId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  merchantId: {
    type: String,
    required: true,
    index: true
  },
  vertical: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['points_boost', 'bonus', 'double'],
    required: true,
    index: true
  },
  multiplier: {
    type: Number,
    required: true,
    default: 2.0
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  maxParticipants: {
    type: Number,
    sparse: true
  },
  participantCount: {
    type: Number,
    default: 0
  },
  participants: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active',
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
  collection: 'loyalty_campaigns'
});

// Compound indexes for common queries
LoyaltyCampaignSchema.index({ merchantId: 1, status: 1 });
LoyaltyCampaignSchema.index({ vertical: 1, status: 1 });
LoyaltyCampaignSchema.index({ startDate: 1, endDate: 1 }); // Date range queries
LoyaltyCampaignSchema.index({ status: 1, startDate: 1, endDate: 1 }); // Active campaigns

// Pre-save middleware to update participant count
LoyaltyCampaignSchema.pre('save', function(next) {
  this.participantCount = this.participants.length;
  next();
});

// Static method to get active campaigns
LoyaltyCampaignSchema.statics.getActiveCampaigns = async function(
  vertical?: string,
  merchantId?: string
) {
  const now = new Date();
  const query: any = {
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now }
  };

  if (vertical) {
    query.vertical = vertical;
  }

  if (merchantId) {
    query.merchantId = merchantId;
  }

  return this.find(query).sort({ multiplier: -1, endDate: 1 });
};

// Static method to get campaign multiplier for account
LoyaltyCampaignSchema.statics.getCampaignMultiplier = async function(
  merchantId: string,
  vertical: string,
  accountId: string
): Promise<number> {
  const now = new Date();

  const activeCampaign = await this.findOne({
    merchantId,
    vertical,
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { participants: { $size: 0 } }, // Open to all
      { participants: accountId } // Account is a participant
    ],
    $expr: {
      $or: [
        { $eq: [{ $size: '$participants' }, 0] },
        { $lt: ['$participantCount', '$maxParticipants'] }
      ]
    }
  }).sort({ multiplier: -1 });

  return activeCampaign ? activeCampaign.multiplier : 1.0;
};

// Instance method to add participant
LoyaltyCampaignSchema.methods.addParticipant = async function(accountId: string): Promise<boolean> {
  if (this.participants.includes(accountId)) {
    return false; // Already a participant
  }

  if (this.maxParticipants && this.participantCount >= this.maxParticipants) {
    return false; // Campaign is full
  }

  this.participants.push(accountId);
  this.participantCount = this.participants.length;
  await this.save();
  return true;
};

// Instance method to check if campaign is valid
LoyaltyCampaignSchema.methods.isValid = function(): boolean {
  const now = new Date();
  return this.status === 'active' &&
    now >= this.startDate &&
    now <= this.endDate &&
    (!this.maxParticipants || this.participantCount < this.maxParticipants);
};

export const LoyaltyCampaignModel = mongoose.model<ILoyaltyCampaign>(
  'LoyaltyCampaign',
  LoyaltyCampaignSchema
);

export default LoyaltyCampaignModel;