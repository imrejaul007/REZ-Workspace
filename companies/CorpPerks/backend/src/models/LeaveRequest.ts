import mongoose, { Schema } from 'mongoose';
import { ILeaveRequest, LeaveType, LeaveStatus } from '../types/index.js';

const leaveRequestSchema = new Schema<ILeaveRequest>(
  {
    tenantId: { type: String, required: true, index: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    leaveType: {
      type: String,
      enum: ['sick', 'casual', 'earned', 'wfh', 'annual', 'unpaid'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

leaveRequestSchema.index({ tenantId: 1, employeeId: 1 });
leaveRequestSchema.index({ tenantId: 1, status: 1 });
leaveRequestSchema.index({ startDate: 1, endDate: 1 });

export const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', leaveRequestSchema);
