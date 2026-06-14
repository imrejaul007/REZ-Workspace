import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceType extends Document {
  name: string;
  description: string;
  basePrice: number;
  priceUnit: 'piece' | 'kg' | 'flat';
  category: 'wash' | 'dry-clean' | 'press' | 'special';
  turnaroundHours: number;
  expressSurcharge: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceTypeSchema = new Schema<IServiceType>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    basePrice: { type: Number, required: true },
    priceUnit: { type: String, enum: ['piece', 'kg', 'flat'], required: true },
    category: {
      type: String,
      enum: ['wash', 'dry-clean', 'press', 'special'],
      required: true,
      index: true,
    },
    turnaroundHours: { type: Number, required: true },
    expressSurcharge: { type: Number, default: 1.5 },
    currency: { type: String, default: 'INR' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ServiceTypeSchema.index({ category: 1, isActive: 1 });

export const ServiceType = mongoose.model<IServiceType>('ServiceType', ServiceTypeSchema);