/**
 * ReZ Notify - Notification Model
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  shop: string;
  tenantId: string;
  brandId: string;
  type: 'push' | 'email' | 'sms' | 'whatsapp';
  templateId?: string;
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  clickedAt?: Date;
  error?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema({
  shop: { type: String, required: true, lowercase: true, index: true },
  tenantId: { type: String, required: true, index: true },
  brandId: { type: String, required: true, index: true },
  type: { type: String, enum: ['push', 'email', 'sms', 'whatsapp'], required: true },
  templateId: String,
  customerId: String,
  customerEmail: String,
  customerPhone: String,
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending',
  },
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
  clickedAt: Date,
  error: String,
}, {
  timestamps: true,
  collection: 'notifications',
});

NotificationSchema.index({ shop: 1, status: 1 });
NotificationSchema.index({ customerId: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

export interface INotificationTemplate extends Document {
  shop: string;
  tenantId: string;
  name: string;
  type: 'push' | 'email' | 'sms' | 'whatsapp';
  subject?: string;
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  imageUrl?: string;
  variables: string[];
  active: boolean;
  createdAt: Date;
}

const NotificationTemplateSchema = new Schema({
  shop: { type: String, required: true, lowercase: true, index: true },
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['push', 'email', 'sms', 'whatsapp'], required: true },
  subject: String,
  title: { type: String, required: true },
  body: { type: String, required: true },
  ctaText: String,
  ctaUrl: String,
  imageUrl: String,
  variables: [String],
  active: { type: Boolean, default: true },
}, {
  timestamps: true,
  collection: 'notification_templates',
});

NotificationTemplateSchema.index({ shop: 1, active: 1 });

export const NotificationTemplate = mongoose.model<INotificationTemplate>('NotificationTemplate', NotificationTemplateSchema);
