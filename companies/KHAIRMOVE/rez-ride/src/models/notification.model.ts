import mongoose from 'mongoose';

export interface INotification extends mongoose.Document {
  userId: string;
  type: 'ride' | 'promo' | 'system' | 'safety';
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  sent: boolean;
  channel: ('push' | 'sms' | 'email' | 'whatsapp');
  createdAt: Date;
}

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['ride', 'promo', 'system', 'safety'], required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: mongoose.Schema.Types.Mixed,
  read: { type: Boolean, default: false },
  sent: { type: Boolean, default: false },
  channel: { type: String, enum: ['push', 'sms', 'email', 'whatsapp'], default: 'push' },
}, { timestamps: true });

NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

// Type alias for TypeScript
export type Notification = INotification;
