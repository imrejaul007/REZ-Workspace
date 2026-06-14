import mongoose, { Schema, Document } from 'mongoose';
import { Patient as IPatient } from '../types';

export interface PatientDocument extends Omit<IPatient, '_id'>, Document {}

const PatientSchema = new Schema<PatientDocument>(
  {
    patientId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, required: true, enum: ['male', 'female', 'other'] },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    bloodGroup: { type: String },
    allergies: [{ type: String }],
    emergencyContact: {
      name: String,
      phone: String,
      relation: String
    },
    insuranceProvider: { type: String },
    insuranceNumber: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true }
  },
  { timestamps: true, toJSON: { transform: (_, ret) => { ret.id = ret._id.toString(); delete ret.__v; return ret; } } }
);

PatientSchema.index({ name: 'text', email: 'text' });

export const PatientModel = mongoose.model<PatientDocument>('Patient', PatientSchema);
