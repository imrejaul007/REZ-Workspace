import mongoose, { Document, Schema } from 'mongoose';

export interface ISequenceAnalytics extends Document {
  _id: mongoose.Types.ObjectId;
  sequenceId: mongoose.Types.ObjectId;
  userId: string;
  date: Date;
  metrics: {
    enrollments: number;
    completions: number;
    drops: number;
    unsubscribes: number;
    emailsSent: number;
    emailsOpened: number;
    emailsClicked: number;
    notificationsSent: number;
    webhooksTriggered: number;
    avgCompletionTime?: number;
  };
  stepMetrics: {
    stepOrder: number;
    stepType: string;
    sent: number;
    completed: number;
    failed: number;
    avgTimeToComplete?: number;
  }[];
  conversionFunnel: {
    stage: string;
    count: number;
    dropOffRate: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const SequenceAnalyticsSchema = new Schema<ISequenceAnalytics>(
  {
    sequenceId: { type: Schema.Types.ObjectId, ref: 'Sequence', required: true, index: true },
    userId: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    metrics: {
      enrollments: { type: Number, default: 0 },
      completions: { type: Number, default: 0 },
      drops: { type: Number, default: 0 },
      unsubscribes: { type: Number, default: 0 },
      emailsSent: { type: Number, default: 0 },
      emailsOpened: { type: Number, default: 0 },
      emailsClicked: { type: Number, default: 0 },
      notificationsSent: { type: Number, default: 0 },
      webhooksTriggered: { type: Number, default: 0 },
      avgCompletionTime: Number
    },
    stepMetrics: [
      {
        stepOrder: { type: Number, required: true },
        stepType: { type: String, required: true },
        sent: { type: Number, default: 0 },
        completed: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
        avgTimeToComplete: Number
      }
    ],
    conversionFunnel: [
      {
        stage: { type: String, required: true },
        count: { type: Number, required: true },
        dropOffRate: { type: Number, default: 0 }
      }
    ]
  },
  { timestamps: true }
);

SequenceAnalyticsSchema.index({ sequenceId: 1, date: -1 });
SequenceAnalyticsSchema.index({ userId: 1, date: -1 });

export const SequenceAnalytics = mongoose.model<ISequenceAnalytics>('SequenceAnalytics', SequenceAnalyticsSchema);