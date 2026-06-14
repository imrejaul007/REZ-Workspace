import mongoose, { Schema, Document } from 'mongoose';

export interface ILeave extends Document {
  employeeId: string;
  companyId: string;
  type: 'sick' | 'casual' | 'earned' | 'unpaid' | 'maternity' | 'paternity' | 'bereavement';
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approverId?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
}

const LeaveSchema = new Schema<ILeave>({
  employeeId: { type: String, required: true, index: true },
  companyId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['sick', 'casual', 'earned', 'unpaid', 'maternity', 'paternity', 'bereavement'],
    required: true
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
  approverId: String,
  approvedAt: Date,
  rejectionReason: String,
}, { timestamps: true });

LeaveSchema.index({ employeeId: 1, status: 1 });
LeaveSchema.index({ companyId: 1, startDate: -1 });

export const Leave = mongoose.models.Leave || mongoose.model<ILeave>('Leave', LeaveSchema);
