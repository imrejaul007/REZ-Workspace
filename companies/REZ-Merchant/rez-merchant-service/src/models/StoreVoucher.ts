import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    storeId: { type: Schema.Types.Mixed },
    name: { type: String },
    code: { type: String },
    description: { type: String },
    type: { type: String },
    value: { type: Number },
    minOrderAmount: { type: Number },
    maxDiscount: { type: Number },
    validFrom: { type: Date },
    validTo: { type: Date },
    usageLimit: { type: Number },
    usageCount: { type: Number, default: 0 },
    status: { type: String },
    isActive: { type: Boolean },
    conditions: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1, storeId: 1 });
export const StoreVoucher = mongoose.models.StoreVoucher || mongoose.model('StoreVoucher', s, 'storevouchers');
