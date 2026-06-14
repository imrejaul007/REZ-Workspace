import mongoose, { Schema, Document } from 'mongoose';

export interface IPreference {
  preferredServices: string[];
  preferredStylists: string[];
  preferredTimeSlots: string[];
  communicationChannel: 'sms' | 'email' | 'both';
  language: string;
  notificationsEnabled: boolean;
}

export interface IVisitHistory {
  date: Date;
  service: string;
  stylist: string;
  amount: number;
  duration: number;
  rating?: number;
  notes?: string;
}

export interface ICustomer extends Document {
  customerId: string;
  phone: string;
  email?: string;
  name: string;
  dateOfBirth?: Date;
  anniversary?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  preferences: IPreference;
  visitHistory: IVisitHistory[];
  totalSpent: number;
  visitCount: number;
  averageSpend: number;
  lastVisit?: Date;
  daysSinceLastVisit: number;
  customerTier: 'new' | 'regular' | 'vip' | 'at-risk' | 'churned';
  lifetimeValue: number;
  preferredServices: string[];
  acquisitionSource?: string;
  referralCode?: string;
  tags: string[];
  notes?: string;
  isActive: boolean;
  emailVerified: boolean;
  smsOptIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PreferenceSchema = new Schema<IPreference>(
  {
    preferredServices: { type: [String], default: [] },
    preferredStylists: { type: [String], default: [] },
    preferredTimeSlots: { type: [String], default: [] },
    communicationChannel: {
      type: String,
      enum: ['sms', 'email', 'both'],
      default: 'both',
    },
    language: { type: String, default: 'en' },
    notificationsEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const AddressSchema = new Schema(
  {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
  { _id: false }
);

const VisitHistorySchema = new Schema<IVisitHistory>(
  {
    date: { type: Date, required: true },
    service: { type: String, required: true },
    stylist: { type: String, required: true },
    amount: { type: Number, required: true },
    duration: { type: Number, required: true },
    rating: { type: Number, min: 1, max: 5 },
    notes: String,
  },
  { _id: false }
);

const CustomerSchema = new Schema<ICustomer>(
  {
    customerId: { type: String, required: true, unique: true, index: true },
    phone: { type: String, required: true, index: true },
    email: { type: String, sparse: true },
    name: { type: String, required: true },
    dateOfBirth: { type: Date },
    anniversary: { type: Date },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    },
    address: AddressSchema,
    preferences: { type: PreferenceSchema, default: () => ({}) },
    visitHistory: { type: [VisitHistorySchema], default: [] },
    totalSpent: { type: Number, default: 0 },
    visitCount: { type: Number, default: 0 },
    averageSpend: { type: Number, default: 0 },
    lastVisit: { type: Date },
    daysSinceLastVisit: { type: Number, default: 0 },
    customerTier: {
      type: String,
      enum: ['new', 'regular', 'vip', 'at-risk', 'churned'],
      default: 'new',
    },
    lifetimeValue: { type: Number, default: 0 },
    preferredServices: { type: [String], default: [] },
    acquisitionSource: String,
    referralCode: String,
    tags: { type: [String], default: [] },
    notes: String,
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    smsOptIn: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
CustomerSchema.index({ email: 1 }, { sparse: true });
CustomerSchema.index({ 'preferences.preferredServices': 1 });
CustomerSchema.index({ customerTier: 1 });
CustomerSchema.index({ customerTier: 1, lastVisit: -1 });
CustomerSchema.index({ tags: 1 });
CustomerSchema.index({ totalSpent: -1 });
CustomerSchema.index({ lastVisit: -1 });
CustomerSchema.index({ daysSinceLastVisit: 1 });

// Virtual for calculating days since last visit
CustomerSchema.virtual('calculatedDaysSinceLastVisit').get(function () {
  if (!this.lastVisit) return 999;
  const diffTime = Math.abs(Date.now() - this.lastVisit.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
