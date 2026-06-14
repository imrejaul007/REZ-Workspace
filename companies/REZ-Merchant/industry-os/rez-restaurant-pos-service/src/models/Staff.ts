/**
 * MongoDB Models for Staff Service
 */

import mongoose, { Schema, Document } from 'mongoose'

// ============ STAFF ============

export interface IStaff extends Document {
  employeeId: string
  name: string
  phone: string
  email?: string
  role: 'owner' | 'manager' | 'captain' | 'server' | 'chef' | 'kitchen' | 'helper' | 'cashier'
  department?: string
  merchantId: string
  storeId?: string
  hireDate: Date
  salary: number
  isActive: boolean
  pin?: string
  permissions: string[]
  emergencyContact?: {
    name: string
    phone: string
    relation: string
  }
  createdAt: Date
  updatedAt: Date
}

const StaffSchema = new Schema<IStaff>({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  role: {
    type: String,
    enum: ['owner', 'manager', 'captain', 'server', 'chef', 'kitchen', 'helper', 'cashier'],
    required: true,
    index: true
  },
  department: String,
  merchantId: { type: String, required: true, index: true },
  storeId: { type: String, index: true },
  hireDate: { type: Date, default: Date.now },
  salary: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true },
  pin: String,
  permissions: [String],
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  }
}, { timestamps: true })

StaffSchema.index({ merchantId: 1, isActive: 1 })
StaffSchema.index({ merchantId: 1, role: 1 })

// ============ SHIFT ============

export interface IShift extends Document {
  staffId: mongoose.Types.ObjectId
  merchantId: string
  storeId?: string
  date: Date
  startTime: string
  endTime: string
  breakMinutes: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed'
  checkIn?: Date
  checkOut?: Date
  breakTaken: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const ShiftSchema = new Schema<IShift>({
  staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  storeId: { type: String, index: true },
  date: { type: Date, required: true, index: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  breakMinutes: { type: Number, default: 30 },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'missed'],
    default: 'scheduled',
    index: true
  },
  checkIn: Date,
  checkOut: Date,
  breakTaken: { type: Number, default: 0 },
  notes: String
}, { timestamps: true })

ShiftSchema.index({ merchantId: 1, date: 1, status: 1 })
ShiftSchema.index({ staffId: 1, date: 1 })

// ============ ATTENDANCE ============

export interface IAttendance extends Document {
  staffId: mongoose.Types.ObjectId
  merchantId: string
  storeId?: string
  date: Date
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave'
  totalHours: number
  overtimeHours: number
  notes?: string
  createdAt: Date
}

const AttendanceSchema = new Schema<IAttendance>({
  staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  storeId: { type: String, index: true },
  date: { type: Date, required: true, index: true },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half_day', 'leave'],
    required: true
  },
  totalHours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  notes: String
}, { timestamps: true })

AttendanceSchema.index({ staffId: 1, date: 1 }, { unique: true })
AttendanceSchema.index({ merchantId: 1, date: 1 })

// ============ PAYROLL ============

export interface IPayroll extends Document {
  staffId: mongoose.Types.ObjectId
  merchantId: string
  storeId?: string
  startDate: Date
  endDate: Date
  shifts: number
  hours: number
  overtimeHours: number
  baseSalary: number
  overtimePay: number
  bonuses: number
  deductions: number
  advances: number
  netPay: number
  status: 'pending' | 'processed' | 'paid'
  processedAt?: Date
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PayrollSchema = new Schema<IPayroll>({
  staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  storeId: { type: String, index: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  shifts: { type: Number, default: 0 },
  hours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  baseSalary: { type: Number, default: 0 },
  overtimePay: { type: Number, default: 0 },
  bonuses: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  advances: { type: Number, default: 0 },
  netPay: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'processed', 'paid'],
    default: 'pending',
    index: true
  },
  processedAt: Date,
  paidAt: Date
}, { timestamps: true })

PayrollSchema.index({ staffId: 1, startDate: -1 })
PayrollSchema.index({ merchantId: 1, status: 1 })

// Export models
let Staff: mongoose.Model<IStaff>
let Shift: mongoose.Model<IShift>
let Attendance: mongoose.Model<IAttendance>
let Payroll: mongoose.Model<IPayroll>

export function getStaffModels(connection: mongoose.Connection) {
  Staff = connection.models.Staff || connection.model<IStaff>('Staff', StaffSchema)
  Shift = connection.models.Shift || connection.model<IShift>('Shift', ShiftSchema)
  Attendance = connection.models.Attendance || connection.model<IAttendance>('Attendance', AttendanceSchema)
  Payroll = connection.models.Payroll || connection.model<IPayroll>('Payroll', PayrollSchema)

  return { Staff, Shift, Attendance, Payroll }
}

export { StaffSchema, ShiftSchema, AttendanceSchema, PayrollSchema }
