import { z } from 'zod';

// Integration Types
export interface Integration {
  id: string;
  tenantId: string;
  name: string;
  type: 'zapier' | 'make' | 'custom';
  authType: 'api_key' | 'oauth';
  credentials: IntegrationCredentials;
  webhookUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationCredentials {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  clientId?: string;
}

export interface WebhookSubscription {
  id: string;
  integrationId: string;
  tenantId: string;
  event: WebhookEvent;
  url: string;
  secret: string;
  isActive: boolean;
  createdAt: Date;
}

export type WebhookEvent =
  | 'post.created'
  | 'post.updated'
  | 'post.deleted'
  | 'post.scheduled'
  | 'post.published'
  | 'analytics.updated'
  | 'campaign.started'
  | 'campaign.ended';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
  signature?: string;
}

export interface ApiKey {
  id: string;
  tenantId: string;
  name: string;
  key: string;
  keyPrefix: string;
  permissions: Permission[];
  expiresAt?: Date;
  lastUsed?: Date;
  createdAt: Date;
}

export type Permission =
  | 'posts:create'
  | 'posts:read'
  | 'posts:update'
  | 'posts:delete'
  | 'analytics:read'
  | 'schedule:create'
  | 'schedule:read'
  | 'campaigns:read';

export interface OAuthState {
  tenantId: string;
  redirectUri: string;
  state: string;
  createdAt: Date;
}

// Zapier Action Types
export interface CreatePostInput {
  title: string;
  content: string;
  platform: string;
  scheduledAt?: string;
  tags?: string[];
  mediaUrls?: string[];
}

export interface GetAnalyticsInput {
  postId?: string;
  campaignId?: string;
  startDate: string;
  endDate: string;
}

export interface SchedulePostInput {
  postId: string;
  scheduledAt: string;
  timezone?: string;
}

export interface PostResult {
  id: string;
  title: string;
  status: string;
  platform: string;
  createdAt: string;
  scheduledAt?: string;
  publishedAt?: string;
}

export interface AnalyticsResult {
  postId?: string;
  views: number;
  engagements: number;
  clicks: number;
  shares: number;
  platform: string;
  date: string;
}

// Zod Schemas
export const CreatePostInputSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  platform: z.string().min(1),
  scheduledAt: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
});

export const GetAnalyticsInputSchema = z.object({
  postId: z.string().optional(),
  campaignId: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const SchedulePostInputSchema = z.object({
  postId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  timezone: z.string().optional(),
});

export const CreateIntegrationSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['zapier', 'make', 'custom']),
  authType: z.enum(['api_key', 'oauth']),
});

export const CreateWebhookSchema = z.object({
  event: z.enum([
    'post.created',
    'post.updated',
    'post.deleted',
    'post.scheduled',
    'post.published',
    'analytics.updated',
    'campaign.started',
    'campaign.ended',
  ]),
  url: z.string().url(),
});

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
