import mongoose, { Document, Schema } from 'mongoose';

export interface IBilling extends Document {
  billingId: string;
  userId: string;
  companyId: string;
  planId: string;
  planName: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  startDate: Date;
  nextBillingDate: Date;
  endDate?: Date;
  paymentMethod?: string;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BillingSchema = new Schema<IBilling>(
  {
    billingId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    planId: { type: String, required: true, index: true },
    planName: { type: String, required: true },
    status: { type: String, enum: ['active', 'paused', 'cancelled', 'expired'], default: 'active' },
    billingCycle: { type: String, enum: ['monthly', 'quarterly', 'yearly'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    startDate: { type: Date, default: Date.now },
    nextBillingDate: { type: Date, required: true },
    endDate: { type: Date },
    paymentMethod: { type: String },
    autoRenew: { type: Boolean, default: true }
  },
  { timestamps: true }
);

BillingSchema.index({ userId: 1, status: 1 });
BillingSchema.index({ companyId: 1, status: 1 });
BillingSchema.index({ nextBillingDate: 1, status: 1 });

export const Billing = mongoose.model<IBilling>('Billing', BillingSchema);