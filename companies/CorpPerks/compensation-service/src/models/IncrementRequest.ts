import mongoose, { Schema, Document } from 'mongoose';
import { IIncrementRequest } from '../types/index.js';

export interface IncrementRequestDocument extends Omit<IIncrementRequest, '_id'>, Document {}

const incrementRequestSchema = new Schema<IncrementRequestDocument>(
  {
    employeeId: {
      type: String,
      required: true,
      trim: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'IncrementPlan',
      required: true,
    },
    currentSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    proposedSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
    },
    effectiveDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: {
      type: String,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id?.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
incrementRequestSchema.index({ employeeId: 1 });
incrementRequestSchema.index({ planId: 1 });
incrementRequestSchema.index({ status: 1 });
incrementRequestSchema.index({ employeeId: 1, planId: 1 });

export const IncrementRequest = mongoose.model<IncrementRequestDocument>('IncrementRequest', incrementRequestSchema);
