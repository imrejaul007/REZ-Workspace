import mongoose, { Document, Schema } from 'mongoose';

export interface IVitalSigns {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  recordedAt: Date;
}

export interface IMedicalRecordAttachment {
  type: 'lab-result' | 'imaging' | 'document' | 'referral';
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: Date;
}

export interface IMedicalRecord {
  recordId: string;
  patientId: string;
  appointmentId?: string;
  providerId: string;
  providerName: string;
  recordType: 'consultation' | 'progress-note' | 'lab-result' | 'imaging' | 'procedure' | 'discharge-summary';
  title: string;
  description: string;
  diagnosis: string[];
  treatment: string;
  vitalSigns?: IVitalSigns;
  attachments: IMedicalRecordAttachment[];
  isConfidential: boolean;
  sharedWith: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMedicalRecordDocument extends Omit<IMedicalRecord, '_id'>, Document {}

const MedicalRecordSchema = new Schema<IMedicalRecordDocument>(
  {
    recordId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    appointmentId: { type: String, index: true },
    providerId: { type: String, required: true, index: true },
    providerName: { type: String, required: true },
    recordType: {
      type: String,
      enum: ['consultation', 'progress-note', 'lab-result', 'imaging', 'procedure', 'discharge-summary'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    diagnosis: { type: [String], default: [] },
    treatment: { type: String },
    vitalSigns: {
      bloodPressureSystolic: Number,
      bloodPressureDiastolic: Number,
      heartRate: Number,
      temperature: Number,
      respiratoryRate: Number,
      oxygenSaturation: Number,
      weight: Number,
      height: Number,
      bmi: Number,
      recordedAt: Date,
    },
    attachments: [
      {
        type: { type: String, enum: ['lab-result', 'imaging', 'document', 'referral'] },
        fileName: String,
        fileUrl: String,
        fileType: String,
        uploadedAt: Date,
      },
    ],
    isConfidential: { type: Boolean, default: false },
    sharedWith: { type: [String], default: [] },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

MedicalRecordSchema.index({ patientId: 1, recordType: 1 });
MedicalRecordSchema.index({ patientId: 1, createdAt: -1 });
MedicalRecordSchema.index({ providerId: 1, createdAt: -1 });
MedicalRecordSchema.index({ diagnosis: 1 });

export const MedicalRecord = mongoose.model<IMedicalRecordDocument>('MedicalRecord', MedicalRecordSchema);
