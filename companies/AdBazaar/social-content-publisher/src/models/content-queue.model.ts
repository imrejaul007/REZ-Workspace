import mongoose, { Schema, Document } from 'mongoose';

export type QueueStatus = 'pending' | 'processing' | 'published' | 'failed';

export interface IContentQueue {
  id: string;
  postId: string;
  platform: string;
  scheduledTime: Date;
  status: QueueStatus;
  retryCount: number;
  maxRetries: number;
  error?: string;
  lastAttemptAt?: Date;
  publishedId?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContentQueueDocument extends Omit<IContentQueue, 'id'>, Document {
  toJSON(): IContentQueue;
}

const ContentQueueSchema = new Schema<IContentQueueDocument>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'UnifiedPost', required: true, index: true },
    platform: {
      type: String,
      enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest'],
      required: true,
    },
    scheduledTime: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'published', 'failed'],
      default: 'pending',
      index: true,
    },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    error: { type: String },
    lastAttemptAt: { type: Date },
    publishedId: { type: String },
    publishedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for efficient queue processing
ContentQueueSchema.index({ status: 1, scheduledTime: 1 });
ContentQueueSchema.index({ postId: 1, platform: 1 });

export default mongoose.model<IContentQueueDocument>('ContentQueue', ContentQueueSchema);