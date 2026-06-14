import mongoose, { Schema, Document } from 'mongoose';

export interface ISpaService extends Document {
  serviceId: string;
  name: string;
  description: string;
  category: string;
  duration: number; // minutes
  price: number;
  currency: string;
  merchantId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SpaServiceSchema = new Schema<ISpaService>(
  {
    serviceId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    duration: { type: Number, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    merchantId: { type: String, required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SpaServiceSchema.index({ merchantId: 1, isActive: 1 });
SpaServiceSchema.index({ category: 1, isActive: 1 });

export const SpaService = mongoose.model<ISpaService>('SpaService', SpaServiceSchema);
