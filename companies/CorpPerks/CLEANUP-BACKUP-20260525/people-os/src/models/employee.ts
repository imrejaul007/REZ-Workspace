/**
 * Employee Self-Service Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
  employeeId: string;
  organizationId: string;
  departmentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  joiningDate: Date;
  designation: string;
  managerId?: string;
  status: 'active' | 'on_leave' | 'terminated' | 'resigned';
  leaveBalances: {
    annual: number;
    sick: number;
    casual: number;
    unpaid: number;
  };
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>({
  employeeId: { type: String, required: true, unique: true },
  organizationId: { type: String, required: true, index: true },
  departmentId: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  dateOfBirth: Date,
  joiningDate: { type: Date, required: true },
  designation: { type: String, required: true },
  managerId: String,
  status: { type: String, enum: ['active', 'on_leave', 'terminated', 'resigned'], default: 'active' },
  leaveBalances: {
    annual: { type: Number, default: 18 },
    sick: { type: Number, default: 12 },
    casual: { type: Number, default: 6 },
    unpaid: { type: Number, default: 0 },
  },
  profileImage: String,
}, { timestamps: true });

EmployeeSchema.index({ employeeId: 1 }, { unique: true });
EmployeeSchema.index({ organizationId: 1, status: 1 });
EmployeeSchema.index({ email: 1 }, { unique: true });

export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);
