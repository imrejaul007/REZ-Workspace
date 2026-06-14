import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployeeHealth extends Document {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyId: string;
  department?: string;
  designation?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies: string[];
  conditions: string[];
  medications: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  consentGiven: boolean;
  consentDate?: Date;
  syncedAt: Date;
  lastSyncedAt?: Date;
  metadata?: Record<string, unknown>;
}

const EmployeeHealthSchema = new Schema<IEmployeeHealth>({
  employeeId: { type: String, required: true, unique: true, index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  companyId: { type: String, required: true, index: true },
  department: { type: String },
  designation: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  allergies: [{ type: String }],
  conditions: [{ type: String }],
  medications: [{ type: String }],
  emergencyContact: {
    name: { type: String },
    phone: { type: String },
    relationship: { type: String },
  },
  consentGiven: { type: Boolean, default: false },
  consentDate: { type: Date },
  syncedAt: { type: Date, default: Date.now },
  lastSyncedAt: { type: Date },
  metadata: { type: Schema.Types.Mixed },
});

EmployeeHealthSchema.index({ email: 1 });
EmployeeHealthSchema.index({ consentGiven: 1 });
EmployeeHealthSchema.index({ companyId: 1, department: 1 });

export const EmployeeHealth = mongoose.model<IEmployeeHealth>('EmployeeHealth', EmployeeHealthSchema);
