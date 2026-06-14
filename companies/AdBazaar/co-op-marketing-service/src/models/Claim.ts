import mongoose, { Schema, Document } from 'mongoose';

export type ClaimStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'paid';

export interface IClaim extends Document {
  claimId: string;
  fundId: string;
  advertiserId: string;
  partnerId: string;
  status: ClaimStatus;
  claimAmount: number;
  currency: string;
  eligibleAmount: number;
  contributionAmount: number;
  campaign: {
    campaignId: string;
    name: string;
    spend: number;
    startDate: Date;
    endDate: Date;
  };
  claimDetails: {
    invoices: Array<{
      invoiceId: string;
      amount: number;
      date: Date;
      verified: boolean;
    }>;
    totalSpend: number;
    eligibleSpend: number;
    documentation: string[];
  };
  review: {
    reviewedBy?: string;
    reviewedAt?: Date;
    notes?: string;
    rejectionReason?: string;
  };
  payment: {
    payoutId?: string;
    paidAt?: Date;
    paidAmount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ClaimSchema = new Schema<IClaim>(
  {
    claimId: { type: String, required: true, unique: true, index: true },
    fundId: { type: String, required: true, index: true },
    advertiserId: { type: String, required: true, index: true },
    partnerId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'paid'],
      default: 'pending',
      index: true,
    },
    claimAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    eligibleAmount: { type: Number, required: true, min: 0 },
    contributionAmount: { type: Number, required: true, min: 0 },
    campaign: {
      campaignId: { type: String, required: true },
      name: { type: String, required: true },
      spend: { type: Number, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    claimDetails: {
      invoices: [{
        invoiceId: { type: String, required: true },
        amount: { type: Number, required: true },
        date: { type: Date, required: true },
        verified: { type: Boolean, default: false },
      }],
      totalSpend: { type: Number, required: true },
      eligibleSpend: { type: Number, required: true },
      documentation: [{ type: String }],
    },
    review: {
      reviewedBy: { type: String },
      reviewedAt: { type: Date },
      notes: { type: String },
      rejectionReason: { type: String },
    },
    payment: {
      payoutId: { type: String },
      paidAt: { type: Date },
      paidAmount: { type: Number },
    },
  },
  { timestamps: true }
);

ClaimSchema.index({ fundId: 1, status: 1 });
ClaimSchema.index({ partnerId: 1, status: 1 });
ClaimSchema.index({ advertiserId: 1, status: 1 });

export const Claim = mongoose.model<IClaim>('Claim', ClaimSchema);