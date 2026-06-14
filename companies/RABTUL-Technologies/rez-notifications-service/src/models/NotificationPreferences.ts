/**
 * Notification Preferences Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationPreferences extends Document {
  userId: string;
  channels: {
    push: boolean;
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
    inApp: boolean;
  };
  quietHours?: {
    start: string;
    end: string;
    timezone: string;
  };
  email?: string;
  phone?: string;
  pushToken?: string;
  whatsappNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferencesSchema = new Schema<INotificationPreferences>({
  userId: { type: String, required: true, unique: true, index: true },
  channels: {
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false },
    inApp: { type: Boolean, default: true },
  },
  quietHours: {
    start: String,
    end: String,
    timezone: { type: String, default: 'Asia/Kolkata' },
  },
  email: String,
  phone: String,
  pushToken: String,
  whatsappNumber: String,
}, { timestamps: true });

export const NotificationPreferences = mongoose.model<INotificationPreferences>(
  'NotificationPreferences',
  NotificationPreferencesSchema
);
