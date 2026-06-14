import mongoose, { Document, Schema } from 'mongoose';

// ==================== INTERFACE ====================

export interface IScheduledNotification extends Document {
  scheduleId: string;
  companyId: string;
  createdBy: string;
  name: string;
  description?: string;
  templateId?: string;
  title: string;
  body: string;
  type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  data?: Record<string, unknown>;
  deepLink?: string;
  imageUrl?: string;
  targetAudience: {
    type: 'all' | 'department' | 'role' | 'users' | 'segment';
    departmentIds?: string[];
    roleIds?: string[];
    userIds?: string[];
    segmentId?: string;
  };
  schedule: {
    type: 'once' | 'daily' | 'weekly' | 'monthly' | 'cron';
    cronExpression?: string;
    scheduledAt: Date;
    timezone: string;
    endDate?: Date;
  };
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'cancelled' | 'paused';
  statistics: {
    totalRecipients: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  lastRunAt?: Date;
  nextRunAt?: Date;
  runCount: number;
  maxRuns?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== SCHEMA ====================

const ScheduledNotificationSchema = new Schema<IScheduledNotification>(
  {
    scheduleId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    templateId: { type: String, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, required: true },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    data: { type: Schema.Types.Mixed },
    deepLink: { type: String },
    imageUrl: { type: String },
    targetAudience: {
      type: {
        type: String,
        enum: ['all', 'department', 'role', 'users', 'segment'],
        required: true,
      },
      departmentIds: [{ type: String }],
      roleIds: [{ type: String }],
      userIds: [{ type: String }],
      segmentId: { type: String },
    },
    schedule: {
      type: {
        type: String,
        enum: ['once', 'daily', 'weekly', 'monthly', 'cron'],
        required: true,
      },
      cronExpression: { type: String },
      scheduledAt: { type: Date, required: true, index: true },
      timezone: { type: String, default: 'Asia/Kolkata' },
      endDate: { type: Date },
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'running', 'completed', 'cancelled', 'paused'],
      default: 'draft',
      index: true,
    },
    statistics: {
      totalRecipients: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    lastRunAt: { type: Date },
    nextRunAt: { type: Date, index: true },
    runCount: { type: Number, default: 0 },
    maxRuns: { type: Number },
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================

ScheduledNotificationSchema.index({ companyId: 1, status: 1 });
ScheduledNotificationSchema.index({ nextRunAt: 1, status: 1 });
ScheduledNotificationSchema.index({ status: 1, 'schedule.scheduledAt': 1 });

// ==================== MODEL ====================

export const ScheduledNotification = mongoose.model<IScheduledNotification>(
  'ScheduledNotification',
  ScheduledNotificationSchema
);
