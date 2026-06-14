/**
 * PartnershipCampaign Model
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IDeliverable {
  type: 'post' | 'story' | 'reel' | 'video' | 'blog' | 'other';
  count?: number;
  description?: string;
}

export interface IRequirement {
  type: string;
  value: string;
}

export interface ITimeline {
  startDate: Date;
  endDate: Date;
}

export interface IPartnershipCampaign extends Document {
  _id: mongoose.Types.ObjectId;
  campaignId: string;
  brandId: string;
  name: string;
  description?: string;
  goals: string[];
  budget?: number;
  timeline?: ITimeline;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  deliverables: IDeliverable[];
  requirements: IRequirement[];
  createdAt: Date;
  updatedAt: Date;
  // Stats
  totalProposals: number;
  acceptedProposals: number;
  totalViews: number;
  totalEngagement: number;
  totalSpend: number;
}

const campaignSchema = new Schema<IPartnershipCampaign>({
  campaignId: { type: String, required: true, unique: true },
  brandId: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  goals: [{ type: String }],
  budget: { type: Number },
  timeline: {
    startDate: { type: Date },
    endDate: { type: Date }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  deliverables: [{
    type: {
      type: String,
      enum: ['post', 'story', 'reel', 'video', 'blog', 'other']
    },
    count: { type: Number },
    description: { type: String }
  }],
  requirements: [{
    type: { type: String },
    value: { type: String }
  }],
  totalProposals: { type: Number, default: 0 },
  acceptedProposals: { type: Number, default: 0 },
  totalViews: { type: Number, default: 0 },
  totalEngagement: { type: Number, default: 0 },
  totalSpend: { type: Number, default: 0 }
}, {
  timestamps: true
});

campaignSchema.index({ brandId: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ createdAt: -1 });
campaignSchema.index({ budget: 1 });

export const PartnershipCampaign = mongoose.model<IPartnershipCampaign>('PartnershipCampaign', campaignSchema);