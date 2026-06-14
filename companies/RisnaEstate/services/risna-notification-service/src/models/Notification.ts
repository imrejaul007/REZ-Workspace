import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationType {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed'
}

export interface INotification extends Document {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  status: NotificationStatus;
  sentAt?: Date;
  error?: string;
  scheduledFor?: Date;
  read: boolean;
  readAt?: Date;
  deletedAt?: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: Object.values(NotificationType), required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  status: { type: String, enum: Object.values(NotificationStatus), default: NotificationStatus.PENDING },
  sentAt: Date,
  error: String,
  scheduledFor: Date,
  read: { type: Boolean, default: false },
  readAt: Date,
  deletedAt: Date
}, { timestamps: true });

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, scheduledFor: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
