import mongoose, { Schema, Document } from 'mongoose';
import { MedicalRecord as IMedicalRecord } from '../types';

export interface MedicalRecordDocument extends Omit<IMedicalRecord, '_id'>, Document {}

const MedicalRecordSchema = new Schema<MedicalRecordDocument>(
  {
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    diagnosis: { type: String, required: true },
    symptoms: [{ type: String }],
    treatment: { type: String, required: true },
    prescription: { type: String },
    notes: { type: String },
    attachments: [{ type: String }]
  },
  { timestamps: true, toJSON: { transform: (_, ret) => { ret.id = ret._id.toString(); delete ret.__v; return ret; } } }
);

MedicalRecordSchema.index({ patientId: 1, createdAt: -1 });

export const MedicalRecordModel = mongoose.model<MedicalRecordDocument>('MedicalRecord', MedicalRecordSchema);
