import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  gstin: string;
  paymentTerms: string;
  rating: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },
    paymentTerms: {
      type: String,
      default: 'NET 30',
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SupplierSchema.index({ code: 1 }, { unique: true });
SupplierSchema.index({ name: 'text' });
SupplierSchema.index({ gstin: 1 });
SupplierSchema.index({ isActive: 1, rating: -1 });

export const Supplier = mongoose.model<ISupplier>('Supplier', SupplierSchema);
export default Supplier;