import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICustomer extends Document {
  customerId: string;
  name: string;
  phone: string;
  email: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  preferences: {
    categories: string[];
    communicationChannel: 'sms' | 'email' | 'whatsapp';
  };
  segment: 'vip' | 'regular' | 'new' | 'at_risk' | 'inactive';
  lifetimeValue: number;
  acquisitionSource: string;
  storeId?: Types.ObjectId;
  tags: string[];
  isActive: boolean;
  lastPurchaseDate?: Date;
  totalPurchases: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    customerId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    preferences: {
      categories: { type: [String], default: [] },
      communicationChannel: {
        type: String,
        enum: ['sms', 'email', 'whatsapp'],
        default: 'sms',
      },
    },
    segment: {
      type: String,
      enum: ['vip', 'regular', 'new', 'at_risk', 'inactive'],
      default: 'new',
      index: true,
    },
    lifetimeValue: {
      type: Number,
      default: 0,
    },
    acquisitionSource: {
      type: String,
      default: 'in_store',
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastPurchaseDate: Date,
    totalPurchases: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CustomerSchema.index({ customerId: 1 }, { unique: true });
CustomerSchema.index({ phone: 1 }, { unique: true });
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ segment: 1, isActive: 1 });
CustomerSchema.index({ storeId: 1 });
CustomerSchema.index({ lifetimeValue: -1 });
CustomerSchema.index({ 'preferences.categories': 1 });

CustomerSchema.set('toJSON', { virtuals: true });
CustomerSchema.set('toObject', { virtuals: true });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
export default Customer;