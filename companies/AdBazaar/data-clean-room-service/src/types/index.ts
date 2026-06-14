import { z } from 'zod';

// ============ DATA INGESTION SCHEMAS ============

export const HashAlgorithmSchema = z.enum(['SHA256', 'MD5', 'SHA1']);
export type HashAlgorithm = z.infer<typeof HashAlgorithmSchema>;

export const IdentifierTypeSchema = z.enum(['email', 'phone', 'device_id', 'cookie', 'custom']);
export type IdentifierType = z.infer<typeof IdentifierTypeSchema>;

export const DataFormatSchema = z.enum(['csv', 'json', 'tsv', 'xml']);
export type DataFormat = z.infer<typeof DataFormatSchema;

export const UploadStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);
export type UploadStatus = z.infer<typeof UploadStatusSchema];

// Brand data record schema
export const DataRecordSchema = z.object({
  identifier: z.string().min(1),
  identifierType: IdentifierTypeSchema,
  hashedValue: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type DataRecord = z.infer<typeof DataRecordSchema>;

// Upload request schema
export const UploadDataRequestSchema = z.object({
  brandId: z.string().min(1),
  campaignId: z.string().optional(),
  dataFormat: DataFormatSchema,
  hashAlgorithm: HashAlgorithmSchema.optional().default('SHA256'),
  identifiers: z.array(z.object({
    type: IdentifierTypeSchema,
    column: z.string().optional(),
  })),
  data: z.string(), // Base64 encoded or raw CSV
  metadata: z.object({
    name: z.string(),
    description: z.string().optional(),
    segments: z.array(z.string()).optional(),
  }),
});

export type UploadDataRequest = z.infer<typeof UploadDataRequestSchema>;

// ============ MATCHING SCHEMAS ============

export const MatchTypeSchema = z.enum(['deterministic', 'probabilistic', 'hybrid']);
export type MatchType = z.infer<typeof MatchTypeSchema>;

export const MatchStatusSchema = z.enum(['pending', 'running', 'completed', 'failed']);
export type MatchStatus = z.infer<typeof MatchStatusSchema>;

// Match request schema
export const MatchRequestSchema = z.object({
  uploadId: z.string().uuid(),
  matchType: MatchTypeSchema.optional().default('deterministic'),
  matchThreshold: z.number().min(0).max(1).optional().default(0.7),
  segments: z.array(z.string()).optional(),
  privacyBudget: z.number().min(0).max(1).optional().default(1.0),
});

export type MatchRequest = z.infer<typeof MatchRequestSchema>;

// Match result schema
export interface MatchSegmentResult {
  name: string;
  total: number;
  matched: number;
  matchRate: number;
}

export interface MatchResult {
  uploadId: string;
  matchId: string;
  matchType: MatchType;
  uploadedRecords: number;
  matchedRecords: number;
  matchRate: number;
  segments: MatchSegmentResult[];
  matchRateBySegment: Record<string, number>;
  processingTimeMs: number;
  createdAt: Date;
}

export interface MatchResultResponse {
  success: boolean;
  data?: MatchResult;
  error?: string;
}

// ============ OVERLAP ANALYSIS SCHEMAS ============

export const OverlapAnalysisRequestSchema = z.object({
  uploadId1: z.string().uuid(),
  uploadId2: z.string().uuid(),
  analysisType: z.enum(['exact', 'fuzzy', 'segment']).optional().default('exact'),
});

export type OverlapAnalysisRequest = z.infer<typeof OverlapAnalysisRequestSchema>;

export interface OverlapResult {
  uploadId1: string;
  uploadId2: string;
  totalRecords1: number;
  totalRecords2: number;
  overlappingRecords: number;
  overlapPercentage: number;
  uniqueToUpload1: number;
  uniqueToUpload2: number;
  jaccardIndex: number;
  segmentOverlap: Record<string, {
    overlap: number;
    percentage: number;
  }>;
}

// ============ AUDIENCE ACTIVATION SCHEMAS ============

export const ActivationTargetSchema = z.enum(['dsp', 'ssp', 'dmp', 'lookalike', 'custom']);
export type ActivationTarget = z.infer<typeof ActivationTargetSchema>;

export const ActivationStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);
export type ActivationStatus = z.infer<typeof ActivationStatusSchema>;

export const ActivationRequestSchema = z.object({
  matchId: z.string().uuid(),
  target: ActivationTargetSchema,
  targetConfig: z.object({
    platform: z.string().optional(),
    audienceName: z.string().optional(),
    customEndpoint: z.string().url().optional(),
  }),
  options: z.object({
    includeMetadata: z.boolean().optional().default(false),
    createLookalikes: z.boolean().optional().default(false),
    lookalikeSize: z.number().min(1).max(100).optional().default(10),
  }).optional(),
});

export type ActivationRequest = z.infer<typeof ActivationRequestSchema>;

export interface ActivationResult {
  activationId: string;
  matchId: string;
  target: ActivationTarget;
  status: ActivationStatus;
  recordsActivated: number;
  targetAudienceId: string;
  targetResponse: Record<string, unknown>;
  createdAt: Date;
  completedAt: Date | null;
}

// ============ CAMPAIGN SCHEMAS ============

export const CampaignSchema = z.object({
  brandId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  budget: z.number().optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).default('active'),
});

export type Campaign = z.infer<typeof CampaignSchema>;

// ============ ANALYTICS SCHEMAS ============

export interface MatchAnalytics {
  totalUploads: number;
  totalRecordsProcessed: number;
  totalMatches: number;
  averageMatchRate: number;
  topSegments: Array<{
    name: string;
    matchCount: number;
  }>;
  matchRateTrend: Array<{
    date: string;
    rate: number;
  }>;
}

// ============ HEALTH CHECK ============

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    mongodb: boolean;
    customerGraph: boolean;
    identityCloud: boolean;
    hojaiAI: boolean;
  };
}

// ============ API RESPONSE ============

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}