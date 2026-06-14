/**
 * PartnershipContract Model
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IContractDeliverable {
  type: string;
  description: string;
  deadline?: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface IPaymentSchedule {
  milestone: string;
  amount: number;
  dueDate?: Date;
  paid: boolean;
  paidAt?: Date;
}

export interface IPartnershipContract extends Document {
  _id: mongoose.Types.ObjectId;
  contractId: string;
  proposalId: string;
  campaignId: string;
  influencerId: string;
  brandId: string;
  terms: string;
  deliverables: IContractDeliverable[];
  paymentSchedule: IPaymentSchedule[];
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'disputed';
  signedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const contractSchema = new Schema<IPartnershipContract>({
  contractId: { type: String, required: true, unique: true },
  proposalId: { type: String, required: true },
  campaignId: { type: String, required: true },
  influencerId: { type: String, required: true },
  brandId: { type: String, required: true },
  terms: { type: String, required: true },
  deliverables: [{
    type: { type: String, required: true },
    description: { type: String, required: true },
    deadline: { type: Date },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date }
  }],
  paymentSchedule: [{
    milestone: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date },
    paid: { type: Boolean, default: false },
    paidAt: { type: Date }
  }],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled', 'disputed'],
    default: 'draft'
  },
  signedAt: { type: Date }
}, {
  timestamps: true
});

contractSchema.index({ proposalId: 1 });
contractSchema.index({ campaignId: 1 });
contractSchema.index({ influencerId: 1 });
contractSchema.index({ brandId: 1 });
contractSchema.index({ status: 1 });
contractSchema.index({ startDate: 1 });
contractSchema.index({ endDate: 1 });

export const PartnershipContract = mongoose.model<IPartnershipContract>('PartnershipContract', contractSchema);