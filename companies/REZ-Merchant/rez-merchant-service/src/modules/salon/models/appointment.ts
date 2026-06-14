/**
 * Salon Appointment Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISalonAppointment extends Document {
  storeId: Types.ObjectId;
  serviceId: Types.ObjectId;
  staffId?: Types.ObjectId;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  price: number;
  commissionAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SalonAppointmentSchema = new Schema({
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  serviceId: { type: Schema.Types.ObjectId, required: true },
  staffId: { type: Schema.Types.ObjectId, ref: 'MerchantUser' },
  customerId: { type: String },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  notes: { type: String },
  price: { type: Number, required: true },
  commissionAmount: { type: Number }
}, { timestamps: true });

SalonAppointmentSchema.index({ storeId: 1, date: 1 });

export const SalonAppointment = mongoose.model<ISalonAppointment>('SalonAppointment', SalonAppointmentSchema);
