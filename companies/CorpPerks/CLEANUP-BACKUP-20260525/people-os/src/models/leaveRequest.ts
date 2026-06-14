/**
 * Leave Request Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaveRequest extends Document {
  requestNumber: string;
  employeeId: string;
  organizationId: string;
  leaveType: 'annual' | 'sick' | 'casual' | 'unpaid' | 'maternity' | 'paternity' | 'bereavement';
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled';
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  isHalfDay: boolean;
  halfDaySession?: 'morning' | 'afternoon';
  documents?: {
    type: 'medical' | 'travel' | 'emergency' | 'other';
    filename: string;
    url: string;
    uploadedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>({
  requestNumber: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true, index: true },
  organizationId: { type: String, required: true, index: true },
  leaveType: {
    type: String,
    enum: ['annual', 'sick', 'casual', 'unpaid', 'maternity', 'paternity', 'bereavement'],
    required: true,
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected', 'cancelled'],
    default: 'draft',
  },
  submittedAt: Date,
  approvedBy: String,
  approvedAt: Date,
  rejectedBy: String,
  rejectedAt: Date,
  rejectionReason: String,
  isHalfDay: { type: Boolean, default: false },
  halfDaySession: String,
  documents: [{
    type: { type: String, enum: ['medical', 'travel', 'emergency', 'other'] },
    filename: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

LeaveRequestSchema.index({ requestNumber: 1 }, { unique: true });
LeaveRequestSchema.index({ employeeId: 1, status: 1 });
LeaveRequestSchema.index({ organizationId: 1, status: 1 });
LeaveRequestSchema.index({ employeeId: 1, startDate: 1, endDate: 1 });

export const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);
