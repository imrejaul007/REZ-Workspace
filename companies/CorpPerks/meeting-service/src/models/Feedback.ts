import mongoose, { Schema, Document, Model } from 'mongoose';
import { IFeedback, SentimentType, FeedbackRating } from '../types';

export interface FeedbackDocument extends Omit<IFeedback, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const FeedbackSchema = new Schema<FeedbackDocument>(
  {
    feedbackId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    meetingId: {
      type: String,
      required: true,
      index: true,
    },
    reviewerId: {
      type: String,
      required: true,
      index: true,
    },
    reviewerName: {
      type: String,
      required: true,
    },
    revieweeId: {
      type: String,
      required: true,
      index: true,
    },
    revieweeName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feedbackType: {
      type: String,
      required: true,
      enum: ['meeting_prep', 'engagement', 'action_items', 'communication', 'overall'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'feedbacks',
  }
);

// Indexes
FeedbackSchema.index({ reviewerId: 1, submittedAt: -1 });
FeedbackSchema.index({ revieweeId: 1, submittedAt: -1 });
FeedbackSchema.index({ meetingId: 1, reviewerId: 1 }, { unique: true });

// Virtual for average calculation
FeedbackSchema.virtual('ratingLabel').get(function () {
  const labels: Record<number, string> = {
    1: 'Poor',
    2: 'Below Average',
    3: 'Average',
    4: 'Good',
    5: 'Excellent',
  };
  return labels[this.rating] || 'Unknown';
});

// Static to calculate average rating for a user
FeedbackSchema.statics.getAverageRating = async function (
  userId: string
): Promise<number | null> {
  const result = await this.aggregate([
    {
      $match: {
        $or: [{ reviewerId: userId }, { revieweeId: userId }],
      },
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  return result.length > 0 ? result[0].avgRating : null;
};

// Static to get feedback for a meeting
FeedbackSchema.statics.findByMeeting = function (
  meetingId: string
): Promise<FeedbackDocument[]> {
  return this.find({ meetingId }).sort({ submittedAt: -1 });
};

// Static to get feedback history for a user
FeedbackSchema.statics.getFeedbackHistory = function (
  userId: string,
  options?: { limit?: number; skip?: number }
): Promise<FeedbackDocument[]> {
  return this.find({
    $or: [{ reviewerId: userId }, { revieweeId: userId }],
  })
    .sort({ submittedAt: -1 })
    .skip(options?.skip || 0)
    .limit(options?.limit || 20);
};

export const Feedback: Model<FeedbackDocument> = mongoose.model<FeedbackDocument>(
  'Feedback',
  FeedbackSchema
);
