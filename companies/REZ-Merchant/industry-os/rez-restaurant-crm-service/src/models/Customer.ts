import mongoose, { Schema, Document } from 'mongoose';
import { SegmentType } from '../config/constants';

export interface ICustomerPreferences {
  dietaryRestrictions: string[];
  favoriteCuisines: string[];
  preferredSeating: string;
  preferredPaymentMethod: string;
  notificationsEnabled: {
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
  };
}

export interface ICustomer extends Document {
  customerId: string;
  phone: string;
  email?: string;
  name: string;
  dateOfBirth?: Date;
  anniversary?: Date;
  segment: SegmentType;
  preferences: ICustomerPreferences;
  loyaltyPoints: number;
  lifetimeValue: number; // in cents
  totalVisits: number;
  totalSpend: number; // in cents
  lastVisitAt?: Date;
  firstVisitAt?: Date;
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerPreferencesSchema = new Schema<ICustomerPreferences>(
  {
    dietaryRestrictions: { type: [String], default: [] },
    favoriteCuisines: { type: [String], default: [] },
    preferredSeating: { type: String, default: 'unknown' },
    preferredPaymentMethod: { type: String, default: 'cash' },
    notificationsEnabled: {
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: true },
    },
  },
  { _id: false }
);

const CustomerSchema = new Schema<ICustomer>(
  {
    customerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      sparse: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
    },
    anniversary: {
      type: Date,
    },
    segment: {
      type: String,
      enum: ['VIP', 'REGULAR', 'LAPSED', 'NEW'],
      default: 'NEW',
    },
    preferences: {
      type: CustomerPreferencesSchema,
      default: () => ({}),
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimeValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalVisits: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpend: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastVisitAt: {
      type: Date,
    },
    firstVisitAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for segmentation queries
CustomerSchema.index({ segment: 1, isActive: 1 });
CustomerSchema.index({ dateOfBirth: 1 });
CustomerSchema.index({ anniversary: 1 });
CustomerSchema.index({ lifetimeValue: -1 });
CustomerSchema.index({ lastVisitAt: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
