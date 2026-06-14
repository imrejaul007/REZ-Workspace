import mongoose, { Schema } from 'mongoose';

// Shared collection: merchantwallets is also managed by rez-wallet-service.
// Merchant service creates/reads wallet and requests withdrawals via walletMerchant.ts.
//
// H6-FIX: Removed duplicate `merchantId` field (Schema.Types.Mixed). All
// callers in walletMerchant.ts have been updated to use `merchant` so the
// unique index on `merchant` (owned by wallet-service) fires correctly and
// prevents duplicate wallet documents.
const s = new Schema(
  {
    merchant: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    balance: {
      available: { type: Number, default: 0, min: 0 },
      pending: { type: Number, default: 0, min: 0 },
      total: { type: Number, default: 0, min: 0 },
    },
    bankDetails: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
// Non-unique index here; the authoritative unique index lives in rez-wallet-service.
s.index({ merchant: 1 }, { unique: true });
export const MerchantWallet = mongoose.models.MerchantWallet || mongoose.model('MerchantWallet', s, 'merchantwallets');
