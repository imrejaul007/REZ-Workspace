import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISend extends Document {
  broadcastId: Types.ObjectId;
  userId: string;
  recipient: string;
  channel: 'email' | 'sms' | 'push' | 'inApp';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'unsubscribed';
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SendSchema = new Schema<ISend>(
  {
    broadcastId: { type: Schema.Types.ObjectId, ref: 'Broadcast', required: true, index: true },
    userId: { type: String, required: true, index: true },
    recipient: { type: String, required: true },
    channel: {
      type: String,
      enum: ['email', 'sms', 'push', 'inApp'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed', 'bounced', 'unsubscribed'],
      default: 'pending',
      index: true,
    },
    sentAt: Date,
    deliveredAt: Date,
    failedAt: Date,
    error: String,
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

SendSchema.index({ broadcastId: 1, status: 1 });
SendSchema.index({ userId: 1, createdAt: -1 });

export const Send = mongoose.model<ISend>('Send', SendSchema);