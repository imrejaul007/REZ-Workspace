import mongoose, { Schema } from 'mongoose';
import { IEmployee, ILeaveBalance } from '../types/index.js';

const leaveBalanceSchema = new Schema<ILeaveBalance>({
  sick: { type: Number, default: 12 },
  casual: { type: Number, default: 10 },
  earned: { type: Number, default: 0 },
  wfh: { type: Number, default: 6 },
  annual: { type: Number, default: 20 },
});

const employeeSchema = new Schema<IEmployee>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    employeeId: { type: String, required: true },
    corpId: {
      type: String,
      index: true,
      sparse: true, // Allow null values while maintaining unique-like behavior
    },                                        // CorpID v2.0: Links to CI-IND-XXXXX
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String },
    avatar: { type: String },
    dateOfBirth: { type: Date },
    joiningDate: { type: Date, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    managerId: { type: String },
    corpIdManager: { type: String },         // CorpID v2.0: Manager's CorpID
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'intern'],
      default: 'full_time',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave', 'terminated'],
      default: 'active',
    },
    leaveBalance: { type: leaveBalanceSchema, default: () => ({}) },
    attendanceEnabled: { type: Boolean, default: true },
    geoFenceEnabled: { type: Boolean, default: false },
    geoFenceRadius: { type: Number, default: 100 },
    corpIdSyncStatus: {                     // CorpID v2.0: Sync tracking
      type: String,
      enum: ['synced', 'pending', 'error'],
      default: 'pending',
    },
    lastSyncedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    terminatedAt: { type: Date },
  },
  { timestamps: true }
);

employeeSchema.index({ tenantId: 1, employeeId: 1 }, { unique: true });
employeeSchema.index({ tenantId: 1, department: 1 });
employeeSchema.index({ tenantId: 1, managerId: 1 });
employeeSchema.index({ email: 1 });
employeeSchema.index({ corpId: 1 });                          // CorpID v2.0: Quick CorpID lookup
employeeSchema.index({ corpIdManager: 1 });                   // CorpID v2.0: Manager CorpID lookup

employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
