/**
 * Mongoose model for AdBooking
 */

import mongoose, { Document, Schema } from 'mongoose';
import { AdBooking, BookingType, BookingStatus, PaymentStatus } from '../types';

export interface AdBookingDocument extends Omit<AdBooking, 'type' | 'status' | 'payment'>, Document {
  type: BookingType;
  status: BookingStatus;
  payment?: {
    required: boolean;
    amount?: number;
    status?: PaymentStatus;
    transactionId?: string;
  };
}

const BookingDetailsSchema = new Schema({
  date: Date,
  time: String,
  guests: Number,
  service: String,
  notes: String,
}, { _id: false });

const PaymentSchema = new Schema({
  required: { type: Boolean, required: true },
  amount: Number,
  status: { type: String, enum: ['pending', 'paid', 'refunded'] },
  transactionId: String,
}, { _id: false });

const AdBookingSchema = new Schema<AdBookingDocument>({
  bookingId: { type: String, required: true, unique: true, index: true },
  adId: { type: String, required: true, index: true },
  advertiserId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  businessId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['restaurant', 'healthcare', 'salon', 'service', 'appointment'],
    required: true,
    index: true,
  },
  details: { type: BookingDetailsSchema, default: {} },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
    index: true,
  },
  payment: { type: PaymentSchema },
}, {
  timestamps: true,
});

// Compound indexes for common queries
AdBookingSchema.index({ userId: 1, createdAt: -1 });
AdBookingSchema.index({ adId: 1, createdAt: -1 });
AdBookingSchema.index({ advertiserId: 1, status: 1 });
AdBookingSchema.index({ businessId: 1, status: 1 });

export const AdBookingModel = mongoose.model<AdBookingDocument>('AdBooking', AdBookingSchema);