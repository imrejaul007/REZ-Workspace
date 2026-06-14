import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface IPrescription extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  doctorName: string;
  storeId: Types.ObjectId;
  merchantId: Types.ObjectId;
  medicines: IMedicine[];
  diagnosis: string;
  validUntil: Date;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const MedicineSchema = new Schema<IMedicine>(
  {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String },
  },
  { _id: false }
);

const PrescriptionSchema = new Schema<IPrescription>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorName: { type: String, required: true },
    storeId: { type: Schema.Types.ObjectId, required: true, index: true },
    merchantId: { type: Schema.Types.ObjectId, required: true, index: true },
    medicines: { type: [MedicineSchema], required: true, validate: [arr => arr.length > 0, 'At least one medicine is required'] },
    diagnosis: { type: String, required: true },
    validUntil: { type: Date, required: true, index: true },
    notes: { type: String },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for common queries
PrescriptionSchema.index({ merchantId: 1, patientId: 1, status: 1 });
PrescriptionSchema.index({ merchantId: 1, storeId: 1, createdAt: -1 });
PrescriptionSchema.index({ validUntil: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-expiry

export const Prescription = mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
