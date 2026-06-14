/**
 * Booking Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  bookingId: string;
  salonId: string;
  customerId: string;
  serviceId: string;
  stylistId?: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  price: number;
  discount: number;
  finalPrice: number;
  notes?: string;
  cancellationReason?: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>({
  bookingId: { type: String, required: true, unique: true, index: true },
  salonId: { type: String, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  serviceId: { type: String, required: true },
  stylistId: { type: String },
  date: { type: Date, required: true, index: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'pending',
    index: true,
  },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  finalPrice: { type: Number, required: true },
  notes: String,
  cancellationReason: String,
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
  },
}, { timestamps: true });

BookingSchema.index({ salonId: 1, date: 1, status: 1 });
BookingSchema.index({ customerId: 1, date: 1 });
BookingSchema.index({ stylistId: 1, date: 1 });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
