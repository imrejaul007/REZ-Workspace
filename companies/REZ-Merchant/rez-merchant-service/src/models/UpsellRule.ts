import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    storeId: { type: Schema.Types.Mixed },
    name: { type: String },
    description: { type: String },
    triggerProductIds: { type: [Schema.Types.Mixed] },
    suggestedProductIds: { type: [Schema.Types.Mixed] },
    triggerCategory: { type: String },
    suggestedCategory: { type: String },
    discountPercent: { type: Number },
    status: { type: String },
    isActive: { type: Boolean },
    conditions: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1, storeId: 1 });
export const UpsellRule = mongoose.models.UpsellRule || mongoose.model('UpsellRule', s, 'upsellrules');
