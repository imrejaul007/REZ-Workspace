import mongoose, { Schema, Document } from 'mongoose';
import { IIncrementPlan } from '../types/index.js';

export interface IncrementPlanDocument extends Omit<IIncrementPlan, '_id'>, Document {}

const criteriaSchema = new Schema(
  {
    minPerformanceRating: { type: Number, default: 1, min: 1, max: 5 },
    maxPerformanceRating: { type: Number, default: 5, min: 1, max: 5 },
    eligibilityType: {
      type: String,
      enum: ['all', 'performance_based', 'tenure_based'],
      default: 'all',
    },
    minTenureMonths: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const incrementPlanSchema = new Schema<IncrementPlanDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    fiscalYear: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    criteria: {
      type: criteriaSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ['draft', 'planned', 'approved', 'rejected'],
      default: 'draft',
    },
    plannedDate: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    approvedBy: {
      type: String,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
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
incrementPlanSchema.index({ fiscalYear: 1 });
incrementPlanSchema.index({ status: 1 });
incrementPlanSchema.index({ fiscalYear: 1, status: 1 });

export const IncrementPlan = mongoose.model<IncrementPlanDocument>('IncrementPlan', incrementPlanSchema);
