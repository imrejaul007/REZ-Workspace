/**
 * Common types for REZ ecosystem
 */

import { z } from 'zod';

// ============ User Types ============

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  name: z.string().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export type User = z.infer<typeof UserSchema>;

// ============ Entity Types ============

export const EntitySchema = z.object({
  id: z.string(),
  type: z.string(),
  properties: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type Entity = z.infer<typeof EntitySchema>;

// ============ Pagination ============

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  });

// ============ API Response ============

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// ============ Timestamps ============

export const TimestampSchema = z.object({
  createdAt: z.number(),
  updatedAt: z.number().optional(),
  deletedAt: z.number().optional(),
});

export type Timestamp = z.infer<typeof TimestampSchema>;

// ============ Status ============

export const StatusSchema = z.enum([
  'active',
  'inactive',
  'pending',
  'suspended',
  'deleted',
]);

export type Status = z.infer<typeof StatusSchema>;

// ============ Location ============

export const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
});

export type Location = z.infer<typeof LocationSchema>;

// ============ Money ============

export const MoneySchema = z.object({
  amount: z.number(),
  currency: z.string().default('INR'),
});

export type Money = z.infer<typeof MoneySchema>;

// ============ Notification ============

export const NotificationTypeSchema = z.enum([
  'push',
  'sms',
  'email',
  'whatsapp',
  'in_app',
]);

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  data: z.record(z.string()).optional(),
  read: z.boolean().default(false),
  sentAt: z.number(),
});

export type Notification = z.infer<typeof NotificationSchema>;

// ============ Audit Log ============

export const AuditActionSchema = z.enum([
  'create',
  'read',
  'update',
  'delete',
  'login',
  'logout',
  'error',
]);

export const AuditLogSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  action: AuditActionSchema,
  resource: z.string(),
  resourceId: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.number(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

// ============ Feature Flags ============

export const FeatureFlagSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
  rolloutPercentage: z.number().min(0).max(100).default(100),
  conditions: z.record(z.unknown()).optional(),
});

export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;

// ============ Re-export Zod ============

export { z };

// ============ Generic ID ============

export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}
