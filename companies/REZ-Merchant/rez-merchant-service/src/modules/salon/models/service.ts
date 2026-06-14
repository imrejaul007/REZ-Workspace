/**
 * Salon Service Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISalonService extends Document {
  storeId: Types.ObjectId;
  name: string;
  description?: string;
  category: string;
  duration: number; // minutes
  price: number;
  cost: number;
  commissionPercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SalonServiceSchema = new Schema({
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  duration: { type: Number, required: true },
  price: { type: Number, required: true },
  cost: { type: Number, default: 0 },
  commissionPercent: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const SalonService = mongoose.model<ISalonService>('SalonService', SalonServiceSchema);
