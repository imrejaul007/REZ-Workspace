/**
 * Shift Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IShift extends Document {
  shiftId: string;
  merchantId: string;
  restaurantId: string;
  employeeId: string;
  date: Date;
  startTime: string;
  endTime: string;
  breakDuration: number; // in minutes
  role: string;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
  createdAt: Date;
  updatedAt: Date;
}

const shiftSchema = new Schema<IShift>({
  shiftId: { type: String, required: true, unique: true },
  merchantId: { type: String, required: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  breakDuration: { type: Number, default: 30 },
  role: { type: String, required: true },
  notes: String,
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
}, { timestamps: true });

shiftSchema.index({ merchantId: 1, restaurantId: 1, date: 1 });
shiftSchema.index({ employeeId: 1, date: 1 });

export const Shift = mongoose.model<IShift>('Shift', shiftSchema);
