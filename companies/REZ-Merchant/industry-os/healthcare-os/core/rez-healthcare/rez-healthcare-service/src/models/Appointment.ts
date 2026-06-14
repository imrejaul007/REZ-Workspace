import mongoose, { Document, Schema } from 'mongoose';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'no-show'
  | 'rescheduled';

export type AppointmentType = 'in-person' | 'telemedicine' | 'home-visit';
export type AppointmentPriority = 'routine' | 'urgent' | 'emergency';

export interface IAppointmentReason {
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface IAppointment {
  appointmentId: string;
  patientId: string;
  providerId: string;
  providerName: string;
  type: AppointmentType;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  scheduledAt: Date;
  duration: number; // in minutes
  endTime: Date;
  reason: IAppointmentReason;
  diagnosis?: string;
  notes?: string;
  telemedicineSessionId?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppointmentDocument extends Omit<IAppointment, '_id'>, Document {}

const AppointmentSchema = new Schema<IAppointmentDocument>(
  {
    appointmentId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    providerId: { type: String, required: true, index: true },
    providerName: { type: String, required: true },
    type: {
      type: String,
      enum: ['in-person', 'telemedicine', 'home-visit'],
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show', 'rescheduled'],
      default: 'scheduled',
      index: true,
    },
    priority: {
      type: String,
      enum: ['routine', 'urgent', 'emergency'],
      default: 'routine',
    },
    scheduledAt: { type: Date, required: true, index: true },
    duration: { type: Number, required: true, default: 30 },
    endTime: { type: Date, required: true },
    reason: {
      chiefComplaint: { type: String, required: true },
      symptoms: [String],
      duration: String,
      severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
    },
    diagnosis: { type: String },
    notes: { type: String },
    telemedicineSessionId: { type: String, index: true },
    followUpRequired: { type: Boolean, default: false },
    followUpDate: { type: Date },
    cancellationReason: { type: String },
    cancelledBy: { type: String },
    cancelledAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
AppointmentSchema.index({ providerId: 1, scheduledAt: 1 });
AppointmentSchema.index({ patientId: 1, scheduledAt: -1 });
AppointmentSchema.index({ status: 1, scheduledAt: 1 });
AppointmentSchema.index({ patientId: 1, status: 1, scheduledAt: -1 });

export const Appointment = mongoose.model<IAppointmentDocument>('Appointment', AppointmentSchema);
