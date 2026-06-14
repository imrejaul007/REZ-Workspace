import mongoose, { Schema } from 'mongoose';
import { IShiftSwap, SwapStatus } from '../types';

const ShiftSwapSchema = new Schema<IShiftSwap>(
  {
    requesterId: {
      type: String,
      required: [true, 'Requester ID is required'],
      index: true,
    },
    targetId: {
      type: String,
      required: [true, 'Target employee ID is required'],
      index: true,
    },
    shiftId: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      required: [true, 'Shift ID is required'],
    },
    status: {
      type: String,
      enum: Object.values(SwapStatus),
      default: SwapStatus.PENDING,
      index: true,
    },
    reason: {
      type: String,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    approvedBy: {
      type: String,
    },
    approvedAt: {
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
ShiftSwapSchema.index({ requesterId: 1, status: 1 });
ShiftSwapSchema.index({ targetId: 1, status: 1 });
ShiftSwapSchema.index({ shiftId: 1 });
ShiftSwapSchema.index({ createdAt: -1 });

// Prevent duplicate pending swap requests for same shift and requester
ShiftSwapSchema.index(
  { requesterId: 1, shiftId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: SwapStatus.PENDING },
  }
);

export const ShiftSwap = mongoose.model<IShiftSwap>('ShiftSwap', ShiftSwapSchema);
