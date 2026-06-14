/**
 * MongoDB Models for RisaCare Mental Health Service
 * Port 4722
 */

import mongoose, { Schema, Document } from 'mongoose';

// ==================== Mood Entry ====================

export interface IMoodEntry extends Document {
  userId: string;
  date: Date;
  mood: string;
  energy: number;
  anxiety: number;
  sleep: number;
  stress: number;
  notes?: string;
  triggers: string[];
  activities: string[];
  medicationTaken: boolean;
  exerciseDone: boolean;
  socialInteraction: boolean;
  createdAt: Date;
}

const MoodEntrySchema = new Schema<IMoodEntry>({
  userId: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  mood: { type: String, required: true },
  energy: Number,
  anxiety: Number,
  sleep: Number,
  stress: Number,
  notes: String,
  triggers: [{ type: String }],
  activities: [{ type: String }],
  medicationTaken: { type: Boolean, default: false },
  exerciseDone: { type: Boolean, default: false },
  socialInteraction: { type: Boolean, default: false },
}, { timestamps: true });

MoodEntrySchema.index({ userId: 1, date: -1 });

// ==================== Counselor ====================

export interface ICounselor extends Document {
  counselorId: string;
  name: string;
  specializations: string[];
  languages: string[];
  rating: number;
  totalReviews: number;
  pricePerSession: number;
  therapyType: string;
  bio: string;
  availability: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
}

const CounselorSchema = new Schema<ICounselor>({
  counselorId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  specializations: [{ type: String }],
  languages: [{ type: String }],
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  pricePerSession: { type: Number, required: true },
  therapyType: { type: String, required: true },
  bio: String,
  availability: { type: Schema.Types.Mixed },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// ==================== Therapy Session ====================

export interface ITherapySession extends Document {
  sessionId: string;
  userId: string;
  providerId: string;
  counselorId?: string;
  therapistId?: string;
  type: string;
  therapyType?: string;
  date: Date;
  duration: number;
  status: string;
  sessionNotes?: string;
  homework?: string;
  nextSession?: Date;
  rating?: number;
  feedback?: string;
  homeworkCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TherapySessionSchema = new Schema<ITherapySession>({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  providerId: { type: String, required: true },
  counselorId: String,
  therapistId: String,
  type: { type: String, required: true },
  therapyType: String,
  date: { type: Date, required: true },
  duration: Number,
  status: { type: String, default: 'scheduled' },
  sessionNotes: String,
  homework: String,
  nextSession: Date,
  rating: Number,
  feedback: String,
  homeworkCompleted: { type: Boolean, default: false },
}, { timestamps: true });

TherapySessionSchema.index({ userId: 1, date: -1 });
TherapySessionSchema.index({ counselorId: 1, date: 1 });

// ==================== Support Group ====================

export interface ISupportGroup extends Document {
  groupId: string;
  name: string;
  description: string;
  type: string;
  focusAreas: string[];
  maxMembers: number;
  currentMembers: number;
  memberIds: string[];
  sessionSchedule: string;
  isActive: boolean;
  createdAt: Date;
}

const SupportGroupSchema = new Schema<ISupportGroup>({
  groupId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: String,
  type: { type: String, required: true },
  focusAreas: [{ type: String }],
  maxMembers: { type: Number, default: 20 },
  currentMembers: { type: Number, default: 0 },
  memberIds: [{ type: String }],
  sessionSchedule: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// ==================== Crisis Plan ====================

export interface ICrisisPlan extends Document {
  userId: string;
  warningSigns: string[];
  copingStrategies: string[];
  reasonsToLive: string[];
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
  professionalContacts: Array<{
    name: string;
    phone: string;
    role: string;
  }>;
  safePlace承诺: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const CrisisPlanSchema = new Schema<ICrisisPlan>({
  userId: { type: String, required: true, unique: true, index: true },
  warningSigns: [{ type: String }],
  copingStrategies: [{ type: String }],
  reasonsToLive: [{ type: String }],
  emergencyContacts: [{
    name: String,
    phone: String,
    relationship: String,
  }],
  professionalContacts: [{
    name: String,
    phone: String,
    role: String,
  }],
  safePlace承诺: String,
  notes: String,
}, { timestamps: true });

// ==================== Crisis Alert ====================

export interface ICrisisAlert extends Document {
  userId: string;
  type: 'immediate' | 'escalating' | 'check_in';
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggeredAt: Date;
  reason: string;
  location?: string;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resourcesProvided: string[];
  emergencyServicesNotified: boolean;
  createdAt: Date;
}

const CrisisAlertSchema = new Schema<ICrisisAlert>({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['immediate', 'escalating', 'check_in'], required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  triggeredAt: { type: Date, required: true },
  reason: { type: String, required: true },
  location: String,
  isResolved: { type: Boolean, default: false },
  resolvedAt: Date,
  resolvedBy: String,
  resourcesProvided: [{ type: String }],
  emergencyServicesNotified: { type: Boolean, default: false },
}, { timestamps: true });

CrisisAlertSchema.index({ userId: 1, triggeredAt: -1 });

// ==================== Self-Harm Incident ====================

export interface ISelfHarmIncident extends Document {
  userId: string;
  date: Date;
  severity: string;
  triggers: string[];
  emotions: string[];
  usedCoping: string[];
  reachedOutTo: string[];
  followUpActions: string[];
  location?: string;
  circumstances?: string;
  isSafeNow: boolean;
  needsProfessionalHelp: boolean;
  createdAt: Date;
}

const SelfHarmIncidentSchema = new Schema<ISelfHarmIncident>({
  userId: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  severity: { type: String, required: true },
  triggers: [{ type: String }],
  emotions: [{ type: String }],
  usedCoping: [{ type: String }],
  reachedOutTo: [{ type: String }],
  followUpActions: [{ type: String }],
  location: String,
  circumstances: String,
  isSafeNow: { type: Boolean, default: false },
  needsProfessionalHelp: { type: Boolean, default: false },
}, { timestamps: true });

SelfHarmIncidentSchema.index({ userId: 1, date: -1 });

// ==================== Mental Health Profile ====================

export interface IMentalHealthProfile extends Document {
  userId: string;
  conditions: string[];
  therapyGoals: string[];
  preferredTherapyTypes: string[];
  currentMedications: string[];
  therapistNotes?: string;
  lastAssessmentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MentalHealthProfileSchema = new Schema<IMentalHealthProfile>({
  userId: { type: String, required: true, unique: true, index: true },
  conditions: [{ type: String }],
  therapyGoals: [{ type: String }],
  preferredTherapyTypes: [{ type: String }],
  currentMedications: [{ type: String }],
  therapistNotes: String,
  lastAssessmentDate: Date,
}, { timestamps: true });

// ==================== Export Models ====================

export const MoodEntryModel = mongoose.model<IMoodEntry>('MoodEntry', MoodEntrySchema);
export const CounselorModel = mongoose.model<ICounselor>('Counselor', CounselorSchema);
export const TherapySessionModel = mongoose.model<ITherapySession>('TherapySession', TherapySessionSchema);
export const SupportGroupModel = mongoose.model<ISupportGroup>('SupportGroup', SupportGroupSchema);
export const CrisisPlanModel = mongoose.model<ICrisisPlan>('CrisisPlan', CrisisPlanSchema);
export const CrisisAlertModel = mongoose.model<ICrisisAlert>('CrisisAlert', CrisisAlertSchema);
export const SelfHarmIncidentModel = mongoose.model<ISelfHarmIncident>('SelfHarmIncident', SelfHarmIncidentSchema);
export const MentalHealthProfileModel = mongoose.model<IMentalHealthProfile>('MentalHealthProfile', MentalHealthProfileSchema);
