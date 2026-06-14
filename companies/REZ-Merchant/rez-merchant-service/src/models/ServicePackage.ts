import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceEntry {
  serviceName: string;
  sessions: number;
}

export interface IServicePackage extends Document {
  merchantId: string;
  storeId: string;
  name: string;
  description?: string;
  services: IServiceEntry[];
  price: number;
  validityDays: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServicePackageSchema = new Schema<IServicePackage>(
  {
    merchantId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    services: [{
      serviceName: { type: String, required: true },
      sessions: { type: Number, required: true, min: 1 },
    }],
    price: { type: Number, default: 0 },
    validityDays: { type: Number, default: 365 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound index for store queries
ServicePackageSchema.index({ merchantId: 1, storeId: 1 });

export const ServicePackage = mongoose.model<IServicePackage>('ServicePackage', ServicePackageSchema);
