import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    storeId: { type: Schema.Types.Mixed },
    name: { type: String },
    description: { type: String },
    productIds: { type: [Schema.Types.Mixed] },
    categoryIds: { type: [Schema.Types.Mixed] },
    type: { type: String },
    adjustmentType: { type: String },
    adjustmentValue: { type: Number },
    conditions: { type: Schema.Types.Mixed },
    schedule: { type: Schema.Types.Mixed },
    startDate: { type: Date },
    endDate: { type: Date },
    priority: { type: Number },
    isActive: { type: Boolean, default: true },
    minPrice: { type: Number },
    maxPrice: { type: Number },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1, storeId: 1 });
export const DynamicPricingRule = mongoose.models.DynamicPricingRule || mongoose.model('DynamicPricingRule', s, 'dynamicpricingrules');
