import mongoose, { Document, Schema } from 'mongoose';

// ==================== INTERFACES ====================

export interface IChannelPreference {
  channel: 'push' | 'in_app' | 'email' | 'sms';
  enabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string; // HH:mm format
  deviceTokens?: string[]; // For push notifications
}

export interface ITypePreference {
  type: string;
  enabled: boolean;
  channels?: ('push' | 'in_app' | 'email' | 'sms')[];
}

export interface INotificationPreference extends Document {
  preferenceId: string;
  userId: string;
  companyId: string;
  globalEnabled: boolean;
  channels: IChannelPreference[];
  typePreferences: ITypePreference[];
  notificationSummary: 'instant' | 'hourly' | 'daily' | 'weekly' | 'off';
  doNotDisturbUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy: string;
}

// ==================== SCHEMA ====================

const ChannelPreferenceSchema = new Schema<IChannelPreference>(
  {
    channel: {
      type: String,
      enum: ['push', 'in_app', 'email', 'sms'],
      required: true,
    },
    enabled: { type: Boolean, default: true },
    quietHoursEnabled: { type: Boolean, default: false },
    quietHoursStart: { type: String },
    quietHoursEnd: { type: String },
    deviceTokens: [{ type: String }],
  },
  { _id: false }
);

const TypePreferenceSchema = new Schema<ITypePreference>(
  {
    type: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    channels: [
      {
        type: String,
        enum: ['push', 'in_app', 'email', 'sms'],
      },
    ],
  },
  { _id: false }
);

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    preferenceId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    globalEnabled: { type: Boolean, default: true },
    channels: {
      type: [ChannelPreferenceSchema],
      default: () => [
        { channel: 'push', enabled: true, quietHoursEnabled: false },
        { channel: 'in_app', enabled: true, quietHoursEnabled: false },
        { channel: 'email', enabled: true, quietHoursEnabled: false },
        { channel: 'sms', enabled: false, quietHoursEnabled: false },
      ],
    },
    typePreferences: {
      type: [TypePreferenceSchema],
      default: () => [
        { type: 'announcement', enabled: true, channels: ['push', 'in_app'] },
        { type: 'task_reminder', enabled: true, channels: ['push', 'in_app'] },
        { type: 'leave_request', enabled: true, channels: ['push', 'in_app', 'email'] },
        { type: 'leave_approved', enabled: true, channels: ['push', 'in_app', 'email'] },
        { type: 'leave_rejected', enabled: true, channels: ['push', 'in_app', 'email'] },
        { type: 'meeting_reminder', enabled: true, channels: ['push', 'in_app', 'email'] },
        { type: 'payroll', enabled: true, channels: ['push', 'in_app', 'email'] },
        { type: 'document', enabled: true, channels: ['push', 'in_app'] },
        { type: 'performance_review', enabled: true, channels: ['push', 'in_app', 'email'] },
        { type: 'policy_update', enabled: true, channels: ['push', 'in_app', 'email'] },
        { type: 'shift_change', enabled: true, channels: ['push', 'in_app'] },
        { type: 'onboarding', enabled: true, channels: ['push', 'in_app', 'email'] },
        { type: 'general', enabled: true, channels: ['push', 'in_app'] },
      ],
    },
    notificationSummary: {
      type: String,
      enum: ['instant', 'hourly', 'daily', 'weekly', 'off'],
      default: 'instant',
    },
    doNotDisturbUntil: { type: Date },
    lastModifiedBy: { type: String, default: 'system' },
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================

NotificationPreferenceSchema.index({ userId: 1, companyId: 1 }, { unique: true });
NotificationPreferenceSchema.index({ companyId: 1 });

// ==================== MODEL ====================

export const NotificationPreference = mongoose.model<INotificationPreference>(
  'NotificationPreference',
  NotificationPreferenceSchema
);
