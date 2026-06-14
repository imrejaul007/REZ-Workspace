import mongoose, { Schema, Document } from 'mongoose';
import type { IReviewCycle, ReviewCycleStatus } from '../types/index.js';

export interface IReviewCycleDocument extends Omit<IReviewCycle, '_id'>, Document {}

const ReviewCycleSchema = new Schema<IReviewCycleDocument>(
  {
    name: {
      type: String,
      required: [true, 'Review cycle name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'active', 'completed', 'cancelled'],
        message: 'Invalid status: {VALUE}',
      },
      default: 'draft',
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    participantIds: {
      type: [String],
      default: [],
      index: true,
    },
    reviewTemplateId: {
      type: String,
      index: true,
    },
    createdBy: {
      type: String,
      required: [true, 'Created by user ID is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
ReviewCycleSchema.index({ status: 1, startDate: 1 });
ReviewCycleSchema.index({ status: 1, endDate: 1 });
ReviewCycleSchema.index({ name: 'text', description: 'text' });

// Pre-save validation
ReviewCycleSchema.pre('save', function (next) {
  if (this.startDate >= this.endDate) {
    const error = new Error('End date must be after start date');
    return next(error);
  }
  next();
});

// Static methods
ReviewCycleSchema.statics.findActive = function () {
  return this.find({ status: 'active' }).sort({ startDate: -1 });
};

ReviewCycleSchema.statics.findByStatus = function (status: ReviewCycleStatus) {
  return this.find({ status }).sort({ startDate: -1 });
};

export const ReviewCycle = mongoose.model<IReviewCycleDocument>('ReviewCycle', ReviewCycleSchema);
