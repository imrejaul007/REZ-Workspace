import mongoose, { Schema, model, Document } from 'mongoose';
import { ICollection, CollectionStatus } from '../types';

export interface CollectionDocument extends Omit<ICollection, '_id'>, Document {}

const collectionSchema = new Schema<CollectionDocument>(
  {
    collectionId: { type: String, required: true, unique: true, index: true },
    merchantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    season: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 2020, max: 2099 },
    description: { type: String, trim: true },
    productIds: [{ type: String, index: true }],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'] as CollectionStatus[],
      lowercase: true,
      default: 'draft',
      index: true,
    },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  {
    timestamps: true,
    indexes: [
      { keys: { merchantId: 1, season: 1, year: 1 }, name: 'idx_merchant_season' },
      { keys: { merchantId: 1, status: 1 }, name: 'idx_merchant_status' },
    ],
  }
);

collectionSchema.pre('save', function (next) {
  if (!this.collectionId) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.collectionId = `COL-${timestamp}-${randomStr}`;
  }
  next();
});

collectionSchema.methods.addProduct = function (productId: string) {
  if (!this.productIds.includes(productId)) {
    this.productIds.push(productId);
  }
  return this.save();
};

collectionSchema.methods.removeProduct = function (productId: string) {
  this.productIds = this.productIds.filter(id => id !== productId);
  return this.save();
};

collectionSchema.statics.findByMerchant = function (merchantId: string, status?: CollectionStatus) {
  const query: Record<string, unknown> = { merchantId };
  if (status) query.status = status;
  return this.find(query).sort({ year: -1, season: 1 });
};

collectionSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Collection = model<CollectionDocument>('Collection', collectionSchema);