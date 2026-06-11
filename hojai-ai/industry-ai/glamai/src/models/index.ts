/**
 * GLAMAI - Salon AI Operating System
 * Production-Ready MongoDB Models
 *
 * Spec Fields:
 * - Customer: name, phone, email, birthday, preferences, loyaltyTier, totalSpent, visits, lastVisit
 * - Appointment: customerId, serviceId, stylistId, date, time, status, notes
 * - Service: name, category, price, duration, isActive
 * - Stylist: name, phone, specialties[], rating, isActive
 * - Payment: appointmentId, amount, method, status
 */

import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// CUSTOMER MODEL
// ============================================

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  birthday?: Date;
  preferences: string[];
  loyaltyTier: LoyaltyTier;
  totalSpent: number;
  visits: number;
  lastVisit?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, sparse: true, lowercase: true, trim: true },
    birthday: { type: Date },
    preferences: [{ type: String }],
    loyaltyTier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze'
    },
    totalSpent: { type: Number, default: 0 },
    visits: { type: Number, default: 0 },
    lastVisit: { type: Date }
  },
  { timestamps: true }
);

CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ loyaltyTier: 1 });
CustomerSchema.index({ lastVisit: -1 });

// ============================================
// SERVICE MODEL
// ============================================

export type ServiceCategory = 'Hair' | 'Skin' | 'Nails' | 'Spa' | 'Massage' | 'Makeup' | 'Other';

export interface IService extends Document {
  name: string;
  category: ServiceCategory;
  price: number;
  duration: number; // in minutes
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      enum: ['Hair', 'Skin', 'Nails', 'Spa', 'Massage', 'Makeup', 'Other'],
      required: true
    },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 1 }, // in minutes
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

ServiceSchema.index({ category: 1 });
ServiceSchema.index({ isActive: 1 });
ServiceSchema.index({ price: 1 });

// ============================================
// STYLIST MODEL
// ============================================

export interface IStylist extends Document {
  name: string;
  phone?: string;
  specialties: string[];
  rating: number; // 0-5
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StylistSchema = new Schema<IStylist>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String },
    specialties: [{ type: String }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

StylistSchema.index({ specialties: 1 });
StylistSchema.index({ isActive: 1 });
StylistSchema.index({ rating: -1 });

// ============================================
// APPOINTMENT MODEL
// ============================================

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';

export interface IAppointment extends Document {
  customerId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  stylistId?: mongoose.Types.ObjectId;
  date: Date;
  time: string; // HH:MM format
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    stylistId: { type: Schema.Types.ObjectId, ref: 'Stylist' },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // HH:MM format
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled'
    },
    notes: { type: String }
  },
  { timestamps: true }
);

AppointmentSchema.index({ customerId: 1 });
AppointmentSchema.index({ serviceId: 1 });
AppointmentSchema.index({ stylistId: 1 });
AppointmentSchema.index({ date: 1 });
AppointmentSchema.index({ status: 1 });

// ============================================
// PAYMENT MODEL
// ============================================

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet' | 'netbanking';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface IPayment extends Document {
  appointmentId?: mongoose.Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet', 'netbanking'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

PaymentSchema.index({ appointmentId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });

// ============================================
// CAMPAIGN MODEL (Additional for Campaign Agent)
// ============================================

export type CampaignType = 'birthday' | 'loyalty' | 'promotion' | 'winback' | 'seasonal' | 'referral';

export interface ICampaign extends Document {
  type: CampaignType;
  subject: string;
  message: string;
  discount: number;
  validFrom: Date;
  validUntil: Date;
  targetSegment: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  sentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    type: {
      type: String,
      enum: ['birthday', 'loyalty', 'promotion', 'winback', 'seasonal', 'referral'],
      required: true
    },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    discount: { type: Number, default: 0 },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    targetSegment: { type: String, default: 'all' },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed'],
      default: 'draft'
    },
    sentCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

CampaignSchema.index({ status: 1 });
CampaignSchema.index({ type: 1 });
CampaignSchema.index({ validUntil: 1 });

// ============================================
// EXPORT ALL MODELS
// ============================================

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
export const Service = mongoose.model<IService>('Service', ServiceSchema);
export const Stylist = mongoose.model<IStylist>('Stylist', StylistSchema);
export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);
export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);

// Model mapping for easy access
export const Models = {
  Customer,
  Service,
  Stylist,
  Appointment,
  Payment,
  Campaign
};

export default Models;