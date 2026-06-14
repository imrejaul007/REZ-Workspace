/**
 * Reservation Model
 *
 * Represents restaurant reservations with time slots
 */

import mongoose, { Schema, Document } from 'mongoose';

export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';

export interface ITimeSlot {
  time: string; // HH:mm format
  availableTables: number;
  isAvailable: boolean;
}

export interface IReservation extends Document {
  reservationId: string;
  confirmationNumber: string; // Human-readable confirmation
  restaurantId: string;
  branchId: string;
  userId: string;
  status: ReservationStatus;

  // Guest details
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  guestCount: number;

  // Date and time
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm format
  duration?: number; // minutes
  specialOccasion?: string; // birthday, anniversary, etc.

  // Table assignment
  tableId?: string;
  tableNumbers?: string[];

  // Booking details
  depositRequired: boolean;
  depositAmount?: number;
  depositPaid: boolean;
  depositTransactionId?: string;

  // Customer notes
  specialRequests?: string;
  dietaryRestrictions?: string[];

  // Notifications
  reminderSent: boolean;
  reminderSentAt?: Date;

  // Cancellation
  cancelledAt?: Date;
  cancellationReason?: string;
  refundStatus?: 'none' | 'pending' | 'processed';
  refundAmount?: number;

  // Timestamps
  orderedAt: Date;
  confirmedAt?: Date;
  seatedAt?: Date;
  completedAt?: Date;

  // Source
  source: 'app' | 'website' | 'phone' | 'walkin' | 'partner';

  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>({
  reservationId: { type: String, required: true, unique: true, index: true },
  confirmationNumber: { type: String, required: true, unique: true },
  restaurantId: { type: String, required: true, index: true },
  branchId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'],
    default: 'pending',
    index: true,
  },
  guestName: { type: String, required: true },
  guestPhone: { type: String, required: true },
  guestEmail: { type: String },
  guestCount: { type: Number, required: true, min: 1 },
  date: { type: String, required: true, index: true },
  time: { type: String, required: true },
  duration: { type: Number, default: 90 }, // 90 minutes default
  specialOccasion: { type: String },
  tableId: { type: String, index: true },
  tableNumbers: [{ type: String }],
  depositRequired: { type: Boolean, default: false },
  depositAmount: { type: Number, default: 0 },
  depositPaid: { type: Boolean, default: false },
  depositTransactionId: { type: String },
  specialRequests: { type: String },
  dietaryRestrictions: [{ type: String }],
  reminderSent: { type: Boolean, default: false },
  reminderSentAt: { type: Date },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  refundStatus: { type: String, enum: ['none', 'pending', 'processed'] },
  refundAmount: { type: Number },
  orderedAt: { type: Date, default: Date.now },
  confirmedAt: { type: Date },
  seatedAt: { type: Date },
  completedAt: { type: Date },
  source: {
    type: String,
    enum: ['app', 'website', 'phone', 'walkin', 'partner'],
    default: 'app',
  },
}, {
  timestamps: true,
  collection: 'reservations',
});

// Compound indexes
ReservationSchema.index({ restaurantId: 1, date: 1, status: 1 });
ReservationSchema.index({ branchId: 1, date: 1, time: 1 });
ReservationSchema.index({ userId: 1, date: 1 });
ReservationSchema.index({ reservationId: 1, status: 1 });
ReservationSchema.index({ guestPhone: 1, date: 1 });

export const Reservation = mongoose.model<IReservation>('Reservation', ReservationSchema);
