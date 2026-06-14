/**
 * MongoDB Models for RisaCare Profile Service
 */

import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// SUB-SCHEMAS
// ============================================

export const HealthProfileSchema = new Schema({
  profileId: { type: String, required: true },
  name: { type: String, required: true },
  relationship: {
    type: String,
    enum: ['self', 'spouse', 'child', 'parent', 'sibling', 'other'],
    default: 'self'
  },
  age: { type: Number, min: 0, max: 150 },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']
  },
  dateOfBirth: { type: Date },
  isPrimary: { type: Boolean, default: false },
  isMinor: { type: Boolean, default: false },
  avatar: { type: String },
  health: {
    height: { value: Number, unit: { type: String, default: 'cm' } },
    weight: { value: Number, unit: { type: String, default: 'kg' } },
    allergies: [{
      allergen: String,
      severity: { type: String, enum: ['mild', 'moderate', 'severe', 'life_threatening'] },
      reaction: String
    }],
    chronicConditions: [{
      condition: String,
      diagnosedDate: Date,
      status: { type: String, enum: ['active', 'managed', 'resolved'] },
      notes: String
    }],
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      prescribedBy: String,
      startDate: Date,
      endDate: Date,
      isActive: { type: Boolean, default: true }
    }],
    surgeries: [{
      procedure: String,
      date: Date,
      hospital: String,
      notes: String
    }],
    familyHistory: [{
      relation: String,
      condition: String,
      ageOfOnset: Number
    }],
    immunizations: [{
      vaccine: String,
      dateAdministered: Date,
      nextDueDate: Date,
      batchNumber: String
    }],
    vitals: {
      bloodPressure: {
        systolic: Number,
        diastolic: Number,
        lastUpdated: Date
      },
      heartRate: { value: Number, lastUpdated: Date },
      temperature: { value: Number, unit: { type: String, default: '°C' }, lastUpdated: Date },
      oxygenSaturation: { value: Number, unit: { type: String, default: '%' }, lastUpdated: Date }
    }
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String,
    isPrimary: { type: Boolean, default: false }
  }
}, { _id: false });

export const NotificationPreferencesSchema = new Schema({
  appointments: { type: Boolean, default: true },
  medications: { type: Boolean, default: true },
  reminders: { type: Boolean, default: true },
  reports: { type: Boolean, default: true },
  healthAlerts: { type: Boolean, default: true },
  wellnessTips: { type: Boolean, default: true },
  sms: { type: Boolean, default: true },
  email: { type: Boolean, default: true },
  push: { type: Boolean, default: true },
  whatsapp: { type: Boolean, default: false }
}, { _id: false });

export const ConsentSchema = new Schema({
  version: { type: String, required: true },
  givenAt: { type: Date, required: true },
  method: {
    type: String,
    enum: ['electronic', 'verbal', 'written'],
    default: 'electronic'
  },
  ipAddress: String,
  anonymousAnalytics: { type: Boolean, default: false },
  researchParticipation: { type: Boolean, default: false },
  thirdPartySharing: { type: Boolean, default: false },
  withdrawalAt: Date,
  withdrawalReason: String
}, { _id: false });

// ============================================
// MAIN SCHEMAS
// ============================================

export interface IUserProfile extends Document {
  userId: string;
  profiles: typeof HealthProfileSchema[];
  preferences: {
    notifications: typeof NotificationPreferencesSchema;
    privacyLevel: 'minimal' | 'balanced' | 'maximum';
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'system';
    dateFormat: string;
    measurementSystem: 'metric' | 'imperial';
  };
  consent: typeof ConsentSchema;
  abhaId?: string;
  externalIds: {
    type: string;
    id: string;
  }[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>({
  userId: { type: String, required: true, unique: true, index: true },
  profiles: { type: [HealthProfileSchema], default: [] },
  preferences: {
    notifications: { type: NotificationPreferencesSchema, default: () => ({}) },
    privacyLevel: {
      type: String,
      enum: ['minimal', 'balanced', 'maximum'],
      default: 'balanced'
    },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    measurementSystem: { type: String, enum: ['metric', 'imperial'], default: 'metric' }
  },
  consent: { type: ConsentSchema, required: true },
  abhaId: { type: String, sparse: true, index: true },
  externalIds: [{
    type: { type: String, required: true },
    id: { type: String, required: true }
  }],
  tags: { type: [String], default: [], index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamps
UserProfileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const UserProfile = mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);

// ============================================
// FAMILY MEMBER SCHEMA (Separate collection for large families)
// ============================================

export interface IFamilyMember extends Document {
  id: string;
  userId: string;
  profile: typeof HealthProfileSchema;
  accessLevel: 'full' | 'limited' | 'emergency_only';
  shareHealthData: boolean;
  shareLocation: boolean;
  shareAppointments: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FamilyMemberSchema = new Schema<IFamilyMember>({
  id: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  profile: { type: HealthProfileSchema, required: true },
  accessLevel: {
    type: String,
    enum: ['full', 'limited', 'emergency_only'],
    default: 'limited'
  },
  shareHealthData: { type: Boolean, default: false },
  shareLocation: { type: Boolean, default: false },
  shareAppointments: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

FamilyMemberSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const FamilyMember = mongoose.model<IFamilyMember>('FamilyMember', FamilyMemberSchema);

// ============================================
// PROFILE ACCESS LOG
// ============================================

export interface IProfileAccessLog extends Document {
  userId: string;
  accessorId: string;
  accessorType: 'user' | 'caregiver' | 'doctor' | 'system';
  profileId: string;
  action: 'read' | 'update' | 'delete';
  fieldsAccessed: string[];
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

const ProfileAccessLogSchema = new Schema<IProfileAccessLog>({
  userId: { type: String, required: true, index: true },
  accessorId: { type: String, required: true },
  accessorType: {
    type: String,
    enum: ['user', 'caregiver', 'doctor', 'system'],
    required: true
  },
  profileId: { type: String, required: true },
  action: { type: String, enum: ['read', 'update', 'delete'], required: true },
  fieldsAccessed: { type: [String], default: [] },
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now }
});

ProfileAccessLogSchema.index({ userId: 1, timestamp: -1 });
ProfileAccessLogSchema.index({ accessorId: 1, timestamp: -1 });

export const ProfileAccessLog = mongoose.model<IProfileAccessLog>('ProfileAccessLog', ProfileAccessLogSchema);

export default {
  UserProfile,
  FamilyMember,
  ProfileAccessLog
};
