import mongoose, { Document, Schema } from 'mongoose';

export interface IPatientAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IPatientEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface IPatientInsurance {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  expirationDate: Date;
  primaryHolder?: string;
}

export interface IPatient {
  patientId: string;
  userId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  email: string;
  phone: string;
  address?: IPatientAddress;
  emergencyContact?: IPatientEmergencyContact;
  insurance?: IPatientInsurance;
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies: string[];
  chronicConditions: string[];
  medications: string[];
  medicalHistory: string[];
  primaryPhysician?: string;
  preferredLanguage: string;
  consentGiven: boolean;
  consentDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPatientDocument extends Omit<IPatient, '_id'>, Document {}

const PatientSchema = new Schema<IPatientDocument>(
  {
    patientId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say'],
      required: true,
    },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String,
    },
    insurance: {
      provider: String,
      policyNumber: String,
      groupNumber: String,
      expirationDate: Date,
      primaryHolder: String,
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    allergies: { type: [String], default: [] },
    chronicConditions: { type: [String], default: [] },
    medications: { type: [String], default: [] },
    medicalHistory: { type: [String], default: [] },
    primaryPhysician: { type: String },
    preferredLanguage: { type: String, default: 'en' },
    consentGiven: { type: Boolean, default: false },
    consentDate: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

PatientSchema.index({ email: 1 });
PatientSchema.index({ phone: 1 });
PatientSchema.index({ 'lastName': 1, 'firstName': 1 });

export const Patient = mongoose.model<IPatientDocument>('Patient', PatientSchema);
