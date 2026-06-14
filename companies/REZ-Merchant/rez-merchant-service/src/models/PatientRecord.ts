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

const PatientRecordSchema = new Schema<IPatientRecord>(
  {
    patientId: { type: Schema.Types.ObjectId, required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    demographics: {
      name: { type: String, required: true, trim: true },
      age: { type: Number, required: true, min: 0, max: 150 },
      gender: { type: String, required: true, enum: ['male', 'female', 'other', 'prefer-not-to-say'] },
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true },
      address: { type: String, trim: true },
    },
    medicalHistory: {
      conditions: { type: [String], default: [] },
      surgeries: { type: [String], default: [] },
      familyHistory: { type: [String], default: [] },
    },
    allergies: { type: [String], default: [] },
    medications: [
      {
        name: { type: String, required: true, trim: true },
        dosage: { type: String, required: true, trim: true },
        frequency: { type: String, required: true, trim: true },
        startDate: { type: Date },
        endDate: { type: Date },
      },
    ],
    vitals: [
      {
        date: { type: Date, required: true, default: Date.now },
        bp: { type: String, trim: true },
        heartRate: { type: Number, min: 0 },
        temperature: { type: Number, min: 0 },
        weight: { type: Number, min: 0 },
        height: { type: Number, min: 0 },
        notes: { type: String, trim: true },
      },
    ],
    notes: [
      {
        date: { type: Date, required: true, default: Date.now },
        type: {
          type: String,
          required: true,
          enum: ['visit', 'lab', 'prescription', 'general'],
        },
        content: { type: String, required: true, trim: true },
        createdBy: { type: Schema.Types.ObjectId, required: true },
      },
    ],
  },
  { timestamps: true, strict: true, strictQuery: true },
);

// Indexes for efficient queries
PatientRecordSchema.index({ patientId: 1 }, { unique: true });
PatientRecordSchema.index({ storeId: 1 });
PatientRecordSchema.index({ 'demographics.phone': 1 });
PatientRecordSchema.index({ 'demographics.name': 'text' });
PatientRecordSchema.index({ createdAt: -1 });

// Validate medication dates
PatientRecordSchema.pre('save', function (this: IPatientRecord, next) {
  if (this.medications && this.medications.length > 0) {
    for (const med of this.medications) {
      if (med.endDate && med.startDate && med.endDate < med.startDate) {
        next(new Error('Medication end date cannot be before start date'));
        return;
      }
    }
  }
  next();
});

export const PatientRecord =
  mongoose.models.PatientRecord || mongoose.model<IPatientRecord>('PatientRecord', PatientRecordSchema);
