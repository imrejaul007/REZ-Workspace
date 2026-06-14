/**
 * InfluencerApplication Model
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IInfluencerApplication extends Document {
  _id: mongoose.Types.ObjectId;
  applicationId: string;
  campaignId: string;
  influencerId: string;
  message?: string;
  proposedRate: number;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted';
  appliedAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
  reviewNotes?: string;
}

const applicationSchema = new Schema<IInfluencerApplication>({
  applicationId: { type: String, required: true, unique: true },
  campaignId: { type: String, required: true },
  influencerId: { type: String, required: true },
  message: { type: String },
  proposedRate: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'shortlisted', 'rejected', 'accepted'],
    default: 'pending'
  },
  appliedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewNotes: { type: String }
}, {
  timestamps: true
});

applicationSchema.index({ campaignId: 1 });
applicationSchema.index({ influencerId: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ appliedAt: -1 });
applicationSchema.index({ proposedRate: 1 });

export const InfluencerApplication = mongoose.model<IInfluencerApplication>('InfluencerApplication', applicationSchema);