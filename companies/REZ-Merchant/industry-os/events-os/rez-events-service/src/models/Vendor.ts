import mongoose, { Document, Schema } from 'mongoose';

export enum VendorCategory {
  CATERING = 'CATERING',
  DECOR = 'DECOR',
  FLORIST = 'FLORIST',
  PHOTOGRAPHY = 'PHOTOGRAPHY',
  LIGHTING = 'LIGHTING',
  MUSIC = 'MUSIC',
  TRANSPORTATION = 'TRANSPORTATION',
  OTHER = 'OTHER'
}

export enum VendorStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  CONTRACTED = 'CONTRACTED'
}

export enum PriceRange {
  BUDGET = 'BUDGET',
  MEDIUM = 'MEDIUM',
  PREMIUM = 'PREMIUM',
  LUXURY = 'LUXURY'
}

export interface IVendor extends Document {
  vendorId: string;
  merchantId: string;
  eventId?: string;
  name: string;
  category: VendorCategory;
  phone?: string;
  email?: string;
  address?: string;
  rating: number;
  priceRange: PriceRange;
  status: VendorStatus;
  notes?: string;
  createdAt: Date;
}

const VendorSchema = new Schema<IVendor>({
  vendorId: { type: String, required: true, unique: true, index: true },
  merchantId: { type: String, required: true, index: true },
  eventId: { type: String, index: true },
  name: { type: String, required: true },
  category: { type: String, enum: VendorCategory, required: true, index: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  priceRange: { type: String, enum: PriceRange, default: PriceRange.MEDIUM },
  status: { type: String, enum: VendorStatus, default: VendorStatus.AVAILABLE, index: true },
  notes: { type: String }
}, {
  timestamps: true,
  collection: 'vendors'
});

// Compound indexes for common queries
VendorSchema.index({ merchantId: 1, category: 1 });
VendorSchema.index({ merchantId: 1, status: 1 });
VendorSchema.index({ eventId: 1 });
VendorSchema.index({ name: 'text', category: 'text' });

// Virtual for is available
VendorSchema.virtual('isAvailable').get(function() {
  return this.status === VendorStatus.AVAILABLE;
});

export const Vendor = mongoose.model<IVendor>('Vendor', VendorSchema);