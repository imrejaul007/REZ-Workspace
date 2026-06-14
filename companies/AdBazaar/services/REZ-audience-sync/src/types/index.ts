import { z } from 'zod';

// Enums
export enum DmpProvider {
  LIVERAMP = 'liveramp',
  SEGMENT = 'segment',
  CUSTOM = 'custom'
}

export enum AudienceStatus {
  PENDING = 'pending',
  SYNCING = 'syncing',
  ACTIVE = 'active',
  PAUSED = 'paused',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export enum AudienceType {
  FIRST_PARTY = 'first_party',
  THIRD_PARTY = 'third_party',
  LOOKALIKE = 'lookalike',
  RETARGETING = 'retargeting'
}

export enum IdentifierType {
  EMAIL = 'email',
  PHONE = 'phone',
  IDFA = 'idfa',
  GAID = 'gaid',
  IDFV = 'idfv',
  COOKIE = 'cookie',
  CUSTOM = 'custom'
}

export enum SyncDirection {
  UPLOAD = 'upload',
  DOWNLOAD = 'download'
}

// Zod Schemas
export const AudienceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  provider: z.nativeEnum(DmpProvider),
  audienceType: z.nativeEnum(AudienceType),
  status: z.nativeEnum(AudienceStatus).default(AudienceStatus.PENDING),
  size: z.number().int().min(0).default(0),
  segmentId: z.string().optional(),
  platformIds: z.record(z.string()).default({}),
  identifiers: z.array(z.object({
    type: z.nativeEnum(IdentifierType),
    format: z.string().optional()
  })).default([]),
  lookbackDays: z.number().int().min(1).max(365).default(30),
  metadata: z.record(z.any()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastSyncAt: z.date().optional()
});

export const AudienceMemberSchema = z.object({
  id: z.string().uuid(),
  audienceId: z.string().uuid(),
  identifier: z.string(),
  identifierType: z.nativeEnum(IdentifierType),
  traits: z.record(z.any()).default({}),
  firstSeen: z.date(),
  lastSeen: z.date(),
  engagement: z.number().min(0).max(1).default(0)
});

export const CrossDeviceMappingSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  deviceIds: z.array(z.string()).default([]),
  identifiers: z.record(z.array(z.string())).default({}),
  confidence: z.number().min(0).max(1).default(0),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const SyncJobSchema = z.object({
  id: z.string().uuid(),
  audienceId: z.string().uuid(),
  direction: z.nativeEnum(SyncDirection),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
  recordsTotal: z.number().int().default(0),
  recordsProcessed: z.number().int().default(0),
  recordsSuccess: z.number().int().default(0),
  recordsFailed: z.number().int().default(0),
  error: z.string().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  createdAt: z.date()
});

// Types
export type Audience = z.infer<typeof AudienceSchema>;
export type AudienceMember = z.infer<typeof AudienceMemberSchema>;
export type CrossDeviceMapping = z.infer<typeof CrossDeviceMappingSchema>;
export type SyncJob = z.infer<typeof SyncJobSchema>;

export interface AudienceSegment {
  audienceId: string;
  segmentId: string;
  platform: string;
  externalAudienceId: string;
}

// API Types
export interface CreateAudienceInput {
  name: string;
  description?: string;
  provider: DmpProvider;
  audienceType: AudienceType;
  identifiers?: Array<{ type: IdentifierType; format?: string }>;
  lookbackDays?: number;
  metadata?: Record<string, any>;
}

export interface UpdateAudienceInput {
  name?: string;
  description?: string;
  status?: AudienceStatus;
  identifiers?: Array<{ type: IdentifierType; format?: string }>;
  lookbackDays?: number;
  metadata?: Record<string, any>;
}

export interface AudienceUploadInput {
  audienceId: string;
  members: Array<{
    identifier: string;
    identifierType: IdentifierType;
    traits?: Record<string, any>;
  }>;
  overwrite?: boolean;
}

export interface CrossDeviceMatchInput {
  sourceId: string;
  sourceType: IdentifierType;
  targetType: IdentifierType;
  threshold?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
