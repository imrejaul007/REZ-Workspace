import mongoose, { Document, Schema } from 'mongoose';

export interface IUGCCampaign extends Document {
  name: string;
  brandId: string;
  hashtags: string[];
  mentions: string[];
  startDate: Date;
  endDate: Date;
  status: 'active' | 'paused' | 'completed';
  autoModeration: boolean;
  approvalRequired: boolean;
  moderationRules: {
    minFollowers?: number;
    maxFollowers?: number;
    excludeHashtags?: string[];
    requireHashtags?: string[];
    sentimentThreshold?: number;
    excludeAccounts?: string[];
  };
  displaySettings: {
    autoDisplay: boolean;
    displayDuration: number;
    rotationSpeed: number;
  };
  stats: {
    collected: number;
    approved: number;
    displayed: number;
    rightsGranted: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UGCCampaignSchema = new Schema<IUGCCampaign>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    brandId: {
      type: String,
      required: true,
      index: true
    },
    hashtags: [{
      type: String,
      index: true
    }],
    mentions: [{
      type: String
    }],
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
      index: true
    },
    autoModeration: {
      type: Boolean,
      default: true
    },
    approvalRequired: {
      type: Boolean,
      default: true
    },
    moderationRules: {
      minFollowers: { type: Number },
      maxFollowers: { type: Number },
      excludeHashtags: [{ type: String }],
      requireHashtags: [{ type: String }],
      sentimentThreshold: { type: Number },
      excludeAccounts: [{ type: String }]
    },
    displaySettings: {
      autoDisplay: { type: Boolean, default: false },
      displayDuration: { type: Number, default: 5000 },
      rotationSpeed: { type: Number, default: 3000 }
    },
    stats: {
      collected: { type: Number, default: 0 },
      approved: { type: Number, default: 0 },
      displayed: { type: Number, default: 0 },
      rightsGranted: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
);

// Indexes
UGCCampaignSchema.index({ brandId: 1, status: 1 });
UGCCampaignSchema.index({ startDate: 1, endDate: 1 });
UGCCampaignSchema.index({ 'hashtags': 1 });

// Virtual for active campaigns
UGCCampaignSchema.virtual('isActive').get(function () {
  const now = new Date();
  return this.status === 'active' &&
         this.startDate <= now &&
         this.endDate >= now;
});

export const UGCCampaign = mongoose.model<IUGCCampaign>('UGCCampaign', UGCCampaignSchema);