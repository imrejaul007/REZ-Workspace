/**
 * MongoDB Connection
 * PeopleOS Database
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/peopleos';

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// ─── Employee Schema ───────────────────────────────────────────────────

export const EmployeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true },
  department: String,
  role: String,
  salary: Number,
  status: { type: String, enum: ['active', 'inactive', 'probation'], default: 'active' },
  joinDate: Date,
  qrCode: String,
});

export const AttendanceSchema = new mongoose.Schema({
  employeeId: String,
  date: Date,
  checkIn: Date,
  checkOut: Date,
  location: { lat: Number, lng: Number, address: String },
  status: { type: String, enum: ['present', 'late', 'absent', 'wfh'], default: 'present' },
});

export const LeaveSchema = new mongoose.Schema({
  employeeId: String,
  type: String,
  startDate: Date,
  endDate: Date,
  reason: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: String,
});

export const ExpenseSchema = new mongoose.Schema({
  employeeId: String,
  title: String,
  amount: Number,
  category: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  receipt: String,
  date: { type: Date, default: Date.now },
});

export const PayrollSchema = new mongoose.Schema({
  employeeId: String,
  month: String,
  gross: Number,
  deductions: Number,
  net: Number,
  status: { type: String, enum: ['calculated', 'approved', 'paid'], default: 'calculated' },
  paidAt: Date,
});

// ─── Models ─────────────────────────────────────────────────────────

export const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
export const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
export const Leave = mongoose.models.Leave || mongoose.model('Leave', LeaveSchema);
export const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
export const Payroll = mongoose.models.Payroll || mongoose.model('Payroll', PayrollSchema);
