/**
 * Telemedicine Session Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITelemedicineSession extends Document {
  appointmentId?: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  storeId: Types.ObjectId;
  scheduledTime: Date;
  startTime?: Date;
  endTime?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  meetingLink?: string;
  notes?: string;
  prescriptionIds: Types.ObjectId[];
  recordingConsent: boolean;
  recordingUrl?: string;
  createdAt: Date;
}

const TelemedicineSessionSchema = new Schema({
  appointmentId: { type: Schema.Types.ObjectId },
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'MerchantUser', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  scheduledTime: { type: Date, required: true },
  startTime: Date,
  endTime: Date,
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  meetingLink: String,
  notes: String,
  prescriptionIds: [{ type: Schema.Types.ObjectId, ref: 'Prescription' }],
  recordingConsent: { type: Boolean, default: false },
  recordingUrl: String
}, { timestamps: true });

TelemedicineSessionSchema.index({ doctorId: 1, status: 1 });
TelemedicineSessionSchema.index({ patientId: 1, status: 1 });

export const TelemedicineSession = mongoose.model<ITelemedicineSession>('TelemedicineSession', TelemedicineSessionSchema);
