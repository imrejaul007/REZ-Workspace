import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  bookingId: string;
  confirmationCode: string;
  guestId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  hotelId: string;
  hotelName: string;
  roomId: string;
  roomType: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  adults: number;
  children: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingId: { type: String, required: true, unique: true, index: true },
    confirmationCode: { type: String, required: true, unique: true },
    guestId: { type: String, index: true },
    guestName: { type: String, required: true },
    guestEmail: { type: String, required: true },
    guestPhone: { type: String, required: true },
    hotelId: { type: String, required: true, index: true },
    hotelName: { type: String, required: true },
    roomId: { type: String, required: true, index: true },
    roomType: { type: String, required: true },
    checkIn: { type: Date, required: true, index: true },
    checkOut: { type: Date, required: true, index: true },
    nights: { type: Number, required: true },
    adults: { type: Number, required: true, default: 1 },
    children: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending',
    },
    specialRequests: { type: String },
  },
  { timestamps: true }
);

// Compound indexes for common queries
BookingSchema.index({ hotelId: 1, checkIn: 1, checkOut: 1 });
BookingSchema.index({ guestPhone: 1, hotelId: 1 });
BookingSchema.index({ status: 1, createdAt: -1 });
BookingSchema.index({ guestEmail: 1, hotelId: 1 });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
