import mongoose, { Document, Schema } from 'mongoose';

// Diagnosis interface
export interface IDiagnosis {
  code: string;
  description: string;
  isPrimary: boolean;
}

// Medication interface
export interface IVisitMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

// Follow-up interface
export interface IFollowUp {
  scheduledDate: Date;
  reason: string;
  provider?: string;
}

// Recording interface
export interface IRecording {
  id: string;
  url: string;
  duration: number;
  type: 'audio' | 'video';
  recordedAt: Date;
  transcription?: string;
}

// Vitals interface
export interface IVitals {
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
}

// Provider interface
export interface IProvider {
  id: string;
  name: string;
  specialty: string;
  facility?: string;
}

// Visit document interface
export interface IVisit extends Document {
  id: string;
  profileId: string;
  date: Date;
  type: 'in-person' | 'telehealth' | 'home-visit' | 'emergency';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  provider: IProvider;
  diagnoses: IDiagnosis[];
  medications: IVisitMedication[];
  instructions: string[];
  followUps: IFollowUp[];
  vitals?: IVitals;
  recording?: IRecording;
  chiefComplaint: string;
  notes?: string;
  summaryGenerated: boolean;
  actionItemsExtracted: boolean;
  preparationReady: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Visit schema
const VisitSchema = new Schema<IVisit>(
  {
    id: { type: String, required: true, unique: true, index: true },
    profileId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    type: {
      type: String,
      enum: ['in-person', 'telehealth', 'home-visit', 'emergency'],
      required: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled'
    },
    provider: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      specialty: { type: String, required: true },
      facility: { type: String }
    },
    chiefComplaint: { type: String, required: true },
    diagnoses: [{
      code: { type: String, required: true },
      description: { type: String, required: true },
      isPrimary: { type: Boolean, default: false }
    }],
    medications: [{
      name: { type: String, required: true },
      dosage: { type: String, required: true },
      frequency: { type: String, required: true },
      duration: { type: String, required: true },
      instructions: { type: String }
    }],
    instructions: [{ type: String }],
    followUps: [{
      scheduledDate: { type: Date, required: true },
      reason: { type: String, required: true },
      provider: { type: String }
    }],
    vitals: {
      bloodPressure: {
        systolic: Number,
        diastolic: Number
      },
      heartRate: Number,
      temperature: Number,
      weight: Number,
      height: Number,
      oxygenSaturation: Number
    },
    recording: {
      id: String,
      url: String,
      duration: Number,
      type: String,
      recordedAt: Date,
      transcription: String
    },
    notes: String,
    summaryGenerated: { type: Boolean, default: false },
    actionItemsExtracted: { type: Boolean, default: false },
    preparationReady: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
VisitSchema.index({ profileId: 1, date: -1 });
VisitSchema.index({ provider: 1 });
VisitSchema.index({ status: 1 });

export const Visit = mongoose.model<IVisit>('Visit', VisitSchema);
