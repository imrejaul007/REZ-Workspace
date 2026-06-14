import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
    name: { type: String },
    description: { type: String },
    price: { type: Number },
    billingCycle: { type: String, enum: ['monthly', 'quarterly', 'yearly', 'lifetime'] },
    features: { type: [String] },
    isActive: { type: Boolean, default: true },
    maxMembers: { type: Number },
    trialDays: { type: Number },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1 });
s.index({ merchantId: 1, isActive: 1 });
s.index({ merchantId: 1, billingCycle: 1 });
export const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', s, 'subscriptions');
