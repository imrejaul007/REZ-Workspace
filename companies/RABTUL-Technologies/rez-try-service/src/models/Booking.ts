/**
 * Booking Model
 */
import mongoose, { Schema, Document } from 'mongoose';
import { Booking } from '../types';

export interface IBooking extends Booking, Document {}

const BookingSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    trialId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
    },
    bookedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    qrCode: { type: String, required: true },
    coinEarned: { type: Number, default: 0 },
    reviewSubmitted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BookingSchema.index({ userId: 1, trialId: 1 });
BookingSchema.index({ bookedAt: -1 });
BookingSchema.index({ status: 1 });

export const BookingModel = mongoose.model<IBooking>('Booking', BookingSchema);
