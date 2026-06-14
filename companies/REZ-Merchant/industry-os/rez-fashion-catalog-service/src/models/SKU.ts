import mongoose, { Schema, Document } from 'mongoose';
import { SKU as ISKU } from '../types';

export interface SKUDocument extends Omit<ISKU, '_id'>, Document {}

const SKUSchema = new Schema<SKUDocument>(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, index: true },
    productId: { type: String, required: true, index: true },
    size: { type: String, required: true },
    color: { type: String, required: true },
    quantity: { type: Number, default: 0, min: 0 },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => { ret.id = ret._id.toString(); delete ret.__v; return ret; }
    }
  }
);

SKUSchema.index({ productId: 1, size: 1, color: 1 }, { unique: true });

export const SKUModel = mongoose.model<SKUDocument>('SKU', SKUSchema);
