import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  notificationId: string;
  expirationId: string;
  memberId: string;
  userId: string;
  type: 'expiring_soon' | 'last_reminder' | 'expired' | 'forgiven';
  channel: 'email' | 'sms' | 'push' | 'in_app';
  title: string;
  message: string;
  pointsAmount: number;
  daysUntilExpiration: number;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    notificationId: { type: String, required: true, unique: true, index: true },
    expirationId: { type: String, required: true, index: true },
    memberId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    type: { type: String, enum: ['expiring_soon', 'last_reminder', 'expired', 'forgiven'], required: true },
    channel: { type: String, enum: ['email', 'sms', 'push', 'in_app'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    pointsAmount: { type: Number, required: true },
    daysUntilExpiration: { type: Number, required: true },
    sentAt: { type: Date, default: Date.now },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    failedAt: { type: Date },
    failureReason: { type: String }
  },
  { timestamps: true }
);

NotificationSchema.index({ expirationId: 1, type: 1 });
NotificationSchema.index({ memberId: 1, sentAt: -1 });
NotificationSchema.index({ userId: 1, sentAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);