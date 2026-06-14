import mongoose, { Document, Schema } from 'mongoose';

// ==================== INTERFACES ====================

export type NotificationType =
  | 'announcement'
  | 'task_reminder'
  | 'leave_request'
  | 'leave_approved'
  | 'leave_rejected'
  | 'meeting_reminder'
  | 'payroll'
  | 'document'
  | 'performance_review'
  | 'policy_update'
  | 'shift_change'
  | 'onboarding'
  | 'general';

export type NotificationChannel = 'push' | 'in_app' | 'email' | 'sms';

export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface INotification extends Document {
  notificationId: string;
  userId: string;
  companyId: string;
  title: string;
  body: string;
  type: NotificationType;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  data?: Record<string, unknown>;
  imageUrl?: string;
  deepLink?: string;
  channels: NotificationChannel[];
  deliveryStatus: DeliveryStatus;
  read: boolean;
  readAt?: Date;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  expiresAt?: Date;
  clickCount: number;
  templateId?: string;
  templateVariables?: Record<string, string>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== SCHEMA ====================

const NotificationSchema = new Schema<INotification>(
  {
    notificationId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'announcement',
        'task_reminder',
        'leave_request',
        'leave_approved',
        'leave_rejected',
        'meeting_reminder',
        'payroll',
        'document',
        'performance_review',
        'policy_update',
        'shift_change',
        'onboarding',
        'general',
      ],
      default: 'general',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    data: { type: Schema.Types.Mixed },
    imageUrl: { type: String },
    deepLink: { type: String },
    channels: [
      {
        type: String,
        enum: ['push', 'in_app', 'email', 'sms'],
      },
    ],
    deliveryStatus: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
      default: 'pending',
      index: true,
    },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    scheduledAt: { type: Date, index: true },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    expiresAt: { type: Date },
    clickCount: { type: Number, default: 0 },
    templateId: { type: String, index: true },
    templateVariables: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ companyId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ scheduledAt: 1, deliveryStatus: 1 });
NotificationSchema.index({ companyId: 1, createdAt: -1 });

// ==================== MODEL ====================

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
