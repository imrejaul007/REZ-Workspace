/**
 * Appointment Model - Salon appointments/bookings
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  appointmentId: string;
  salonId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  stylistId?: string;
  serviceIds: string[];
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  type: 'appointment' | 'walkin' | 'rebooking';
  notes?: string;
  totalAmount?: number;
  depositPaid: boolean;
  depositAmount: number;
  source: 'app' | 'web' | 'phone' | 'walkin' | 'whatsapp';
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>({
  appointmentId: { type: String, required: true, unique: true, index: true },
  salonId: { type: String, required: true, index: true },
  customerId: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: String,
  stylistId: { type: String, index: true },
  serviceIds: [String],
  date: { type: String, required: true, index: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'pending',
    index: true,
  },
  type: {
    type: String,
    enum: ['appointment', 'walkin', 'rebooking'],
    default: 'appointment',
  },
  notes: String,
  totalAmount: Number,
  depositPaid: { type: Boolean, default: false },
  depositAmount: { type: Number, default: 0 },
  source: {
    type: String,
    enum: ['app', 'web', 'phone', 'walkin', 'whatsapp'],
    default: 'app',
  },
  reminderSent: { type: Boolean, default: false },
}, { timestamps: true });

// Compound indexes for common queries
AppointmentSchema.index({ salonId: 1, date: 1, status: 1 });
AppointmentSchema.index({ stylistId: 1, date: 1, startTime: 1 });
AppointmentSchema.index({ customerId: 1, date: 1 });
AppointmentSchema.index({ salonId: 1, status: 1, date: 1 });

export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);
