/**
 * Prescription Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPrescription extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  storeId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  diagnosis: string;
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }[];
  notes?: string;
  validUntil: Date;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
}

const PrescriptionSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'MerchantUser', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  appointmentId: { type: Schema.Types.ObjectId },
  diagnosis: { type: String, required: true },
  medicines: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: String
  }],
  notes: String,
  validUntil: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, { timestamps: true });

PrescriptionSchema.index({ patientId: 1, status: 1 });

export const Prescription = mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
