import mongoose, { Schema, Document } from 'mongoose';
import { Prescription as IPrescription } from '../types';

export interface PrescriptionDocument extends Omit<IPrescription, '_id'>, Document {}

const MedicineItemSchema = new Schema({
  medicineId: String,
  name: String,
  dosage: String,
  frequency: String,
  duration: String,
  notes: String
}, { _id: false });

const PrescriptionSchema = new Schema<PrescriptionDocument>(
  {
    prescriptionId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true, index: true },
    diagnosis: { type: String, required: true },
    medicines: [MedicineItemSchema],
    instructions: { type: String },
    validUntil: { type: Date, required: true },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active', index: true }
  },
  { timestamps: true, toJSON: { transform: (_, ret) => { ret.id = ret._id.toString(); delete ret.__v; return ret; } } }
);

PrescriptionSchema.index({ patientId: 1, createdAt: -1 });

export const PrescriptionModel = mongoose.model<PrescriptionDocument>('Prescription', PrescriptionSchema);
