import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITelemedicineSession extends Document {
  appointmentId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  storeId: Types.ObjectId;
  merchantId?: Types.ObjectId;
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
  updatedAt: Date;
}

const TelemedicineSessionSchema = new Schema<ITelemedicineSession>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, required: true, index: true },
    merchantId: { type: Schema.Types.ObjectId, index: true },
    scheduledTime: { type: Date, required: true, index: true },
    startTime: { type: Date },
    endTime: { type: Date },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
      default: 'scheduled',
      index: true,
    },
    meetingLink: { type: String },
    notes: { type: String },
    prescriptionIds: [{ type: Schema.Types.ObjectId, ref: 'Prescription' }],
    recordingConsent: { type: Boolean, default: false },
    recordingUrl: { type: String },
  },
  { timestamps: true }
);

// Compound indexes for common queries
TelemedicineSessionSchema.index({ doctorId: 1, scheduledTime: 1 });
TelemedicineSessionSchema.index({ patientId: 1, status: 1 });
TelemedicineSessionSchema.index({ merchantId: 1, storeId: 1, status: 1 });
TelemedicineSessionSchema.index({ appointmentId: 1 }, { unique: true });

export const TelemedicineSession = mongoose.model<ITelemedicineSession>('TelemedicineSession', TelemedicineSessionSchema);
