// Zod schemas for validation
import { z } from 'zod';

// Experiment status enum
export enum ExperimentStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Market type enum
export enum MarketType {
  TREATMENT = 'treatment',
  CONTROL = 'control'
}

// Create experiment schema
export const CreateExperimentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  confidenceLevel: z.number().min(0.8).max(0.99).default(0.95),
  minMarketDurationDays: z.number().min(1).max(90).default(7),
  minControlSizePercent: z.number().min(1).max(50).default(5),
  campaignId: z.string().optional(),
  targeting: z.object({
    locations: z.array(z.string()).optional(),
    dmaCodes: z.array(z.string()).optional(),
    demographics: z.object({
      ageRanges: z.array(z.string()).optional(),
      genders: z.array(z.string()).optional(),
      incomeBrackets: z.array(z.string()).optional()
    }).optional()
  }).optional(),
  metrics: z.array(z.enum(['impressions', 'reach', 'visits', 'conversions', 'revenue', 'ctr', 'vtr'])).default(['impressions', 'conversions']),
  hypothesis: z.string().max(2000).optional(),
  metadata: z.record(z.any()).optional()
});

// Update experiment schema
export const UpdateExperimentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.nativeEnum(ExperimentStatus).optional(),
  hypothesis: z.string().max(2000).optional(),
  metadata: z.record(z.any()).optional()
});

// Add market schema
export const AddMarketSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.nativeEnum(MarketType),
  dmaCode: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('US'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(0).optional(),
  population: z.number().min(0).optional(),
  expectedReach: z.number().min(0).optional()
});

// Set treatment schema
export const SetTreatmentSchema = z.object({
  marketId: z.string(),
  spend: z.number().min(0),
  impressions: z.number().min(0).optional(),
  reach: z.number().min(0).optional(),
  frequency: z.number().min(0).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
});

// Set control schema
export const SetControlSchema = z.object({
  marketId: z.string(),
  baseline: z.object({
    impressions: z.number().min(0),
    reach: z.number().min(0),
    conversions: z.number().min(0),
    revenue: z.number().min(0)
  }),
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
});

// Query params schemas
export const ListExperimentsQuerySchema = z.object({
  status: z.nativeEnum(ExperimentStatus).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'createdAt', 'startDate', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Type exports
export type CreateExperimentInput = z.infer<typeof CreateExperimentSchema>;
export type UpdateExperimentInput = z.infer<typeof UpdateExperimentSchema>;
export type AddMarketInput = z.infer<typeof AddMarketSchema>;
export type SetTreatmentInput = z.infer<typeof SetTreatmentSchema>;
export type SetControlInput = z.infer<typeof SetControlSchema>;
export type ListExperimentsQuery = z.infer<typeof ListExperimentsQuerySchema>;

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Geo result interface
export interface GeoResult {
  experimentId: string;
  marketId: string;
  marketName: string;
  marketType: MarketType;
  lift: number;
  confidence: number;
  pValue: number;
  isSignificant: boolean;
  sampleSize: number;
  treatmentMetrics: {
    impressions: number;
    reach: number;
    conversions: number;
    revenue: number;
    ctr?: number;
    vtr?: number;
  };
  controlMetrics?: {
    impressions: number;
    reach: number;
    conversions: number;
    revenue: number;
  };
  calculatedAt: Date;
}

// Experiment summary
export interface ExperimentSummary {
  id: string;
  name: string;
  status: ExperimentStatus;
  startDate?: Date;
  endDate?: Date;
  treatmentMarkets: number;
  controlMarkets: number;
  totalMarkets: number;
  confidenceLevel: number;
  createdAt: Date;
}

// Lift analysis
export interface LiftAnalysis {
  experimentId: string;
  experimentName: string;
  overallLift: number;
  overallConfidence: number;
  isSignificant: boolean;
  marketResults: GeoResult[];
  recommendations: string[];
  analyzedAt: Date;
}