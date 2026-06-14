import mongoose, { Schema, Document } from 'mongoose';
import { Prescription as IPrescription, PrescriptionStatus } from '../types';

export interface PrescriptionDocument extends Omit<IPrescription, '_id'>, Document {}

const PrescriptionSchema = new Schema<PrescriptionDocument>(
  {
    prescriptionId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    doctorName: { type: String, required: true },
    doctorLicense: { type: String, required: true },
    imageUrl: { type: String },
    medicines: [{
      name: String,
      dosage: String,
      quantity: Number
    }],
    diagnosis: { type: String },
    validUntil: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'dispensed', 'expired'],
      default: 'pending',
      index: true
    },
    verifiedBy: { type: String },
    verifiedAt: { type: Date }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => { ret.id = ret._id.toString(); delete ret.__v; return ret; }
    }
  }
);

PrescriptionSchema.index({ patientId: 1, createdAt: -1 });
PrescriptionSchema.index({ status: 1, validUntil: 1 });

export const PrescriptionModel = mongoose.model<PrescriptionDocument>('Prescription', PrescriptionSchema);
