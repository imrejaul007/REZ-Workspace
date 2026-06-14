/**
 * MongoDB Models for RisaCare Elderly Service
 * Port 4721
 */

import mongoose, { Schema, Document } from 'mongoose';

// ==================== Elderly Profile ====================

export interface IEmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  notifiedAt?: Date;
}

export interface IVitals {
  bp?: string;
  hr?: number;
  temp?: number;
  spo2?: number;
}

export interface IMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
}

export interface IFallHistory {
  date: Date;
  severity: 'minor' | 'moderate' | 'severe' | 'injury';
  location: string;
  cause?: string;
}

export interface IElderlyProfile extends Document {
  userId: string;
  age: number;
  livingSituation: 'alone' | 'with_spouse' | 'with_family' | 'assisted_living' | 'nursing_home';
  mobilityLevel: 'independent' | 'limited' | 'assisted' | 'wheelchair' | 'bedridden';
  medicalConditions: string[];
  medications: IMedication[];
  fallHistory: IFallHistory[];
  emergencyContacts: IEmergencyContact[];
  careGiverId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyContactSchema = new Schema<IEmergencyContact>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  relationship: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  isPrimary: { type: Boolean, default: false },
  notifiedAt: Date,
}, { _id: false });

const VitalsSchema = new Schema<IVitals>({
  bp: String,
  hr: Number,
  temp: Number,
  spo2: Number,
}, { _id: false });

const MedicationSchema = new Schema<IMedication>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
}, { _id: false });

const FallHistorySchema = new Schema<IFallHistory>({
  date: { type: Date, required: true },
  severity: { type: String, enum: ['minor', 'moderate', 'severe', 'injury'], required: true },
  location: { type: String, required: true },
  cause: String,
}, { _id: false });

const ElderlyProfileSchema = new Schema<IElderlyProfile>({
  userId: { type: String, required: true, unique: true, index: true },
  age: { type: Number, required: true, min: 60, max: 120 },
  livingSituation: {
    type: String,
    enum: ['alone', 'with_spouse', 'with_family', 'assisted_living', 'nursing_home'],
    required: true
  },
  mobilityLevel: {
    type: String,
    enum: ['independent', 'limited', 'assisted', 'wheelchair', 'bedridden'],
    required: true
  },
  medicalConditions: [{ type: String }],
  medications: [MedicationSchema],
  fallHistory: [FallHistorySchema],
  emergencyContacts: [EmergencyContactSchema],
  careGiverId: String,
  notes: String,
}, { timestamps: true });

// ==================== Fall Incident ====================

export interface IFallIncident extends Document {
  patientId: string;
  date: Date;
  time: string;
  location: string;
  severity: 'minor' | 'moderate' | 'severe' | 'injury';
  cause?: string;
  description?: string;
  treatment?: string;
  hospitalVisit: boolean;
  createdAt: Date;
}

const FallIncidentSchema = new Schema<IFallIncident>({
  patientId: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  severity: {
    type: String,
    enum: ['minor', 'moderate', 'severe', 'injury'],
    required: true
  },
  cause: String,
  description: String,
  treatment: String,
  hospitalVisit: { type: Boolean, default: false },
}, { timestamps: true });

FallIncidentSchema.index({ patientId: 1, date: -1 });

// ==================== Fall Risk Assessment ====================

export interface IRiskFactor {
  category: string;
  factor: string;
  weight: number;
  value: number;
}

export interface IFallRiskAssessment extends Document {
  patientId: string;
  date: Date;
  score: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  factors: IRiskFactor[];
  recommendations: string[];
}

const RiskFactorSchema = new Schema<IRiskFactor>({
  category: { type: String, required: true },
  factor: { type: String, required: true },
  weight: { type: Number, required: true },
  value: { type: Number, required: true },
}, { _id: false });

const FallRiskAssessmentSchema = new Schema<IFallRiskAssessment>({
  patientId: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  riskLevel: {
    type: String,
    enum: ['low', 'moderate', 'high', 'very_high'],
    required: true
  },
  factors: [RiskFactorSchema],
  recommendations: [{ type: String }],
}, { timestamps: true });

FallRiskAssessmentSchema.index({ patientId: 1, date: -1 });

// ==================== Daily Check-In ====================

export interface IDailyCheckIn extends Document {
  patientId: string;
  date: Date;
  completed: boolean;
  completedAt?: Date;
  vitals?: IVitals;
  mood?: 'great' | 'good' | 'okay' | 'fair' | 'poor';
  painLevel?: number;
  notes?: string;
  symptoms: string[];
  createdAt: Date;
}

const DailyCheckInSchema = new Schema<IDailyCheckIn>({
  patientId: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  completed: { type: Boolean, default: false },
  completedAt: Date,
  vitals: VitalsSchema,
  mood: { type: String, enum: ['great', 'good', 'okay', 'fair', 'poor'] },
  painLevel: Number,
  notes: String,
  symptoms: [{ type: String }],
}, { timestamps: true });

DailyCheckInSchema.index({ patientId: 1, date: -1 });

// ==================== Medication Reminder ====================

export interface IMedicationReminder extends Document {
  patientId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  taken: boolean;
  takenAt?: Date;
  skipped: boolean;
  skippedReason?: string;
  scheduledDate: Date;
  createdAt: Date;
}

const MedicationReminderSchema = new Schema<IMedicationReminder>({
  patientId: { type: String, required: true, index: true },
  medicationId: { type: String, required: true },
  medicationName: { type: String, required: true },
  dosage: { type: String, required: true },
  scheduledTime: { type: String, required: true },
  taken: { type: Boolean, default: false },
  takenAt: Date,
  skipped: { type: Boolean, default: false },
  skippedReason: String,
  scheduledDate: { type: Date, required: true },
}, { timestamps: true });

MedicationReminderSchema.index({ patientId: 1, scheduledDate: 1 });
MedicationReminderSchema.index({ patientId: 1, taken: 1, scheduledDate: 1 });

// ==================== Medication Schedule ====================

export interface IMedicationSchedule extends Document {
  patientId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  scheduledTime: string;
  enabled: boolean;
  createdAt: Date;
}

const MedicationScheduleSchema = new Schema<IMedicationSchedule>({
  patientId: { type: String, required: true, index: true },
  medicationId: { type: String, required: true },
  medicationName: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  scheduledTime: { type: String, required: true },
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

MedicationScheduleSchema.index({ patientId: 1, medicationId: 1 }, { unique: true });

// ==================== Check-In Schedule ====================

export interface ICheckInSchedule extends Document {
  patientId: string;
  time: string;
  enabled: boolean;
  createdAt: Date;
}

const CheckInScheduleSchema = new Schema<ICheckInSchedule>({
  patientId: { type: String, required: true, unique: true, index: true },
  time: { type: String, required: true },
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

// ==================== Emergency Alert ====================

export interface IEmergencyAlert extends Document {
  patientId: string;
  type: 'fall' | 'sos' | 'no_activity' | 'vital_concern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  description?: string;
  triggeredAt: Date;
  responded: boolean;
  respondedBy?: string;
  respondedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  notes?: string;
  createdAt: Date;
}

const EmergencyAlertSchema = new Schema<IEmergencyAlert>({
  patientId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['fall', 'sos', 'no_activity', 'vital_concern'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  location: String,
  description: String,
  triggeredAt: { type: Date, required: true },
  responded: { type: Boolean, default: false },
  respondedBy: String,
  respondedAt: Date,
  resolved: { type: Boolean, default: false },
  resolvedAt: Date,
  notes: String,
}, { timestamps: true });

EmergencyAlertSchema.index({ patientId: 1, resolved: 1 });
EmergencyAlertSchema.index({ severity: 1, resolved: 1 });

// ==================== Export Models ====================

export const ElderlyProfileModel = mongoose.model<IElderlyProfile>('ElderlyProfile', ElderlyProfileSchema);
export const FallIncidentModel = mongoose.model<IFallIncident>('FallIncident', FallIncidentSchema);
export const FallRiskAssessmentModel = mongoose.model<IFallRiskAssessment>('FallRiskAssessment', FallRiskAssessmentSchema);
export const DailyCheckInModel = mongoose.model<IDailyCheckIn>('DailyCheckIn', DailyCheckInSchema);
export const MedicationReminderModel = mongoose.model<IMedicationReminder>('MedicationReminder', MedicationReminderSchema);
export const MedicationScheduleModel = mongoose.model<IMedicationSchedule>('MedicationSchedule', MedicationScheduleSchema);
export const CheckInScheduleModel = mongoose.model<ICheckInSchedule>('CheckInSchedule', CheckInScheduleSchema);
export const EmergencyAlertModel = mongoose.model<IEmergencyAlert>('EmergencyAlert', EmergencyAlertSchema);
