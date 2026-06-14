import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBroadcast extends Document {
  name: string;
  subject?: string;
  content: string;
  channel: 'email' | 'sms' | 'push' | 'inApp';
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'failed';
  segmentId?: Types.ObjectId;
  segmentCriteria?: Record<string, unknown>;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  openedCount?: number;
  clickedCount?: number;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  ownerId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const BroadcastSchema = new Schema<IBroadcast>(
  {
    name: { type: String, required: true },
    subject: String,
    content: { type: String, required: true },
    channel: {
      type: String,
      enum: ['email', 'sms', 'push', 'inApp'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'completed', 'paused', 'failed'],
      default: 'draft',
      index: true,
    },
    segmentId: { type: Schema.Types.ObjectId, ref: 'Segment' },
    segmentCriteria: { type: Schema.Types.Mixed },
    recipientCount: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    openedCount: { type: Number, default: 0 },
    clickedCount: { type: Number, default: 0 },
    scheduledAt: Date,
    startedAt: Date,
    completedAt: Date,
    ownerId: { type: String, required: true, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

BroadcastSchema.index({ ownerId: 1, status: 1 });
BroadcastSchema.index({ scheduledAt: 1 });
BroadcastSchema.index({ status: 1, scheduledAt: 1 });

export const Broadcast = mongoose.model<IBroadcast>('Broadcast', BroadcastSchema);