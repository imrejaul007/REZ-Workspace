import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  ConditionType,
  Severity,
  ReadingType,
  AlertType,
  AlertSeverity,
  Medication
} from '../types';

// ChronicCondition Interface
export interface IChronicCondition extends Document {
  _id: mongoose.Types.ObjectId;
  patientId: string;
  conditionType: ConditionType;
  severity: Severity;
  diagnosedDate: Date;
  medications: Medication[];
  carePlanId?: string;
  notes?: string;
  familyHistory: boolean;
  riskFactors: string[];
  status: 'active' | 'managed' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

// ConditionReading Interface
export interface IConditionReading extends Document {
  _id: mongoose.Types.ObjectId;
  conditionId: mongoose.Types.ObjectId;
  patientId: string;
  readingType: ReadingType;
  value: number;
  unit: string;
  recordedAt: Date;
  notes?: string;
  recordedBy?: string;
  createdAt: Date;
}

// CareProtocol Interface
export interface ICareProtocol extends Document {
  _id: mongoose.Types.ObjectId;
  conditionId: mongoose.Types.ObjectId;
  patientId: string;
  protocolName: string;
  targetRanges: {
    min?: number;
    max?: number;
    ideal?: number;
    warningMin?: number;
    warningMax?: number;
  };
  medications: Medication[];
  lifestyleRecommendations: string[];
  monitoringFrequency: 'hourly' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  followUpDays?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Alert Interface
export interface IAlert extends Document {
  _id: mongoose.Types.ObjectId;
  patientId: string;
  conditionId: mongoose.Types.ObjectId;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  details?: Record<string, unknown>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  acknowledgeNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schemas
const medicationSchema = new Schema<Medication>(
  {
    name: { type: String, required: true, maxlength: 200 },
    dosage: { type: String, required: true, maxlength: 100 },
    frequency: { type: String, required: true, maxlength: 100 },
    startDate: { type: Date },
    endDate: { type: Date },
    notes: { type: String, maxlength: 500 }
  },
  { _id: false }
);

const chronicConditionSchema = new Schema<IChronicCondition>(
  {
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true
    },
    conditionType: {
      type: String,
      required: [true, 'Condition type is required'],
      enum: {
        values: ['diabetes', 'hypertension', 'thyroid', 'asthma', 'heart_disease', 'copd', 'arthritis', 'depression', 'other'],
        message: 'Invalid condition type'
      },
      lowercase: true
    },
    severity: {
      type: String,
      required: [true, 'Severity is required'],
      enum: {
        values: ['mild', 'moderate', 'severe'],
        message: 'Invalid severity level'
      }
    },
    diagnosedDate: {
      type: Date,
      default: Date.now
    },
    medications: {
      type: [medicationSchema],
      default: []
    },
    carePlanId: {
      type: String,
      index: true
    },
    notes: {
      type: String,
      maxlength: 1000
    },
    familyHistory: {
      type: Boolean,
      default: false
    },
    riskFactors: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['active', 'managed', 'resolved'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient queries
chronicConditionSchema.index({ patientId: 1, conditionType: 1 });
chronicConditionSchema.index({ patientId: 1, status: 1 });

const conditionReadingSchema = new Schema<IConditionReading>(
  {
    conditionId: {
      type: Schema.Types.ObjectId,
      ref: 'ChronicCondition',
      required: [true, 'Condition ID is required'],
      index: true
    },
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true
    },
    readingType: {
      type: String,
      required: [true, 'Reading type is required'],
      enum: {
        values: ['blood_sugar', 'blood_pressure', 'heart_rate', 'weight', 'thyroid', 'lung_function', 'pain_level', 'mood'],
        message: 'Invalid reading type'
      }
    },
    value: {
      type: Number,
      required: [true, 'Value is required']
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      maxlength: 50
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    notes: {
      type: String,
      maxlength: 500
    },
    recordedBy: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
conditionReadingSchema.index({ conditionId: 1, readingType: 1 });
conditionReadingSchema.index({ conditionId: 1, recordedAt: -1 });
conditionReadingSchema.index({ patientId: 1, recordedAt: -1 });

const careProtocolSchema = new Schema<ICareProtocol>(
  {
    conditionId: {
      type: Schema.Types.ObjectId,
      ref: 'ChronicCondition',
      required: [true, 'Condition ID is required'],
      index: true
    },
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true
    },
    protocolName: {
      type: String,
      required: [true, 'Protocol name is required'],
      maxlength: 200
    },
    targetRanges: {
      min: { type: Number },
      max: { type: Number },
      ideal: { type: Number },
      warningMin: { type: Number },
      warningMax: { type: Number }
    },
    medications: {
      type: [medicationSchema],
      default: []
    },
    lifestyleRecommendations: {
      type: [String],
      default: []
    },
    monitoringFrequency: {
      type: String,
      required: [true, 'Monitoring frequency is required'],
      enum: ['hourly', 'daily', 'weekly', 'biweekly', 'monthly']
    },
    followUpDays: {
      type: Number,
      min: 1
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const alertSchema = new Schema<IAlert>(
  {
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true
    },
    conditionId: {
      type: Schema.Types.ObjectId,
      ref: 'ChronicCondition',
      required: [true, 'Condition ID is required'],
      index: true
    },
    type: {
      type: String,
      required: [true, 'Alert type is required'],
      enum: {
        values: ['out_of_range', 'medication_due', 'appointment_due', 'trend_concern'],
        message: 'Invalid alert type'
      }
    },
    severity: {
      type: String,
      required: [true, 'Severity is required'],
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: 'Invalid alert severity'
      },
      default: 'medium'
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: 500
    },
    details: {
      type: Schema.Types.Mixed
    },
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedBy: {
      type: String
    },
    acknowledgedAt: {
      type: Date
    },
    acknowledgeNotes: {
      type: String,
      maxlength: 500
    }
  },
  {
    timestamps: true
  }
);

// Indexes for alert queries
alertSchema.index({ patientId: 1, acknowledged: 1 });
alertSchema.index({ conditionId: 1, type: 1 });
alertSchema.index({ createdAt: -1 });

// Export Models
export const ChronicCondition: Model<IChronicCondition> = mongoose.model<IChronicCondition>(
  'ChronicCondition',
  chronicConditionSchema
);

export const ConditionReading: Model<IConditionReading> = mongoose.model<IConditionReading>(
  'ConditionReading',
  conditionReadingSchema
);

export const CareProtocol: Model<ICareProtocol> = mongoose.model<ICareProtocol>(
  'CareProtocol',
  careProtocolSchema
);

export const Alert: Model<IAlert> = mongoose.model<IAlert>(
  'Alert',
  alertSchema
);

export const MODELS = {
  ChronicCondition,
  ConditionReading,
  CareProtocol,
  Alert
};
