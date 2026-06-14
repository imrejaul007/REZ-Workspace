import { z } from 'zod';

// ==================== NOTIFICATION SCHEMAS ====================

export const SendNotificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  companyId: z.string().min(1, 'Company ID is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be under 200 characters'),
  body: z.string().min(1, 'Body is required').max(1000, 'Body must be under 1000 characters'),
  type: z.enum([
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
  ]),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
  data: z.record(z.unknown()).optional(),
  imageUrl: z.string().url().optional(),
  deepLink: z.string().url().optional(),
  channels: z.array(z.enum(['push', 'in_app', 'email', 'sms'])).optional().default(['push', 'in_app']),
  scheduledAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  templateId: z.string().optional(),
  templateVariables: z.record(z.string()).optional(),
});

export const GetNotificationsSchema = z.object({
  userId: z.string().min(1),
  companyId: z.string().min(1),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  type: z.enum([
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
  ]).optional(),
  read: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const MarkReadSchema = z.object({
  notificationId: z.string().min(1),
  userId: z.string().min(1),
});

export const MarkAllReadSchema = z.object({
  userId: z.string().min(1),
  companyId: z.string().min(1),
});

// ==================== TEMPLATE SCHEMAS ====================

export const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  type: z.enum([
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
  ]),
  channels: z.array(z.enum(['push', 'in_app', 'email', 'sms'])).min(1),
  titleTemplate: z.string().min(1).max(200),
  bodyTemplate: z.string().min(1).max(1000),
  imageTemplate: z.string().url().optional(),
  deepLinkTemplate: z.string().url().optional(),
  variables: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(['string', 'number', 'boolean', 'date']),
    required: z.boolean().optional().default(false),
    defaultValue: z.string().optional(),
    description: z.string().optional(),
  })).optional().default([]),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
  isActive: z.boolean().optional().default(true),
  isDefault: z.boolean().optional().default(false),
  companyId: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  metadata: z.record(z.unknown()).optional(),
  createdBy: z.string().min(1, 'Created by is required'),
});

export const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  channels: z.array(z.enum(['push', 'in_app', 'email', 'sms'])).min(1).optional(),
  titleTemplate: z.string().min(1).max(200).optional(),
  bodyTemplate: z.string().min(1).max(1000).optional(),
  imageTemplate: z.string().url().optional(),
  deepLinkTemplate: z.string().url().optional(),
  variables: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(['string', 'number', 'boolean', 'date']),
    required: z.boolean().optional().default(false),
    defaultValue: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const GetTemplatesSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  type: z.enum([
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
  ]).optional(),
  companyId: z.string().optional(),
  isActive: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  search: z.string().optional(),
  tags: z.string().transform((val) => val.split(',')).optional(),
});

// ==================== PREFERENCE SCHEMAS ====================

export const UpdatePreferencesSchema = z.object({
  globalEnabled: z.boolean().optional(),
  channels: z.array(z.object({
    channel: z.enum(['push', 'in_app', 'email', 'sms']),
    enabled: z.boolean().optional(),
    quietHoursEnabled: z.boolean().optional(),
    quietHoursStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    quietHoursEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    deviceTokens: z.array(z.string()).optional(),
  })).optional(),
  typePreferences: z.array(z.object({
    type: z.string(),
    enabled: z.boolean(),
    channels: z.array(z.enum(['push', 'in_app', 'email', 'sms'])).optional(),
  })).optional(),
  notificationSummary: z.enum(['instant', 'hourly', 'daily', 'weekly', 'off']).optional(),
  doNotDisturbUntil: z.string().datetime().optional(),
  modifiedBy: z.string().optional(),
});

export const GetPreferencesSchema = z.object({
  userId: z.string().min(1),
  companyId: z.string().min(1),
});

export const DeviceTokenSchema = z.object({
  userId: z.string().min(1),
  companyId: z.string().min(1),
  token: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
});

// ==================== SCHEDULED NOTIFICATION SCHEMAS ====================

export const CreateScheduledNotificationSchema = z.object({
  companyId: z.string().min(1),
  createdBy: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  templateId: z.string().optional(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  type: z.string().min(1),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
  data: z.record(z.unknown()).optional(),
  deepLink: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  targetAudience: z.object({
    type: z.enum(['all', 'department', 'role', 'users', 'segment']),
    departmentIds: z.array(z.string()).optional(),
    roleIds: z.array(z.string()).optional(),
    userIds: z.array(z.string()).optional(),
    segmentId: z.string().optional(),
  }),
  schedule: z.object({
    type: z.enum(['once', 'daily', 'weekly', 'monthly', 'cron']),
    cronExpression: z.string().optional(),
    scheduledAt: z.string().datetime(),
    timezone: z.string().optional().default('Asia/Kolkata'),
    endDate: z.string().datetime().optional(),
  }),
  maxRuns: z.number().int().positive().optional(),
});

export const UpdateScheduledNotificationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(1000).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  data: z.record(z.unknown()).optional(),
  deepLink: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  targetAudience: z.object({
    type: z.enum(['all', 'department', 'role', 'users', 'segment']),
    departmentIds: z.array(z.string()).optional(),
    roleIds: z.array(z.string()).optional(),
    userIds: z.array(z.string()).optional(),
    segmentId: z.string().optional(),
  }).optional(),
  schedule: z.object({
    type: z.enum(['once', 'daily', 'weekly', 'monthly', 'cron']),
    cronExpression: z.string().optional(),
    scheduledAt: z.string().datetime(),
    timezone: z.string().optional(),
    endDate: z.string().datetime().optional(),
  }).optional(),
  status: z.enum(['draft', 'scheduled', 'running', 'completed', 'cancelled', 'paused']).optional(),
  maxRuns: z.number().int().positive().optional(),
});

// ==================== TYPE EXPORTS ====================

export type SendNotificationInput = z.infer<typeof SendNotificationSchema>;
export type GetNotificationsInput = z.infer<typeof GetNotificationsSchema>;
export type MarkReadInput = z.infer<typeof MarkReadSchema>;
export type MarkAllReadInput = z.infer<typeof MarkAllReadSchema>;
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;
export type GetTemplatesInput = z.infer<typeof GetTemplatesSchema>;
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;
export type GetPreferencesInput = z.infer<typeof GetPreferencesSchema>;
export type DeviceTokenInput = z.infer<typeof DeviceTokenSchema>;
export type CreateScheduledNotificationInput = z.infer<typeof CreateScheduledNotificationSchema>;
export type UpdateScheduledNotificationInput = z.infer<typeof UpdateScheduledNotificationSchema>;
