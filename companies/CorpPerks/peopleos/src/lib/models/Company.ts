import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  companyId: string;
  name: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  website?: string;
  logo?: string;
  address: {
    line1: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  settings: {
    workStartTime: string;
    workEndTime: string;
    weekOffDays: string[];
    leavePolicy: {
      annual: number;
      sick: number;
      casual: number;
    };
    probationPeriod: number;
    noticePeriod: number;
  };
  subscription: {
    plan: 'free' | 'starter' | 'professional' | 'enterprise';
    startDate: Date;
    endDate: Date;
    employeeLimit: number;
  };
  status: 'active' | 'suspended' | 'trial';
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>({
  companyId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  industry: { type: String, required: true },
  size: { type: String, enum: ['startup', 'small', 'medium', 'large', 'enterprise'], default: 'small' },
  website: String,
  logo: String,
  address: {
    line1: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: 'India' },
    pincode: String,
  },
  settings: {
    workStartTime: { type: String, default: '09:00' },
    workEndTime: { type: String, default: '18:00' },
    weekOffDays: { type: [String], default: ['Sunday'] },
    leavePolicy: {
      annual: { type: Number, default: 24 },
      sick: { type: Number, default: 12 },
      casual: { type: Number, default: 6 },
    },
    probationPeriod: { type: Number, default: 3 },
    noticePeriod: { type: Number, default: 30 },
  },
  subscription: {
    plan: { type: String, enum: ['free', 'starter', 'professional', 'enterprise'], default: 'trial' },
    startDate: Date,
    endDate: Date,
    employeeLimit: { type: Number, default: 10 },
  },
  status: { type: String, enum: ['active', 'suspended', 'trial'], default: 'active' },
}, { timestamps: true });

export const Company = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
