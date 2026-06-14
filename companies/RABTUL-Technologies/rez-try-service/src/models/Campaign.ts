/**
 * Campaign Model
 */
import mongoose, { Schema, Document } from 'mongoose';
import { Campaign } from '../types';

export interface ICampaign extends Campaign, Document {}

const CampaignSchema = new Schema(
  {
    merchantId: { type: String, required: true, index: true },
    merchantName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String },
    goal: { type: String },
    reward: { type: String },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    progress: {
      completed: { type: Number, default: 0 },
      target: { type: Number, default: 100 },
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

CampaignSchema.index({ startsAt: 1, endsAt: 1 });

export const CampaignModel = mongoose.model<ICampaign>('Campaign', CampaignSchema);
