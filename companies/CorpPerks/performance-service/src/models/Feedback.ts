import mongoose, { Schema, Document } from 'mongoose';
import type { IFeedback, IRating, FeedbackType } from '../types/index.js';

export interface IFeedbackDocument extends Omit<IFeedback, '_id'>, Document {}

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

const FeedbackSchema = new Schema<IFeedbackDocument>(
  {
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: 'ReviewCycle',
      required: [true, 'Cycle ID is required'],
      index: true,
    },
    fromUserId: {
      type: String,
      required: [true, 'From user ID is required'],
      index: true,
    },
    toUserId: {
      type: String,
      required: [true, 'To user ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['peer', 'manager', 'direct_report', 'self', 'upward'],
        message: 'Invalid feedback type: {VALUE}',
      },
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Feedback content is required'],
      maxlength: [10000, 'Content cannot exceed 10000 characters'],
    },
    ratings: {
      type: [RatingSchema],
      default: [],
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        // Hide fromUserId if anonymous
        if (ret.isAnonymous) {
          ret.fromUserId = 'anonymous';
        }
        return ret;
      },
    },
  }
);

// Indexes
FeedbackSchema.index({ cycleId: 1, toUserId: 1 });
FeedbackSchema.index({ cycleId: 1, fromUserId: 1 });
FeedbackSchema.index({ cycleId: 1, type: 1 });
FeedbackSchema.index({ toUserId: 1, type: 1 });
FeedbackSchema.index({ fromUserId: 1, type: 1 });
FeedbackSchema.index({ cycleId: 1, toUserId: 1, fromUserId: 1 }, { unique: true });

// Pre-save validation for self-feedback
FeedbackSchema.pre('save', function (next) {
  if (this.type === 'self' && this.fromUserId !== this.toUserId) {
    const error = new Error('Self feedback must be from the same user');
    return next(error);
  }
  next();
});

// Calculate average rating
FeedbackSchema.methods.getAverageRating = function (): number | null {
  if (this.ratings.length === 0) return null;

  const sum = this.ratings.reduce((acc, r) => acc + r.score, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10;
};

// Static methods
FeedbackSchema.statics.findByRecipient = function (toUserId: string, cycleId?: string) {
  const query: Record<string, unknown> = { toUserId };
  if (cycleId) query.cycleId = cycleId;
  return this.find(query).sort({ createdAt: -1 });
};

FeedbackSchema.statics.findByGiver = function (fromUserId: string, cycleId?: string) {
  const query: Record<string, unknown> = { fromUserId };
  if (cycleId) query.cycleId = cycleId;
  return this.find(query).sort({ createdAt: -1 });
};

FeedbackSchema.statics.findByCycleAndType = function (cycleId: string, type: FeedbackType) {
  return this.find({ cycleId, type }).sort({ createdAt: -1 });
};

FeedbackSchema.statics.find360ForUser = function (toUserId: string, cycleId: string) {
  return this.find({ toUserId, cycleId }).sort({ type: 1, createdAt: -1 });
};

FeedbackSchema.statics.getFeedbackSummary = async function (
  toUserId: string,
  cycleId: string
): Promise<{ type: FeedbackType; avgRating: number | null; count: number }[]> {
  const feedbacks = await this.aggregate([
    { $match: { toUserId, cycleId: new mongoose.Types.ObjectId(cycleId) } },
    {
      $group: {
        _id: '$type',
        avgRating: { $avg: { $avg: '$ratings.score' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return feedbacks.map((f) => ({
    type: f._id as FeedbackType,
    avgRating: f.avgRating ? Math.round(f.avgRating * 10) / 10 : null,
    count: f.count,
  }));
};

export const Feedback = mongoose.model<IFeedbackDocument>('Feedback', FeedbackSchema);
