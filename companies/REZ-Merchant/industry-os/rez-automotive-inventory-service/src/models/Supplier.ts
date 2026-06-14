import mongoose, { Schema, Document } from 'mongoose';
import { Supplier as ISupplier } from '../types';

export interface SupplierDocument extends Omit<ISupplier, '_id'>, Document {}

const SupplierSchema = new Schema<SupplierDocument>(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    address: { type: String },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

SupplierSchema.index({ name: 'text' });

export const SupplierModel = mongoose.model<SupplierDocument>('Supplier', SupplierSchema);
