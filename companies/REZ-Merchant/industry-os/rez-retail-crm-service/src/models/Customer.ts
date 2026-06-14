import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { LoyaltyTier } from '../types';

export interface ICustomerPreferences {
  newsletter: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  preferredContact: 'email' | 'sms' | 'phone' | 'whatsapp';
  language: string;
  currency: string;
}

export interface IAddress {
  id: string;
  type: 'billing' | 'shipping' | 'both';
  name: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface IPurchaseHistoryEntry {
  id: string;
  orderId: string;
  date: Date;
  total: number;
  items: number;
  pointsEarned: number;
  status: 'completed' | 'refunded' | 'partial_refund';
}

export interface ICustomer {
  id: string;
  userId?: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  avatar?: string;
  loyaltyTier: LoyaltyTier;
  loyaltyPoints: number;
  totalSpent: number;
  totalOrders: number;
  averageOrderValue: number;
  purchaseHistory: IPurchaseHistoryEntry[];
  preferences: ICustomerPreferences;
  addresses: IAddress[];
  tags: string[];
  notes?: string;
  isActive: boolean;
  isVerified: boolean;
  lastPurchaseDate?: Date;
  firstPurchaseDate?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerDocument extends Omit<ICustomer, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const AddressSchema = new Schema<IAddress>({
  id: { type: String, default: () => uuidv4() },
  type: { type: String, enum: ['billing', 'shipping', 'both'], default: 'both' },
  name: { type: String, required: true },
  phone: { type: String },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false },
}, { _id: false });

const PurchaseHistorySchema = new Schema<IPurchaseHistoryEntry>({
  id: { type: String, default: () => uuidv4() },
  orderId: { type: String, required: true },
  date: { type: Date, default: Date.now },
  total: { type: Number, required: true, min: 0 },
  items: { type: Number, required: true, min: 1 },
  pointsEarned: { type: Number, default: 0 },
  status: { type: String, enum: ['completed', 'refunded', 'partial_refund'], default: 'completed' },
}, { _id: false });

const CustomerPreferencesSchema = new Schema<ICustomerPreferences>({
  newsletter: { type: Boolean, default: true },
  smsNotifications: { type: Boolean, default: false },
  pushNotifications: { type: Boolean, default: true },
  preferredContact: {
    type: String,
    enum: ['email', 'sms', 'phone', 'whatsapp'],
    default: 'email'
  },
  language: { type: String, default: 'en' },
  currency: { type: String, default: 'INR' },
}, { _id: false });

const CustomerSchema = new Schema<ICustomerDocument>({
  id: { type: String, default: () => uuidv4(), unique: true, index: true },
  userId: { type: String, index: true },
  email: { type: String, index: true },
  phone: { type: String, index: true },
  firstName: { type: String, required: true, maxlength: 100 },
  lastName: { type: String, maxlength: 100 },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
  avatar: { type: String },
  loyaltyTier: {
    type: String,
    enum: Object.values(LoyaltyTier),
    default: LoyaltyTier.BRONZE
  },
  loyaltyPoints: { type: Number, default: 0, min: 0 },
  totalSpent: { type: Number, default: 0, min: 0 },
  totalOrders: { type: Number, default: 0, min: 0 },
  averageOrderValue: { type: Number, default: 0, min: 0 },
  purchaseHistory: [PurchaseHistorySchema],
  preferences: { type: CustomerPreferencesSchema, default: () => ({}) },
  addresses: [AddressSchema],
  tags: [{ type: String }],
  notes: { type: String, maxlength: 1000 },
  isActive: { type: Boolean, default: true, index: true },
  isVerified: { type: Boolean, default: false },
  lastPurchaseDate: { type: Date },
  firstPurchaseDate: { type: Date },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
}, {
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes
CustomerSchema.index({ firstName: 'text', lastName: 'text', email: 'text', phone: 'text' });
CustomerSchema.index({ loyaltyTier: 1, isActive: 1 });
CustomerSchema.index({ totalSpent: -1 });
CustomerSchema.index({ createdAt: -1 });
CustomerSchema.index({ lastPurchaseDate: -1 });
CustomerSchema.index({ tags: 1 });

// Pre-save to update average order value
CustomerSchema.pre('save', function (next) {
  if (this.totalOrders > 0) {
    this.averageOrderValue = this.totalSpent / this.totalOrders;
  }
  next();
});

export const Customer = mongoose.model<ICustomerDocument>('Customer', CustomerSchema);

export default Customer;
