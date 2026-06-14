import mongoose, { Schema, Document } from 'mongoose';
import { Appointment as IAppointment, AppointmentStatus } from '../types';

export interface AppointmentDocument extends Omit<IAppointment, '_id'>, Document {}

const AppointmentSchema = new Schema<AppointmentDocument>(
  {
    appointmentId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true, index: true },
    departmentId: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
      default: 'scheduled',
      index: true
    },
    notes: { type: String }
  },
  { timestamps: true, toJSON: { transform: (_, ret) => { ret.id = ret._id.toString(); delete ret.__v; return ret; } } }
);

AppointmentSchema.index({ date: 1, doctorId: 1 });

export const AppointmentModel = mongoose.model<AppointmentDocument>('Appointment', AppointmentSchema);
