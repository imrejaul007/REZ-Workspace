import mongoose, { Document, Schema } from 'mongoose';

export interface IPrescriptionMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
  refills: number;
  refillsRemaining: number;
}

export interface IPrescription {
  prescriptionId: string;
  patientId: string;
  appointmentId?: string;
  providerId: string;
  providerName: string;
  medications: IPrescriptionMedication[];
  diagnosis: string;
  notes?: string;
  pharmacyId?: string;
  pharmacyName?: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPrescriptionDocument extends Omit<IPrescription, '_id'>, Document {}

const PrescriptionSchema = new Schema<IPrescriptionDocument>(
  {
    prescriptionId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    appointmentId: { type: String, index: true },
    providerId: { type: String, required: true, index: true },
    providerName: { type: String, required: true },
    medications: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: String,
        quantity: { type: Number, required: true },
        refills: { type: Number, default: 0 },
        refillsRemaining: { type: Number, default: 0 },
      },
    ],
    diagnosis: { type: String, required: true },
    notes: { type: String },
    pharmacyId: { type: String, index: true },
    pharmacyName: String,
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'expired'],
      default: 'active',
      index: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

PrescriptionSchema.index({ patientId: 1, status: 1 });
PrescriptionSchema.index({ providerId: 1, createdAt: -1 });
PrescriptionSchema.index({ pharmacyId: 1, status: 1 });

export const Prescription = mongoose.model<IPrescriptionDocument>('Prescription', PrescriptionSchema);
