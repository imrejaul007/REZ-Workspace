import mongoose, { Schema, Document } from 'mongoose';
import { Batch as IBatch } from '../types';

export interface BatchDocument extends Omit<IBatch, '_id'>, Document {}

const BatchSchema = new Schema<BatchDocument>(
  {
    batchNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    medicineId: { type: String, required: true, index: true },
    medicineName: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    manufactureDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true, index: true },
    supplierId: { type: String },
    status: { type: String, enum: ['active', 'expired', 'recalled'], default: 'active', index: true }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => { ret.id = ret._id.toString(); delete ret.__v; return ret; }
    }
  }
);

BatchSchema.index({ medicineId: 1, status: 1 });
BatchSchema.index({ expiryDate: 1 });

BatchSchema.statics.findExpiring = function(days: number = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  return this.find({ expiryDate: { $lte: futureDate }, status: 'active' });
};

BatchSchema.statics.findExpired = function() {
  return this.find({ expiryDate: { $lte: new Date() }, status: 'active' });
};

export const BatchModel = mongoose.model<BatchDocument>('Batch', BatchSchema);
