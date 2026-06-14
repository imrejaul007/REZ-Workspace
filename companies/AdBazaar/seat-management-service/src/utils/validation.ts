import { z } from 'zod';
import { SeatRole, SeatStatus, PlanType, BillingCycle, PermissionResource, PermissionAction, UsagePeriod } from '../models';

// Seat validation schemas
export const createSeatSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  role: z.nativeEnum(SeatRole).optional(),
  status: z.nativeEnum(SeatStatus).optional(),
  metadata: z.record(z.unknown()).optional()
});

export const updateSeatSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.nativeEnum(SeatRole).optional(),
  status: z.nativeEnum(SeatStatus).optional(),
  metadata: z.record(z.unknown()).optional()
});

// Permission validation schemas
export const setPermissionSchema = z.object({
  seatId: z.string().min(1, 'Seat ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  resource: z.nativeEnum(PermissionResource),
  actions: z.array(z.nativeEnum(PermissionAction)).min(1, 'At least one action is required'),
  constraints: z.record(z.unknown()).optional(),
  expiresAt: z.string().datetime().optional()
});

export const updatePermissionSchema = z.object({
  actions: z.array(z.nativeEnum(PermissionAction)).optional(),
  constraints: z.record(z.unknown()).optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().optional()
});

// Organization validation schemas
export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(1000).optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  industry: z.string().max(100).optional(),
  size: z.string().max(50).optional(),
  ownerId: z.string().min(1, 'Owner ID is required'),
  plan: z.nativeEnum(PlanType).optional(),
  settings: z.object({
    allowGuestSeats: z.boolean().optional(),
    requireApprovalForSeats: z.boolean().optional(),
    defaultSeatRole: z.string().optional(),
    seatExpirationDays: z.number().optional(),
    enforceMfa: z.boolean().optional(),
    ssoEnabled: z.boolean().optional(),
    allowedIpRanges: z.array(z.string()).optional()
  }).optional(),
  metadata: z.record(z.unknown()).optional()
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  industry: z.string().max(100).optional(),
  size: z.string().max(50).optional(),
  settings: z.object({
    allowGuestSeats: z.boolean().optional(),
    requireApprovalForSeats: z.boolean().optional(),
    defaultSeatRole: z.string().optional(),
    seatExpirationDays: z.number().optional(),
    enforceMfa: z.boolean().optional(),
    ssoEnabled: z.boolean().optional(),
    allowedIpRanges: z.array(z.string()).optional()
  }).optional(),
  metadata: z.record(z.unknown()).optional()
});

export const updateBillingSchema = z.object({
  plan: z.nativeEnum(PlanType).optional(),
  billingCycle: z.nativeEnum(BillingCycle).optional(),
  seatsPurchased: z.number().int().min(1).optional(),
  pricePerSeat: z.number().min(0).optional(),
  autoRenew: z.boolean().optional(),
  paymentMethod: z.string().optional()
});

// Invite validation schemas
export const inviteUserSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  role: z.nativeEnum(SeatRole).optional(),
  invitedBy: z.string().min(1, 'Inviter ID is required'),
  sendEmail: z.boolean().optional(),
  customMessage: z.string().max(500).optional()
});

export const acceptInvitationSchema = z.object({
  inviteToken: z.string().min(1, 'Invite token is required'),
  userId: z.string().min(1, 'User ID is required')
});

// Usage validation schemas
export const recordUsageSchema = z.object({
  seatId: z.string().min(1, 'Seat ID is required'),
  apiCalls: z.number().int().min(0).optional(),
  dataProcessed: z.number().int().min(0).optional(),
  feature: z.string().optional(),
  sessionDuration: z.number().min(0).optional()
});

export const getUsageAnalyticsSchema = z.object({
  seatId: z.string().min(1, 'Seat ID is required'),
  period: z.nativeEnum(UsagePeriod).optional()
});

// Query schemas
export const listSeatsQuerySchema = z.object({
  organizationId: z.string().optional(),
  status: z.nativeEnum(SeatStatus).optional(),
  role: z.nativeEnum(SeatRole).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const listOrganizationsQuerySchema = z.object({
  plan: z.nativeEnum(PlanType).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

// ID parameter schema
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required')
});

// Export all schemas
export const schemas = {
  createSeat: createSeatSchema,
  updateSeat: updateSeatSchema,
  setPermission: setPermissionSchema,
  updatePermission: updatePermissionSchema,
  createOrganization: createOrganizationSchema,
  updateOrganization: updateOrganizationSchema,
  updateBilling: updateBillingSchema,
  inviteUser: inviteUserSchema,
  acceptInvitation: acceptInvitationSchema,
  recordUsage: recordUsageSchema,
  getUsageAnalytics: getUsageAnalyticsSchema,
  listSeatsQuery: listSeatsQuerySchema,
  listOrganizationsQuery: listOrganizationsQuerySchema,
  idParam: idParamSchema
};

export type CreateSeatInput = z.infer<typeof createSeatSchema>;
export type UpdateSeatInput = z.infer<typeof updateSeatSchema>;
export type SetPermissionInput = z.infer<typeof setPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type UpdateBillingInput = z.infer<typeof updateBillingSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type RecordUsageInput = z.infer<typeof recordUsageSchema>;
export type GetUsageAnalyticsInput = z.infer<typeof getUsageAnalyticsSchema>;
export type ListSeatsQuery = z.infer<typeof listSeatsQuerySchema>;
export type ListOrganizationsQuery = z.infer<typeof listOrganizationsQuerySchema>;
export type IdParam = z.infer<typeof idParamSchema>;