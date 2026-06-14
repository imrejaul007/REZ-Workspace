import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  employeeId: string;
  companyId: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  department: string;
  role: string;
  designation: string;
  salary: number;
  joiningDate: Date;
  tenure: number;
  status: 'active' | 'inactive' | 'onboarding' | 'exit';
  avatar?: string;
  manager?: string;
  skills: string[];
  experience: number;
  education: {
    degree: string;
    institution: string;
    year: number;
  }[];
  address?: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  bankDetails?: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>({
  employeeId: { type: String, required: true, unique: true },
  companyId: { type: String, required: true, index: true },
  email: { type: String, required: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: String,
  department: { type: String, required: true },
  role: { type: String, required: true },
  designation: { type: String, required: true },
  salary: { type: Number, required: true },
  joiningDate: { type: Date, required: true },
  tenure: Number,
  status: { type: String, enum: ['active', 'inactive', 'onboarding', 'exit'], default: 'active' },
  avatar: String,
  manager: String,
  skills: [String],
  experience: Number,
  education: [{
    degree: String,
    institution: String,
    year: Number,
  }],
  address: {
    line1: String,
    city: String,
    state: String,
    pincode: String,
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String,
  },
  bankDetails: {
    accountNumber: String,
    ifsc: String,
    bankName: String,
  },
}, { timestamps: true });

EmployeeSchema.index({ companyId: 1, department: 1 });
EmployeeSchema.index({ email: 1 });

export const Employee = mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);
