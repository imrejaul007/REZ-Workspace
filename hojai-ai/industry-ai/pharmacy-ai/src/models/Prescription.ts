import mongoose, { Document, Schema } from 'mongoose';

export interface IPrescription extends Document {
  prescriptionId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  clinicName: string;
  medications: {
    drugId: string;
    drugName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    quantity: number;
  }[];
  diagnosis: string[];
  notes: string;
  status: 'pending' | 'verified' | 'dispensed' | 'cancelled';
  verification: {
    verifiedAt?: Date;
    verifiedBy?: string;
    pharmacistName?: string;
    warnings: string[];
    interactionFlags: {
      drug1: string;
      drug2: string;
      severity: 'mild' | 'moderate' | 'severe';
      message: string;
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

const PrescriptionSchema = new Schema<IPrescription>(
  {
    prescriptionId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true, index: true },
    doctorName: { type: String, required: true },
    clinicName: { type: String },
    medications: [{
      drugId: { type: String, required: true },
      drugName: { type: String, required: true },
      dosage: { type: String, required: true },
      frequency: { type: String, required: true },
      duration: { type: String, required: true },
      instructions: { type: String },
      quantity: { type: Number, default: 1 }
    }],
    diagnosis: [{ type: String }],
    notes: { type: String },
    status: {
      type: String,
      enum: ['pending', 'verified', 'dispensed', 'cancelled'],
      default: 'pending'
    },
    verification: {
      verifiedAt: Date,
      verifiedBy: String,
      pharmacistName: String,
      warnings: [{ type: String }],
      interactionFlags: [{
        drug1: { type: String },
        drug2: { type: String },
        severity: {
          type: String,
          enum: ['mild', 'moderate', 'severe']
        },
        message: { type: String }
      }]
    },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) }
  },
  { timestamps: true }
);

PrescriptionSchema.index({ patientId: 1, createdAt: -1 });
PrescriptionSchema.index({ doctorId: 1 });
PrescriptionSchema.index({ status: 1 });
PrescriptionSchema.index({ expiresAt: 1 });

export const Prescription = mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
