import mongoose from 'mongoose';

const discountRuleSchema = new mongoose.Schema(
  {
    merchantId: { type: String, required: true, index: true },
    storeId: { type: String, default: null, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['percentage', 'fixed_amount'], required: true },
    value: { type: Number, required: true, min: 0 },
    minSpend: { type: Number, default: null },
    maxDiscount: { type: Number, default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    // Legacy field names kept for backward compat with existing route code
    validFrom: { type: Date, default: null },
    validTo: { type: Date, default: null },
    isActive: { type: Boolean, default: true, index: true },
    usageCount: { type: Number, default: 0 },
    maxUsage: { type: Number, default: null },
  },
  { timestamps: true }
);

discountRuleSchema.index({ merchantId: 1, storeId: 1 });
discountRuleSchema.index({ merchantId: 1, isActive: 1 });

export const DiscountRule =
  mongoose.models.DiscountRule ||
  mongoose.model('DiscountRule', discountRuleSchema, 'discountrules');
