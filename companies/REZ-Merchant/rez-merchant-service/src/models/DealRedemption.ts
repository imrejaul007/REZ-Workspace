import mongoose, { Schema } from 'mongoose';

// Shared collection: dealredemptions is owned by rez-backend. Merchant service
// reads and updates redemption status (mark used) via dealRedemptions.ts.
const s = new Schema(
  {
    user: { type: Schema.Types.Mixed },
    redemptionCode: { type: String },
    status: { type: String },
    expiresAt: { type: Date },
    usedAt: { type: Date },
    usedByMerchantId: { type: Schema.Types.Mixed },
    usedAtStoreId: { type: Schema.Types.Mixed },
    benefitApplied: { type: Number },
    orderAmount: { type: Number },
    merchantNotes: { type: String },
    dealSnapshot: { type: Schema.Types.Mixed },
    campaignSnapshot: { type: Schema.Types.Mixed },
    isPaid: { type: Boolean },
    purchaseAmount: { type: Number },
    redeemedAt: { type: Date },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ storeId: 1, createdAt: -1 });
export const DealRedemption = mongoose.models.DealRedemption || mongoose.model('DealRedemption', s, 'dealredemptions');
