import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  type: 'message' | 'mention' | 'system' | 'campaign' | 'alert';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: Date;
  actionUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['message', 'mention', 'system', 'campaign', 'alert'],
      default: 'system',
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false, index: true },
    readAt: Date,
    actionUrl: String,
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);