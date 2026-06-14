import mongoose, { Schema } from 'mongoose';
import { IShiftRequest, ShiftRequestType, ShiftRequestStatus } from '../types';

const ShiftRequestSchema = new Schema<IShiftRequest>(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      index: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(ShiftRequestType),
      required: [true, 'Request type is required'],
    },
    reason: {
      type: String,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: Object.values(ShiftRequestStatus),
      default: ShiftRequestStatus.PENDING,
      index: true,
    },
    reviewedBy: {
      type: String,
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

// Indexes for efficient queries
ShiftRequestSchema.index({ employeeId: 1, status: 1 });
ShiftRequestSchema.index({ employeeId: 1, date: 1 });
ShiftRequestSchema.index({ type: 1, status: 1 });
ShiftRequestSchema.index({ createdAt: -1 });

export const ShiftRequest = mongoose.model<IShiftRequest>('ShiftRequest', ShiftRequestSchema);
