/**
 * In-App Notification Model
 *
 * Stores user notifications for in-app display.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export type NotificationType =
  | 'po_created'
  | 'po_approved'
  | 'po_rejected'
  | 'po_overdue'
  | 'payment_received'
  | 'approval_required'
  | 'credit_limit_alert'
  | 'reminder';

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface INotification extends Document {
  merchantId: Types.ObjectId;
  userId?: Types.ObjectId;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  readAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    merchantId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        'po_created',
        'po_approved',
        'po_rejected',
        'po_overdue',
        'payment_received',
        'approval_required',
        'credit_limit_alert',
        'reminder',
      ],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 500 },
    data: { type: Map, of: mongoose.Schema.Types.Mixed },
    entityType: { type: String },
    entityId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes
notificationSchema.index({ merchantId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ merchantId: 1, userId: 1, isRead: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired

export const Notification =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);
