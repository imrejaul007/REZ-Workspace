/**
 * Booking Model
 *
 * Represents a hotel room booking
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IBooking } from '../types';

export interface IBookingDocument extends IBooking, Document {}

const BookingSchema = new Schema<IBookingDocument>({
  bookingId: { type: String, required: true, unique: true, index: true },
  hotelId: { type: String, required: true, index: true },
  guestId: { type: String, required: true, index: true },
  roomId: { type: String, required: true, index: true },
  roomNumber: { type: String, required: true },
  checkIn: { type: Date, required: true, index: true },
  checkOut: { type: Date, required: true, index: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'],
    default: 'pending',
    index: true,
  },
  totalAmount: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'INR' },
  source: {
    type: String,
    enum: ['direct', 'booking.com', 'expedia', 'agoda', 'makemytrip', 'goibibo', 'phone', 'walkin'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded', 'failed'],
    default: 'pending',
    index: true,
  },
  numGuests: { type: Number, required: true, min: 1 },
  specialRequests: { type: String },
}, {
  timestamps: true,
  collection: 'hotel_bookings',
});

// Compound indexes for common queries
BookingSchema.index({ hotelId: 1, checkIn: 1, checkOut: 1 });
BookingSchema.index({ hotelId: 1, status: 1 });
BookingSchema.index({ guestId: 1, checkIn: 1 });
BookingSchema.index({ roomId: 1, checkIn: 1, checkOut: 1 });
BookingSchema.index({ source: 1, status: 1 });
BookingSchema.index({ paymentStatus: 1, totalAmount: 1 });

// TTL index for old cancelled bookings (optional cleanup)
BookingSchema.index({ status: 1, updatedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 days for cancelled

export const Booking = mongoose.model<IBookingDocument>('Booking', BookingSchema);
