import mongoose, { Schema } from 'mongoose';
import { IShiftCoverage } from '../types';

const ShiftCoverageSchema = new Schema<IShiftCoverage>(
  {
    shiftId: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      required: [true, 'Shift ID is required'],
      index: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'],
      index: true,
    },
    required: {
      type: Number,
      required: [true, 'Required coverage is required'],
      min: [1, 'At least 1 employee required'],
    },
    assigned: {
      type: Number,
      default: 0,
      min: [0, 'Assigned count cannot be negative'],
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
ShiftCoverageSchema.index({ date: 1 });
ShiftCoverageSchema.index({ shiftId: 1, date: 1 });
ShiftCoverageSchema.index({ date: 1, required: 1, assigned: 1 });

// Virtual for coverage percentage
ShiftCoverageSchema.virtual('coveragePercentage').get(function () {
  if (this.required === 0) return 100;
  return Math.round((this.assigned / this.required) * 100);
});

// Ensure virtuals are included in JSON output
ShiftCoverageSchema.set('toJSON', { virtuals: true });
ShiftCoverageSchema.set('toObject', { virtuals: true });

export const ShiftCoverage = mongoose.model<IShiftCoverage>('ShiftCoverage', ShiftCoverageSchema);
