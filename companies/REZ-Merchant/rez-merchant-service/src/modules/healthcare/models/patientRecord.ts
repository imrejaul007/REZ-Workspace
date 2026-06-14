/**
 * Patient Record Model (EMR)
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPatientRecord extends Document {
  patientId: Types.ObjectId;
  storeId: Types.ObjectId;
  demographics: {
    name: string;
    age: number;
    gender: string;
    phone: string;
    email?: string;
    address?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  medicalHistory: {
    conditions: string[];
    surgeries: string[];
    familyHistory: string[];
  };
  allergies: string[];
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    startDate?: Date;
    endDate?: Date;
  }[];
  vitals: {
    date: Date;
    bp?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    notes?: string;
  }[];
  notes: {
    date: Date;
    type: 'visit' | 'lab' | 'prescription' | 'general';
    content: string;
    createdBy: Types.ObjectId;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const PatientRecordSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  demographics: {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    address: String,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  medicalHistory: {
    conditions: [String],
    surgeries: [String],
    familyHistory: [String]
  },
  allergies: [String],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date
  }],
  vitals: [{
    date: Date,
    bp: String,
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number,
    notes: String
  }],
  notes: [{
    date: Date,
    type: { type: String, enum: ['visit', 'lab', 'prescription', 'general'] },
    content: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'MerchantUser' }
  }]
}, { timestamps: true });

PatientRecordSchema.index({ patientId: 1, storeId: 1 });

export const PatientRecord = mongoose.model<IPatientRecord>('PatientRecord', PatientRecordSchema);
