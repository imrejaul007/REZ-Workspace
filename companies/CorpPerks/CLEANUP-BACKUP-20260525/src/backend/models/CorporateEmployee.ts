import mongoose, { Schema, Document } from 'mongoose';

export type EnrollmentStatus = 'enrolled' | 'pending' | 'suspended' | 'cancelled';
export type CorpRole = 'employee' | 'manager' | 'admin';

export interface ICorporateEmployee extends Document {
  employeeId: string;
  companyId: string;
  email: string;
  name: string;
  phone?: string;
  department: string;
  level: string;
  designation?: string;
  status: EnrollmentStatus;
  role: CorpRole;
  enrolledBenefits: string[];
  enrollmentDate?: Date;
  lastActivity?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CorporateEmployeeSchema = new Schema<ICorporateEmployee>({
  employeeId: { type: String, required: true, unique: true },
  companyId: { type: String, required: true, index: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String },
  department: { type: String, required: true },
  level: { type: String, required: true },
  designation: { type: String },
  status: { type: String, enum: ['enrolled', 'pending', 'suspended', 'cancelled'], default: 'pending' },
  role: { type: String, enum: ['employee', 'manager', 'admin'], default: 'employee' },
  enrolledBenefits: [{ type: String }],
  enrollmentDate: { type: Date },
  lastActivity: { type: Date },
}, { timestamps: true });

CorporateEmployeeSchema.index({ companyId: 1, email: 1 });
CorporateEmployeeSchema.index({ companyId: 1, status: 1 });

export const CorporateEmployee = mongoose.model<ICorporateEmployee>('CorporateEmployee', CorporateEmployeeSchema);
