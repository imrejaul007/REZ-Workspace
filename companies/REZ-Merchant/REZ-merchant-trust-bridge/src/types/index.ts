import { z } from 'zod';

/**
 * Trust Score Schema - Validates incoming trust data
 */
export const TrustScoreSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  score: z.number().min(0).max(100),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  factors: z.object({
    paymentHistory: z.number().min(0).max(100),
    disputeRate: z.number().min(0).max(100),
    complianceScore: z.number().min(0).max(100),
    businessAge: z.number().min(0).max(100),
    volumeScore: z.number().min(0).max(100),
  }),
  lastUpdated: z.string().datetime().or(z.date()),
  source: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export type TrustScore = z.infer<typeof TrustScoreSchema>;

/**
 * Merchant Credit Limit Schema
 */
export const CreditLimitSchema = z.object({
  merchantId: z.string().min(1),
  currentLimit: z.number().min(0),
  availableLimit: z.number().min(0),
  usedLimit: z.number().min(0),
  creditUtilization: z.number().min(0).max(100),
  lastCalculated: z.string().datetime().or(z.date()),
  expiresAt: z.string().datetime().or(z.date()).optional(),
});

export type CreditLimit = z.infer<typeof CreditLimitSchema>;

/**
 * Trust Alert Schema
 */
export const TrustAlertSchema = z.object({
  merchantId: z.string(),
  alertType: z.enum([
    'TRUST_DROP',
    'RISK_INCREASE',
    'LIMIT_THRESHOLD',
    'BLOCK_TRIGGERED',
    'COMPLIANCE_ISSUE',
  ]),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  message: z.string(),
  previousScore: z.number().optional(),
  currentScore: z.number().optional(),
  createdAt: z.string().datetime().or(z.date()),
  acknowledged: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional(),
});

export type TrustAlert = z.infer<typeof TrustAlertSchema>;

/**
 * Sync Request Schema
 */
export const SyncRequestSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  forceSync: z.boolean().default(false),
});

export type SyncRequest = z.infer<typeof SyncRequestSchema>;

/**
 * Batch Sync Request Schema
 */
export const BatchSyncRequestSchema = z.object({
  merchantIds: z.array(z.string().min(1)).min(1).max(100),
  forceSync: z.boolean().default(false),
});

export type BatchSyncRequest = z.infer<typeof BatchSyncRequestSchema>;

/**
 * API Response Types
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Trust Dashboard Data
 */
export interface TrustDashboardData {
  merchantId: string;
  businessName: string;
  trustScore: number;
  riskLevel: TrustScore['riskLevel'];
  creditLimit: CreditLimit;
  factors: TrustScore['factors'];
  recentAlerts: TrustAlert[];
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  lastSynced: string;
}

/**
 * Trust Source Configuration
 */
export interface TrustSourceConfig {
  id: string;
  name: string;
  endpoint: string;
  apiKey?: string;
  enabled: boolean;
  syncInterval: number; // in milliseconds
  timeout: number; // in milliseconds
}

/**
 * Limit Calculation Rules
 */
export interface LimitCalculationRule {
  minScore: number;
  maxScore: number;
  riskLevel: TrustScore['riskLevel'];
  baseLimit: number;
  limitMultiplier: number;
  maxLimit: number;
  minLimit: number;
}

/**
 * Service Configuration
 */
export interface ServiceConfig {
  port: number;
  mongodbUri: string;
  logLevel: string;
  trustSources: TrustSourceConfig[];
  limitRules: LimitCalculationRule[];
  alertThresholds: {
    trustDropPercent: number;
    riskIncreasePercent: number;
    criticalScore: number;
  };
  syncInterval: number;
  rateLimitWindow: number;
  rateLimitMax: number;
}
