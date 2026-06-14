import mongoose, { Schema, Document } from 'mongoose';

export type PaymentTerms = 'prepaid' | 'cod' | 'net15' | 'net30' | 'net60';

export interface ISupplier extends Document {
  supplierId: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentTerms: PaymentTerms;
  creditLimit: number;
  currentBalance: number;
  leadTimeDays: number;
  rating: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    supplierId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, default: 'USA' }
    },
    paymentTerms: {
      type: String,
      enum: ['prepaid', 'cod', 'net15', 'net30', 'net60'],
      default: 'net30'
    },
    creditLimit: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    leadTimeDays: { type: Number, default: 7 },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    notes: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

SupplierSchema.index({ name: 'text', contactPerson: 'text' });
SupplierSchema.index({ isActive: 1 });

export const Supplier = mongoose.model<ISupplier>('Supplier', SupplierSchema);
