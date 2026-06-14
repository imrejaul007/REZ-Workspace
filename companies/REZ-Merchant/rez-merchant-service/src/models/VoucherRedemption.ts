import mongoose, { Schema } from 'mongoose';

// Shared collection: voucherredemptions is primarily written by rez-backend/user app.
// Merchant service reads it for voucher analytics via voucherRedemptions.ts.
const s = new Schema(
  {
    storeId: { type: Schema.Types.Mixed, required: true },
    userId: { type: Schema.Types.Mixed },
    voucherId: { type: Schema.Types.Mixed },
    voucherCode: { type: String },
    discountAmount: { type: Number },
    orderAmount: { type: Number },
    status: { type: String },
    redeemedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ storeId: 1, createdAt: -1 });
s.index({ userId: 1, createdAt: -1 });
s.index({ voucherCode: 1 });
export const VoucherRedemption = mongoose.models.VoucherRedemption || mongoose.model('VoucherRedemption', s, 'voucherredemptions');
