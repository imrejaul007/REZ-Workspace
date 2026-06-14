import { z } from 'zod';

// Deal types enum
export const DealTypeEnum = z.enum(['preferred_deal', 'private_marketplace', 'programmatic_guaranteed']);
export type DealType = z.infer<typeof DealTypeEnum>;

// Invite status enum
export const InviteStatusEnum = z.enum(['pending', 'accepted', 'declined', 'expired']);
export type InviteStatus = z.infer<typeof InviteStatusEnum>;

// Targeting schema
export const TargetingSchema = z.object({
  geo: z.array(z.string()).optional(),
  deviceTypes: z.array(z.string()).optional(),
  contentCategories: z.array(z.string()).optional(),
});
export type Targeting = z.infer<typeof TargetingSchema>;

// Deal details schema
export const DealDetailsSchema = z.object({
  name: z.string().min(1).max(255),
  floorPrice: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  targeting: TargetingSchema.optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});
export type DealDetails = z.infer<typeof DealDetailsSchema>;

// PMP Invite interface (for reference)
export interface PMPInvite {
  inviteId: string;
  publisherId: string;
  advertiserId?: string;
  dealType: DealType;
  dealDetails: {
    name: string;
    floorPrice: number;
    currency: string;
    targeting?: {
      geo?: string[];
      deviceTypes?: string[];
      contentCategories?: string[];
    };
    startDate: Date;
    endDate: Date;
  };
  status: InviteStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt?: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
}

// API Request/Response types
export interface CreateInviteRequest {
  publisherId: string;
  advertiserId?: string;
  dealType: DealType;
  dealDetails: {
    name: string;
    floorPrice: number;
    currency?: string;
    targeting?: {
      geo?: string[];
      deviceTypes?: string[];
      contentCategories?: string[];
    };
    startDate: string | Date;
    endDate: string | Date;
  };
  expiresInDays?: number;
}

export interface UpdateInviteStatusRequest {
  status: 'accepted' | 'declined';
  message?: string;
}

export interface InviteResponse {
  success: boolean;
  data?: PMPInvite;
  error?: string;
}

export interface ListInvitesQuery {
  status?: InviteStatus;
  publisherId?: string;
  advertiserId?: string;
  dealType?: DealType;
  page?: number;
  limit?: number;
}

export interface ListDealsQuery {
  publisherId?: string;
  advertiserId?: string;
  dealType?: DealType;
  page?: number;
  limit?: number;
}

// JWT Payload types
export interface JWTPayload {
  userId: string;
  role: 'publisher' | 'advertiser' | 'admin';
  companyId: string;
  companyType: 'publisher' | 'advertiser';
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API Response wrapper
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
  checks: {
    mongodb: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
}

// Metrics types
export interface InviteMetrics {
  totalInvites: number;
  pendingInvites: number;
  acceptedInvites: number;
  declinedInvites: number;
  expiredInvites: number;
  conversionRate: number;
}

// Webhook event types
export interface WebhookEvent {
  eventType: 'invite.created' | 'invite.accepted' | 'invite.declined' | 'invite.expired';
  inviteId: string;
  timestamp: Date;
  data: Record<string, unknown>;
}