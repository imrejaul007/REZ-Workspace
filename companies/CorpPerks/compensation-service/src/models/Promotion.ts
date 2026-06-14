import mongoose, { Schema, Document } from 'mongoose';
import { IPromotion } from '../types/index.js';

export interface PromotionDocument extends Omit<IPromotion, '_id'>, Document {}

const promotionSchema = new Schema<PromotionDocument>(
  {
    employeeId: {
      type: String,
      required: true,
      trim: true,
    },
    oldBandId: {
      type: Schema.Types.ObjectId,
      ref: 'SalaryBand',
      required: true,
    },
    newBandId: {
      type: Schema.Types.ObjectId,
      ref: 'SalaryBand',
      required: true,
    },
    oldSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    newSalary: {
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
      enum: ['pending', 'approved', 'rejected', 'processed'],
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
    processedBy: {
      type: String,
      default: null,
    },
    processedAt: {
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
promotionSchema.index({ employeeId: 1 });
promotionSchema.index({ status: 1 });
promotionSchema.index({ effectiveDate: 1 });
promotionSchema.index({ employeeId: 1, status: 1 });

export const Promotion = mongoose.model<PromotionDocument>('Promotion', promotionSchema);
