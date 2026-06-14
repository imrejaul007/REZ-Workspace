import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    storeId: { type: Schema.Types.Mixed },
    amount: { type: Number, required: true },
    bankAccountId: { type: Schema.Types.Mixed },
    notes: { type: String },
    status: { type: String, default: 'pending' },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1, status: 1 });
s.index({ merchantId: 1, createdAt: -1 });
s.index({ status: 1, createdAt: -1 });
export const Payout = mongoose.models.Payout || mongoose.model('Payout', s, 'payouts');
