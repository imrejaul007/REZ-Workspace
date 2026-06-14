import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INexTabizzBusiness extends Document {
  name: string;
  ownerId: Types.ObjectId;
  businessType: string;
  category: string;
  gstin: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  services: {
    name: string;
    description: string;
    price: number;
    duration: number;
    available: boolean;
  }[];
  subscription: {
    plan: 'basic' | 'standard' | 'premium';
    startDate: Date;
    endDate: Date;
    autoRenew: boolean;
  };
  status: 'active' | 'inactive' | 'suspended';
  rating?: number;
  totalBookings: number;
  totalRevenue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface INexTabizzBooking extends Document {
  businessId: Types.ObjectId;
  customerId: Types.ObjectId;
  serviceId: Types.ObjectId;
  date: Date;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  amount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INexTabizzCustomer extends Document {
  phone: string;
  name: string;
  email?: string;
  bookings: Types.ObjectId[];
  totalSpent: number;
  visitCount: number;
  lastVisit?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NexTabizzBusinessSchema = new Schema({
  name: { type: String, required: true, index: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  businessType: { type: String, required: true },
  category: { type: String, required: true, index: true },
  gstin: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: {
    street: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: String,
  },
  services: [{
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    duration: { type: Number, required: true },
    available: { type: Boolean, default: true },
  }],
  subscription: {
    plan: { type: String, enum: ['basic', 'standard', 'premium'], default: 'basic' },
    startDate: Date,
    endDate: Date,
    autoRenew: { type: Boolean, default: false },
  },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  rating: Number,
  totalBookings: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
}, { timestamps: true });

const NexTabizzBookingSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'NexTabizzBusiness', required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'NexTabizzCustomer', required: true },
  serviceId: { type: String, required: true },
  date: { type: Date, required: true, index: true },
  time: { type: String, required: true },
  duration: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'pending',
    index: true
  },
  amount: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  notes: String,
}, { timestamps: true });

NexTabizzBookingSchema.index({ businessId: 1, date: 1, status: 1 });

const NexTabizzCustomerSchema = new Schema({
  phone: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: String,
  bookings: [{ type: Schema.Types.ObjectId, ref: 'NexTabizzBooking' }],
  totalSpent: { type: Number, default: 0 },
  visitCount: { type: Number, default: 0 },
  lastVisit: Date,
}, { timestamps: true });

export const NexTabizzBusiness = mongoose.models.NexTabizzBusiness || mongoose.model<INexTabizzBusiness>('NexTabizzBusiness', NexTabizzBusinessSchema);
export const NexTabizzBooking = mongoose.models.NexTabizzBooking || mongoose.model<INexTabizzBooking>('NexTabizzBooking', NexTabizzBookingSchema);
export const NexTabizzCustomer = mongoose.models.NexTabizzCustomer || mongoose.model<INexTabizzCustomer>('NexTabizzCustomer', NexTabizzCustomerSchema);
