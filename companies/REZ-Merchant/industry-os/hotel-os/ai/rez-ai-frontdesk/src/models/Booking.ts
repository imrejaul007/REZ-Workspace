/**
 * Booking Model for AI Front Desk Service
 */

import mongoose, { Document, Schema } from 'mongoose';

export type BookingStatusEnum = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export interface IBooking extends Document {
  guestId?: string;
  roomType: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalAmount: number;
  status: BookingStatusEnum;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    guestId: { type: String, trim: true },
    roomType: { type: String, default: 'Standard', trim: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, default: 1, min: 1 },
    totalAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['confirmed', 'checked_in', 'checked_out', 'cancelled'],
      default: 'confirmed',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
BookingSchema.index({ checkIn: 1, checkOut: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ guestId: 1 });
BookingSchema.index({ createdAt: -1 });

export const Booking = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;