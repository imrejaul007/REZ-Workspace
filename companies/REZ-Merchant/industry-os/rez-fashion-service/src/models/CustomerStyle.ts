import mongoose, { Schema, model, Document } from 'mongoose';
import { ICustomerStyle, ProductCategory } from '../types';

export interface CustomerStyleDocument extends Omit<ICustomerStyle, '_id'>, Document {}

const sizePreferencesSchema = new Schema({
  XS: Number, S: Number, M: Number, L: Number, XL: Number, XXL: Number,
  '28': Number, '30': Number, '32': Number, '34': Number, '36': Number, '38': Number,
}, { _id: false });

const customerStyleSchema = new Schema<CustomerStyleDocument>(
  {
    styleId: { type: String, required: true, unique: true, index: true },
    merchantId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    bodyType: { type: String, trim: true },
    stylePreferences: [{ type: String, trim: true }],
    favoriteCategories: [{
      type: String,
      enum: ['tops', 'bottoms', 'dresses', 'ethnic', 'western', 'accessories', 'footwear'] as ProductCategory[],
    }],
    sizePreferences: { type: sizePreferencesSchema, default: {} },
    occasionPreferences: [{ type: String, trim: true }],
    colorPreferences: [{ type: String, trim: true }],
    budgetRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 10000 },
    },
    lastPurchase: { type: Date },
    styleScore: { type: Number, min: 0, max: 100, default: 50 },
  },
  {
    timestamps: true,
    indexes: [
      { keys: { merchantId: 1, customerId: 1 }, name: 'idx_merchant_customer', unique: true },
      { keys: { styleScore: -1 }, name: 'idx_style_score' },
    ],
  }
);

customerStyleSchema.pre('save', function (next) {
  if (!this.styleId) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.styleId = `STY-${timestamp}-${randomStr}`;
  }
  // Recalculate style score based on profile completeness
  let completeness = 0;
  if (this.bodyType) completeness += 15;
  if (this.stylePreferences.length > 0) completeness += 20;
  if (this.favoriteCategories.length > 0) completeness += 20;
  if (Object.keys(this.sizePreferences).length > 0) completeness += 15;
  if (this.occasionPreferences.length > 0) completeness += 15;
  if (this.colorPreferences.length > 0) completeness += 15;
  this.styleScore = completeness;
  next();
});

customerStyleSchema.methods.updatePreferences = function (updates: Partial<ICustomerStyle>) {
  Object.assign(this, updates);
  return this.save();
};

customerStyleSchema.statics.findByCustomer = function (customerId: string, merchantId?: string) {
  const query: Record<string, unknown> = { customerId };
  if (merchantId) query.merchantId = merchantId;
  return this.findOne(query);
};

customerStyleSchema.statics.findBySegment = function (merchantId: string, segment: string) {
  // Segment by style preferences
  return this.find({ merchantId, stylePreferences: { $in: [segment] } });
};

customerStyleSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const CustomerStyle = model<CustomerStyleDocument>('CustomerStyle', customerStyleSchema);