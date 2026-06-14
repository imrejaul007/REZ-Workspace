import mongoose, { Schema, Document } from 'mongoose';

// Story Insights Document Interface
export interface IStoryInsights extends Document {
  storyId: string;
  accountId: string;
  date: Date;
  timestamp: Date;
  mediaType: string;
  impressions: number;
  reach: number;
  replies: number;
  exits: number;
  forwardTaps: number;
  backTaps: number;
  tapsForward: number;
  tapsBack: number;
  engagementRate: number;
  shares: number;
  linkClicks?: number;
  profileVisits?: number;
  nextStoryTaps?: number;
  stickerTaps?: {
    stickerType: string;
    count: number;
  }[];
  questionResponses?: number;
  pollResponses?: {
    option: string;
    count: number;
  }[];
  quizResponses?: {
    correct: number;
    incorrect: number;
  };
  sliderResponses?: {
    emoji: string;
    count: number;
  }[];
  countdownTaps?: number;
  attachmentTaps?: number;
  metadata?: {
    fetchedAt: Date;
    source: string;
    apiResponseId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema for StoryInsights
const StickerTapsSchema = new Schema(
  {
    stickerType: { type: String, required: true },
    count: { type: Number, required: true },
  },
  { _id: false }
);

const PollResponsesSchema = new Schema(
  {
    option: { type: String, required: true },
    count: { type: Number, required: true },
  },
  { _id: false }
);

const QuizResponsesSchema = new Schema(
  {
    correct: { type: Number, default: 0 },
    incorrect: { type: Number, default: 0 },
  },
  { _id: false }
);

const SliderResponsesSchema = new Schema(
  {
    emoji: { type: String, required: true },
    count: { type: Number, required: true },
  },
  { _id: false }
);

const StoryInsightsSchema = new Schema<IStoryInsights>(
  {
    storyId: {
      type: String,
      required: true,
      index: true,
    },
    accountId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: null,
    },
    mediaType: {
      type: String,
      default: 'IMAGE',
    },
    impressions: {
      type: Number,
      default: 0,
    },
    reach: {
      type: Number,
      default: 0,
    },
    replies: {
      type: Number,
      default: 0,
    },
    exits: {
      type: Number,
      default: 0,
    },
    forwardTaps: {
      type: Number,
      default: 0,
    },
    backTaps: {
      type: Number,
      default: 0,
    },
    tapsForward: {
      type: Number,
      default: 0,
    },
    tapsBack: {
      type: Number,
      default: 0,
    },
    engagementRate: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    linkClicks: {
      type: Number,
      default: 0,
    },
    profileVisits: {
      type: Number,
      default: 0,
    },
    nextStoryTaps: {
      type: Number,
      default: 0,
    },
    stickerTaps: {
      type: [StickerTapsSchema],
      default: [],
    },
    questionResponses: {
      type: Number,
      default: 0,
    },
    pollResponses: {
      type: [PollResponsesSchema],
      default: [],
    },
    quizResponses: {
      type: QuizResponsesSchema,
      default: null,
    },
    sliderResponses: {
      type: [SliderResponsesSchema],
      default: [],
    },
    countdownTaps: {
      type: Number,
      default: 0,
    },
    attachmentTaps: {
      type: Number,
      default: 0,
    },
    metadata: {
      fetchedAt: { type: Date, default: Date.now },
      source: { type: String, default: 'instagram_api' },
      apiResponseId: String,
    },
  },
  {
    timestamps: true,
    collection: 'story_insights',
  }
);

// Compound indexes for efficient queries
StoryInsightsSchema.index({ accountId: 1, date: -1 });
StoryInsightsSchema.index({ storyId: 1, date: -1 });
StoryInsightsSchema.index({ engagementRate: -1, date: -1 });
StoryInsightsSchema.index({ reach: -1, date: -1 });

// Static method to get story performance summary
StoryInsightsSchema.statics.getPerformanceSummary = function (
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<any> {
  return this.aggregate([
    {
      $match: {
        accountId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalStories: { $sum: 1 },
        totalImpressions: { $sum: '$impressions' },
        totalReach: { $sum: '$reach' },
        totalReplies: { $sum: '$replies' },
        totalExits: { $sum: '$exits' },
        avgEngagementRate: { $avg: '$engagementRate' },
        avgForwardTaps: { $avg: '$forwardTaps' },
        avgBackTaps: { $avg: '$backTaps' },
      },
    },
  ]).exec();
};

export const StoryInsights =
  mongoose.models.StoryInsights ||
  mongoose.model<IStoryInsights>('StoryInsights', StoryInsightsSchema);