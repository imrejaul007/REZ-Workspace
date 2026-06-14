import mongoose, { Schema, Document } from 'mongoose';
import type { IReview, IRating, ReviewStatus } from '../types/index.js';

export interface IReviewDocument extends Omit<IReview, '_id'>, Document {}

const RatingSchema = new Schema<IRating>(
  {
    category: {
      type: String,
      enum: {
        values: ['performance', 'competency', 'goal', 'overall'],
        message: 'Invalid rating category: {VALUE}',
      },
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: [1, 'Score must be at least 1'],
      max: [5, 'Score cannot exceed 5'],
    },
    comment: {
      type: String,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
  },
  { _id: false }
);

const ReviewSchema = new Schema<IReviewDocument>(
  {
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: 'ReviewCycle',
      required: [true, 'Cycle ID is required'],
      index: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      index: true,
    },
    reviewerId: {
      type: String,
      index: true,
    },
    ratings: {
      type: [RatingSchema],
      default: [],
    },
    feedback: {
      type: String,
      maxlength: [10000, 'Feedback cannot exceed 10000 characters'],
    },
    strengths: {
      type: String,
      maxlength: [5000, 'Strengths cannot exceed 5000 characters'],
    },
    improvements: {
      type: String,
      maxlength: [5000, 'Improvements cannot exceed 5000 characters'],
    },
    recommendations: {
      type: String,
      maxlength: [5000, 'Recommendations cannot exceed 5000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'in_progress', 'submitted', 'acknowledged'],
        message: 'Invalid status: {VALUE}',
      },
      default: 'pending',
      index: true,
    },
    submittedAt: {
      type: Date,
    },
    acknowledgedAt: {
      type: Date,
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

// Compound indexes for common queries
ReviewSchema.index({ cycleId: 1, employeeId: 1 }, { unique: true });
ReviewSchema.index({ cycleId: 1, reviewerId: 1 });
ReviewSchema.index({ employeeId: 1, status: 1 });
ReviewSchema.index({ status: 1, updatedAt: 1 });

// Pre-submit validation
ReviewSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'submitted' && !this.submittedAt) {
    this.submittedAt = new Date();
  }
  if (this.isModified('status') && this.status === 'acknowledged' && !this.acknowledgedAt) {
    this.acknowledgedAt = new Date();
  }
  next();
});

// Calculate overall score from ratings
ReviewSchema.methods.getOverallScore = function (): number | null {
  const overallRating = this.ratings.find((r) => r.category === 'overall');
  if (overallRating) return overallRating.score;

  const nonOverallRatings = this.ratings.filter((r) => r.category !== 'overall');
  if (nonOverallRatings.length === 0) return null;

  const sum = nonOverallRatings.reduce((acc, r) => acc + r.score, 0);
  return Math.round((sum / nonOverallRatings.length) * 10) / 10;
};

// Static methods
ReviewSchema.statics.findByEmployee = function (employeeId: string, cycleId?: string) {
  const query: Record<string, unknown> = { employeeId };
  if (cycleId) query.cycleId = cycleId;
  return this.find(query).sort({ createdAt: -1 });
};

ReviewSchema.statics.findByReviewer = function (reviewerId: string, cycleId?: string) {
  const query: Record<string, unknown> = { reviewerId };
  if (cycleId) query.cycleId = cycleId;
  return this.find(query).sort({ createdAt: -1 });
};

ReviewSchema.statics.findPendingByCycle = function (cycleId: string) {
  return this.find({ cycleId, status: { $in: ['pending', 'in_progress'] } })
    .populate('cycleId')
    .sort({ createdAt: 1 });
};

export const Review = mongoose.model<IReviewDocument>('Review', ReviewSchema);
