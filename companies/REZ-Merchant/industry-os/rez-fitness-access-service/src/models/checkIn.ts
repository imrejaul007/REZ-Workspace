/**
 * Check-In Model
 * Gym check-in records
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ICheckIn extends Document {
  memberId: string;
  gymId: string;
  cardId: string;
  checkInTime: Date;
  checkOutTime?: Date;
  duration?: number; // in minutes
  type: 'check-in' | 'check-out';
  status: 'active' | 'completed';
  notes?: string;
}

const CheckInSchema = new Schema<ICheckIn>({
  memberId: { type: String, required: true, index: true },
  gymId: { type: String, required: true, index: true },
  cardId: { type: String, required: true, index: true },
  checkInTime: { type: Date, required: true, index: true },
  checkOutTime: { type: Date },
  duration: { type: Number },
  type: { type: String, enum: ['check-in', 'check-out'], required: true },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  notes: { type: String },
}, { timestamps: true });

CheckInSchema.index({ memberId: 1, checkInTime: -1 });
CheckInSchema.index({ gymId: 1, checkInTime: -1 });
CheckInSchema.index({ checkInTime: -1 });

export const CheckIn = mongoose.model<ICheckIn>('CheckIn', CheckInSchema);
