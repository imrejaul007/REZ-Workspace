/**
 * Vendor MongoDB Model
 */
import mongoose, { Schema, Document } from 'mongoose';
import { Vendor } from '../types';

export interface IVendor extends Omit<Vendor, '_id'>, Document {}

const AddressSchema = new Schema({
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: 'India' },
}, { _id: false });

const BankDetailsSchema = new Schema({
  accountName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  bankName: { type: String, required: true },
  ifscCode: { type: String, required: true },
  branchName: { type: String },
}, { _id: false });

const VendorSchema = new Schema<IVendor>({
  vendorId: { type: String, required: true, unique: true, index: true },
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  gstin: { type: String, uppercase: true, trim: true },
  pan: { type: String, uppercase: true, trim: true },
  address: { type: AddressSchema },
  bankDetails: { type: BankDetailsSchema },
  paymentTerms: {
    type: String,
    enum: ['immediate', 'net15', 'net30', 'net45', 'net60', 'custom'],
    default: 'net30'
  },
  customPaymentDays: { type: Number, min: 0, max: 365 },
  creditLimit: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  category: { type: String, trim: true },
  notes: { type: String },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
}, {
  timestamps: true,
  collection: 'vendors'
});

// Compound index for tenant + vendor lookup
VendorSchema.index({ tenantId: 1, vendorId: 1 }, { unique: true });
VendorSchema.index({ tenantId: 1, status: 1 });
VendorSchema.index({ tenantId: 1, name: 'text' });

export const VendorModel = mongoose.model<IVendor>('Vendor', VendorSchema);
