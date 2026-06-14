import mongoose, { Document, Schema } from 'mongoose';

// Schedule interface
export interface ISchedule {
  times: string[]; // e.g., ["08:00", "14:00", "20:00"]
  frequency: 'daily' | 'twice-daily' | 'three-times-daily' | 'weekly' | 'as-needed' | 'custom';
  withFood: 'before-meal' | 'with-meal' | 'after-meal' | 'empty-stomach' | 'any';
  remindersEnabled: boolean;
  customDays?: number[]; // For custom frequency (e.g., every other day)
}

// Refill tracking interface
export interface IRefillTracking {
  currentQuantity: number;
  dosesPerIntake: number;
  totalRefills: number;
  refillsRemaining: number;
  lastRefillDate?: Date;
  nextRefillDate?: Date;
  pharmacy?: {
    name: string;
    phone: string;
    address?: string;
  };
  autoRefillEnabled: boolean;
}

// Side effect interface
export interface ISideEffect {
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  reportedAt?: Date;
}

// Interaction interface
export interface IInteraction {
  drugName: string;
  description: string;
  severity: 'low' | 'moderate' | 'high';
}

// Medication document interface
export interface IMedication extends Document {
  id: string;
  profileId: string;
  name: string;
  genericName?: string;
  brandName?: string;
  ndc?: string; // National Drug Code
  form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'topical' | 'inhaler' | 'patch' | 'drops' | 'other';
  strength: string;
  color?: string;
  shape?: string;
  manufacturer?: string;
  prescribedBy: string;
  visitId?: string;
  status: 'active' | 'paused' | 'discontinued' | 'completed';
  startDate: Date;
  endDate?: Date;
  schedule: ISchedule;
  dosage: string;
  instructions?: string;
  purpose?: string;
  refillTracking: IRefillTracking;
  sideEffects: ISideEffect[];
  interactions: IInteraction[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Medication schema
const ScheduleSchema = new Schema<ISchedule>({
  times: [{ type: String, required: true }],
  frequency: {
    type: String,
    enum: ['daily', 'twice-daily', 'three-times-daily', 'weekly', 'as-needed', 'custom'],
    required: true
  },
  withFood: {
    type: String,
    enum: ['before-meal', 'with-meal', 'after-meal', 'empty-stomach', 'any'],
    default: 'any'
  },
  remindersEnabled: { type: Boolean, default: true },
  customDays: [Number]
}, { _id: false });

const RefillTrackingSchema = new Schema<IRefillTracking>({
  currentQuantity: { type: Number, required: true, min: 0 },
  dosesPerIntake: { type: Number, required: true, min: 1 },
  totalRefills: { type: Number, default: 0 },
  refillsRemaining: { type: Number, default: 0 },
  lastRefillDate: Date,
  nextRefillDate: Date,
  pharmacy: {
    name: String,
    phone: String,
    address: String
  },
  autoRefillEnabled: { type: Boolean, default: false }
}, { _id: false });

const MedicationSchema = new Schema<IMedication>(
  {
    id: { type: String, required: true, unique: true, index: true },
    profileId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    genericName: String,
    brandName: String,
    ndc: String,
    form: {
      type: String,
      enum: ['tablet', 'capsule', 'liquid', 'injection', 'topical', 'inhaler', 'patch', 'drops', 'other'],
      required: true
    },
    strength: { type: String, required: true },
    color: String,
    shape: String,
    manufacturer: String,
    prescribedBy: { type: String, required: true },
    visitId: String,
    status: {
      type: String,
      enum: ['active', 'paused', 'discontinued', 'completed'],
      default: 'active'
    },
    startDate: { type: Date, required: true },
    endDate: Date,
    schedule: { type: ScheduleSchema, required: true },
    dosage: { type: String, required: true },
    instructions: String,
    purpose: String,
    refillTracking: { type: RefillTrackingSchema, required: true },
    sideEffects: [{
      description: { type: String, required: true },
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        default: 'mild'
      },
      reportedAt: Date
    }],
    interactions: [{
      drugName: { type: String, required: true },
      description: { type: String, required: true },
      severity: {
        type: String,
        enum: ['low', 'moderate', 'high'],
        default: 'moderate'
      }
    }],
    notes: String
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
MedicationSchema.index({ profileId: 1, status: 1 });
MedicationSchema.index({ profileId: 1, startDate: -1 });
MedicationSchema.index({ prescribedBy: 1 });

export const Medication = mongoose.model<IMedication>('Medication', MedicationSchema);
