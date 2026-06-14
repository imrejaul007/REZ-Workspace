/**
 * Service Model - Salon services/categories
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
  serviceId: string;
  salonId: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  discountedPrice?: number;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>({
  serviceId: { type: String, required: true, unique: true, index: true },
  salonId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true, index: true },
  duration: { type: Number, required: true },
  price: { type: Number, required: true },
  discountedPrice: Number,
  image: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

ServiceSchema.index({ salonId: 1, category: 1, isActive: 1 });

export const Service = mongoose.model<IService>('Service', ServiceSchema);
