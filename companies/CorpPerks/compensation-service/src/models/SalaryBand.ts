import mongoose, { Schema, Document } from 'mongoose';
import { ISalaryBand } from '../types/index.js';

export interface SalaryBandDocument extends Omit<ISalaryBand, '_id'>, Document {}

const salaryBandSchema = new Schema<SalaryBandDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    minSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    maxSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    level: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    currency: {
      type: String,
      default: 'INR',
      maxlength: 3,
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

// Validation: maxSalary should be greater than minSalary
salaryBandSchema.pre('save', function (next) {
  if (this.maxSalary <= this.minSalary) {
    next(new Error('maxSalary must be greater than minSalary'));
    return;
  }
  next();
});

// Indexes
salaryBandSchema.index({ level: 1 });
salaryBandSchema.index({ name: 1 }, { unique: true });

export const SalaryBand = mongoose.model<SalaryBandDocument>('SalaryBand', salaryBandSchema);
