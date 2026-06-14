/**
 * Notification Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export type NotificationChannel = 'push' | 'sms' | 'email' | 'whatsapp' | 'inApp';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'retrying';
export type NotificationPriority = 'high' | 'normal' | 'low';

export interface INotification extends Document {
  userId: string;
  type: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  status: NotificationStatus;
  priority: NotificationPriority;
  error?: string;
  retryCount: number;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  channel: {
    type: String,
    enum: ['push', 'sms', 'email', 'whatsapp', 'inApp'],
    required: true,
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: Map, of: Schema.Types.Mixed },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'retrying'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['high', 'normal', 'low'],
    default: 'normal',
  },
  error: String,
  retryCount: { type: Number, default: 0 },
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
}, { timestamps: true });

// Indexes
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, readAt: 1 });
NotificationSchema.index({ status: 1, createdAt: 1 });
NotificationSchema.index({ type: 1, createdAt: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
