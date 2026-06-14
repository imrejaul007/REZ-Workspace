import mongoose, { Document, Schema } from 'mongoose';

export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface ISchedule extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  postId: mongoose.Types.ObjectId;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok';
  scheduledAt: Date;
  recurrence: RecurrenceType;
  recurrenceConfig?: {
    interval?: number;
    daysOfWeek?: number[];
    daysOfMonth?: number[];
    endDate?: Date;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  result?: {
    postId?: string;
    url?: string;
    impressions?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    userId: { type: String, required: true, index: true },
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    platform: {
      type: String,
      enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok'],
      required: true
    },
    scheduledAt: { type: Date, required: true, index: true },
    recurrence: {
      type: String,
      enum: ['once', 'daily', 'weekly', 'monthly', 'custom'],
      default: 'once'
    },
    recurrenceConfig: {
      interval: Number,
      daysOfWeek: [Number],
      daysOfMonth: [Number],
      endDate: Date
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true
    },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    lastError: String,
    result: {
      postId: String,
      url: String,
      impressions: Number
    }
  },
  { timestamps: true }
);

ScheduleSchema.index({ userId: 1, status: 1 });
ScheduleSchema.index({ scheduledAt: 1, status: 1 });

export const Schedule = mongoose.model<ISchedule>('Schedule', ScheduleSchema);