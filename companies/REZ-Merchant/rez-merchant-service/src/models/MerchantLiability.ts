import mongoose, { Schema } from 'mongoose';

// Shared collection: merchantliabilities is owned by rez-wallet-service.
// Merchant service reads it for settlement dashboards and raises disputes via liability.ts.
const schema = new Schema(
  {
    merchant: { type: Schema.Types.Mixed, required: true },
    cycleId: { type: String },
    status: { type: String },
    rewardIssued: { type: Number },
    rewardRedeemed: { type: Number },
    pendingAmount: { type: Number },
    settledAmount: { type: Number },
    settlementDate: { type: Schema.Types.Mixed },
    settlementTransactionId: { type: String },
  },
  { strict: true, strictQuery: true, timestamps: true, collection: 'merchantliabilities' },
);
schema.index({ merchant: 1, status: 1 });
schema.index({ merchant: 1, cycleId: 1 });

export const MerchantLiability = mongoose.models.MerchantLiability || mongoose.model('MerchantLiability', schema);
