/**
 * TEAMMIND - HR AI Operating System
 * Production-Ready MongoDB Models
 */

import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// EMPLOYEE MODEL
// ============================================

export interface IEmployee extends Document {
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: Date;
  salary: number;
  status: 'active' | 'onboarding' | 'offboarding' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    joiningDate: { type: Date, default: Date.now },
    salary: { type: Number, required: true },
    status: {
      type: String,
      enum: ['active', 'onboarding', 'offboarding', 'inactive'],
      default: 'onboarding'
    }
  },
  { timestamps: true }
);

EmployeeSchema.index({ email: 1 });
EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ status: 1 });

// ============================================
// DEPARTMENT MODEL
// ============================================

export interface IDepartment extends Document {
  name: string;
  headId?: mongoose.Types.ObjectId;
  budget?: number;
  employeeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true },
    headId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    budget: { type: Number },
    employeeCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

DepartmentSchema.index({ name: 1 });

// ============================================
// LEAVE MODEL
// ============================================

export interface ILeave extends Document {
  employeeId: mongoose.Types.ObjectId;
  type: 'sick' | 'casual' | 'earned' | 'unpaid' | 'maternity' | 'paternity';
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema = new Schema<ILeave>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    type: {
      type: String,
      enum: ['sick', 'casual', 'earned', 'unpaid', 'maternity', 'paternity'],
      required: true
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: { type: String },
    approvedAt: { type: Date }
  },
  { timestamps: true }
);

LeaveSchema.index({ employeeId: 1 });
LeaveSchema.index({ status: 1 });
LeaveSchema.index({ startDate: 1 });

// ============================================
// PAYROLL MODEL
// ============================================

export interface IPayroll extends Document {
  employeeId: mongoose.Types.ObjectId;
  month: string;
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
  tax: number;
  netSalary: number;
  status: 'calculated' | 'approved' | 'paid';
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollSchema = new Schema<IPayroll>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: String, required: true },
    basic: { type: Number, required: true },
    hra: { type: Number, required: true },
    allowances: { type: Number, required: true },
    deductions: { type: Number, required: true },
    tax: { type: Number, required: true },
    netSalary: { type: Number, required: true },
    status: {
      type: String,
      enum: ['calculated', 'approved', 'paid'],
      default: 'calculated'
    },
    paidAt: { type: Date }
  },
  { timestamps: true }
);

PayrollSchema.index({ employeeId: 1 });
PayrollSchema.index({ month: 1 });
PayrollSchema.index({ status: 1 });

// ============================================
// CANDIDATE MODEL
// ============================================

export interface ICandidate extends Document {
  name: string;
  email: string;
  phone: string;
  position: string;
  experience: number;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  resumeUrl?: string;
  source: string;
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema<ICandidate>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    position: { type: String, required: true },
    experience: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'],
      default: 'applied'
    },
    resumeUrl: { type: String },
    source: { type: String, default: 'website' },
    appliedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

CandidateSchema.index({ status: 1 });
CandidateSchema.index({ position: 1 });

// ============================================
// ATTENDANCE MODEL
// ============================================

export interface IAttendance extends Document {
  employeeId: mongoose.Types.ObjectId;
  date: string;
  checkIn?: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'half-day' | 'leave';
  overtime?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    status: {
      type: String,
      enum: ['present', 'absent', 'half-day', 'leave'],
      default: 'present'
    },
    overtime: { type: Number, default: 0 }
  },
  { timestamps: true }
);

AttendanceSchema.index({ employeeId: 1 });
AttendanceSchema.index({ date: 1 });

// ============================================
// EXPORT ALL MODELS
// ============================================

export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);
export const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);
export const Leave = mongoose.model<ILeave>('Leave', LeaveSchema);
export const Payroll = mongoose.model<IPayroll>('Payroll', PayrollSchema);
export const Candidate = mongoose.model<ICandidate>('Candidate', CandidateSchema);
export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);

export const Models = {
  Employee,
  Department,
  Leave,
  Payroll,
  Candidate,
  Attendance
};

export default Models;