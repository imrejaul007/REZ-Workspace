import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    // CRIT-11 FIX: Replace Schema.Types.Mixed with proper ObjectId types
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
    name: { type: String },
    description: { type: String },
    // CRIT-11 FIX: Add enum for type field
    type: { type: String, enum: ['percentage', 'fixed_amount', 'bogo', 'tiered'] },
    // CRIT-11 FIX: Add validator that value > 0
    value: { type: Number, validate: { validator: (v: number) => v > 0, message: 'Discount value must be greater than 0' } },
    code: { type: String },
    minOrderAmount: { type: Number, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    // CRIT-11 FIX: Add validator that endDate >= startDate
    startDate: { type: Date },
    endDate: {
      type: Date,
      validate: {
        validator: function (this, v: Date) {
          return !this.startDate || !v || v >= this.startDate;
        },
        message: 'End date must be greater than or equal to start date',
      },
    },
    usageLimit: { type: Number, min: 0 },
    perUserLimit: { type: Number, min: 0 },
    // CRIT-11 FIX: Replace with ObjectId array
    applicableTo: { type: String, enum: ['all_products', 'specific_products', 'specific_categories'] },
    productIds: { type: [Schema.Types.ObjectId], ref: 'Product' },
    categoryIds: { type: [String] },
    // CRIT-11 FIX: Add enum for status field
    status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' },
    isActive: { type: Boolean, default: true },
    conditions: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1, storeId: 1 });
s.index({ merchantId: 1, code: 1 }, { unique: true, sparse: true });
export const Discount = mongoose.models.Discount || mongoose.model('Discount', s, 'discounts');
