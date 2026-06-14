/**
 * PartnershipProposal Model
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IPartnershipProposal extends Document {
  _id: mongoose.Types.ObjectId;
  proposalId: string;
  campaignId: string;
  influencerId: string;
  brandId: string;
  proposedRate: number;
  message?: string;
  status: 'pending' | 'negotiating' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: Date;
  updatedAt: Date;
  respondedAt?: Date;
  responseReason?: string;
}

const proposalSchema = new Schema<IPartnershipProposal>({
  proposalId: { type: String, required: true, unique: true },
  campaignId: { type: String, required: true },
  influencerId: { type: String, required: true },
  brandId: { type: String, required: true },
  proposedRate: { type: Number, required: true },
  message: { type: String },
  status: {
    type: String,
    enum: ['pending', 'negotiating', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  respondedAt: { type: Date },
  responseReason: { type: String }
}, {
  timestamps: true
});

proposalSchema.index({ campaignId: 1 });
proposalSchema.index({ influencerId: 1 });
proposalSchema.index({ brandId: 1 });
proposalSchema.index({ status: 1 });
proposalSchema.index({ createdAt: -1 });
proposalSchema.index({ proposedRate: 1 });

export const PartnershipProposal = mongoose.model<IPartnershipProposal>('PartnershipProposal', proposalSchema);