import { z } from 'zod';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationPayload,
  NotificationTemplate,
  NotificationPreferences,
  CategoryPreferences,
} from '../types';

// Base schemas
export const channelSchema = z.enum(['email', 'sms', 'whatsapp', 'push']);
export const prioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);

// Recipient schema
export const recipientSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  deviceToken: z.string().optional(),
  channels: z.array(channelSchema).min(1),
});

// Notification payload schema
export const notificationPayloadSchema = z.object({
  templateId: z.string().min(1),
  recipient: recipientSchema,
  variables: z.record(z.string()),
  priority: prioritySchema.optional().default('normal'),
  scheduledAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
  idempotencyKey: z.string().optional(),
});

// Batch notification schema
export const batchNotificationSchema = z.object({
  notifications: z.array(notificationPayloadSchema).min(1).max(1000),
  options: z.object({
    parallel: z.boolean().optional().default(true),
    stopOnError: z.boolean().optional().default(false),
  }).optional(),
});

// Template schema
export const templateContentSchema = z.object({
  subject: z.string().optional(),
  body: z.string().min(1),
  htmlBody: z.string().optional(),
  actionUrl: z.string().url().optional(),
  actionText: z.string().optional(),
});

export const templateVariableSchema = z.object({
  name: z.string().min(1),
  required: z.boolean().default(true),
  type: z.enum(['string', 'number', 'boolean', 'date']).default('string'),
  defaultValue: z.string().optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  channel: channelSchema,
  category: z.string().min(1),
  content: templateContentSchema,
  variables: z.array(templateVariableSchema).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export const updateTemplateSchema = createTemplateSchema.partial();

// Preferences schema
export const channelPreferenceSchema = z.object({
  enabled: z.boolean().default(true),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  maxDailyNotifications: z.number().int().min(1).max(1000).optional(),
});

export const notificationPreferencesSchema = z.object({
  userId: z.string().min(1),
  email: channelPreferenceSchema,
  sms: channelPreferenceSchema,
  whatsapp: channelPreferenceSchema,
  push: channelPreferenceSchema,
  marketingEnabled: z.boolean().default(true),
  transactionEnabled: z.boolean().default(true),
  securityEnabled: z.boolean().default(true),
});

export const updatePreferencesSchema = notificationPreferencesSchema.partial().extend({
  userId: z.string().min(1),
});

// Category preferences schema
export const categoryPreferencesSchema = z.object({
  category: z.string().min(1),
  enabled: z.boolean(),
  channels: z.array(channelSchema),
});

// Opt-out schema
export const optOutSchema = z.object({
  userId: z.string().min(1),
  channel: channelSchema,
  reason: z.string().max(500).optional(),
});

export const globalOptOutSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  reason: z.string().max(500).optional(),
});

// Validation helper
export const validateOrThrow = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(
      (e) => `${e.path.join('.')}: ${e.message}`
    );
    throw new ValidationError(errors.join('; '));
  }
  return result.data;
};

// Custom validation error
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Type exports
export type NotificationPayloadInput = z.infer<typeof notificationPayloadSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type PreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type OptOutInput = z.infer<typeof optOutSchema>;
