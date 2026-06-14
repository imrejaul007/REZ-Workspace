import mongoose, { Schema, Document, Types } from 'mongoose';
import { ICompensationPackage } from '../types/index.js';

export interface CompensationPackageDocument extends Omit<ICompensationPackage, '_id'>, Document {}

const equitySchema = new Schema(
  {
    shares: { type: Number, default: 0, min: 0 },
    vestingPeriodMonths: { type: Number, default: 48, min: 0 },
    strikePrice: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const benefitsSchema = new Schema(
  {
    healthInsurance: { type: Number, default: 0, min: 0 },
    retirement: { type: Number, default: 0, min: 0 },
    allowances: { type: Map, of: Number, default: new Map() },
    otherBenefits: { type: Map, of: Number, default: new Map() },
  },
  { _id: false }
);

const compensationPackageSchema = new Schema<CompensationPackageDocument>(
  {
    employeeId: {
      type: String,
      required: true,
      trim: true,
    },
    bandId: {
      type: Schema.Types.ObjectId,
      ref: 'SalaryBand',
      required: true,
    },
    salary: {
      type: Number,
      required: true,
      min: 0,
    },
    equity: {
      type: equitySchema,
      default: () => ({}),
    },
    benefits: {
      type: benefitsSchema,
      default: () => ({}),
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
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
compensationPackageSchema.index({ employeeId: 1 });
compensationPackageSchema.index({ bandId: 1 });
compensationPackageSchema.index({ employeeId: 1, bandId: 1 }, { unique: true });

export const CompensationPackage = mongoose.model<CompensationPackageDocument>(
  'CompensationPackage',
  compensationPackageSchema
);
