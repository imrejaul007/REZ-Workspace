import mongoose, { Schema, Document } from 'mongoose';

export interface ISpaBooking extends Document {
  bookingId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  merchantId: string;
  serviceId: string;
  serviceName: string;
  therapistId?: string;
  therapistName?: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SpaBookingSchema = new Schema<ISpaBooking>(
  {
    bookingId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String },
    merchantId: { type: String, required: true, index: true },
    serviceId: { type: String, required: true, index: true },
    serviceName: { type: String, required: true },
    therapistId: { type: String },
    therapistName: { type: String },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    paymentMethod: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

SpaBookingSchema.index({ merchantId: 1, date: 1 });
SpaBookingSchema.index({ customerId: 1, date: 1 });
SpaBookingSchema.index({ therapistId: 1, date: 1 });

export const SpaBooking = mongoose.model<ISpaBooking>('SpaBooking', SpaBookingSchema);
