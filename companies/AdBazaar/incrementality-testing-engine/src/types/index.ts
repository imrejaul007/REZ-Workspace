import { z } from 'zod';

// Experiment Types
export enum ExperimentType {
  A_B_TEST = 'a_b_test',
  HOLD_OUT = 'hold_out',
  GEO_TEST = 'geo_test',
  RANDOMIZED_CONTROLLED = 'randomized_controlled'
}

export enum ExperimentStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export enum TestGroupType {
  TREATMENT = 'treatment',
  CONTROL = 'control'
}

// Targeting Schema
export const TargetingSchema = z.object({
  demographics: z.object({
    ageRanges: z.array(z.string()).optional(),
    genders: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional(),
    incomeBrackets: z.array(z.string()).optional()
  }).optional(),
  behavior: z.object({
    interests: z.array(z.string()).optional(),
    purchaseFrequency: z.string().optional(),
    brandAffinity: z.array(z.string()).optional()
  }).optional(),
  geo: z.object({
    countries: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional(),
    cities: z.array(z.string()).optional(),
    postalCodes: z.array(z.string()).optional()
  }).optional(),
  device: z.object({
    types: z.array(z.string()).optional(),
    os: z.array(z.string()).optional()
  }).optional()
});

export type Targeting = z.infer<typeof TargetingSchema>;

// Metrics Schema
export const MetricsSchema = z.object({
  impressions: z.number().int().min(0).default(0),
  clicks: z.number().int().min(0).default(0),
  conversions: z.number().int().min(0).default(0),
  revenue: z.number().min(0).default(0),
  cost: z.number().min(0).default(0),
  ctr: z.number().min(0).default(0),
  cvr: z.number().min(0).default(0),
  roas: z.number().default(0),
  cpa: z.number().default(0),
  engagement: z.number().min(0).default(0),
  brandAwareness: z.number().min(0).max(100).default(0),
  consideration: z.number().min(0).max(100).default(0),
  intent: z.number().min(0).max(100).default(0)
});

export type Metrics = z.infer<typeof MetricsSchema>;

// Geo Test Schema
export const GeoTestSchema = z.object({
  region: z.string(),
  treatmentRegions: z.array(z.string()),
  controlRegions: z.array(z.string()),
  budget: z.number().min(0),
  duration: z.number().int().min(1)
});

export type GeoTest = z.infer<typeof GeoTestSchema>;

// Lift Analysis Schema
export const LiftAnalysisSchema = z.object({
  absoluteLift: z.number(),
  relativeLift: z.number(),
  confidenceInterval: z.object({
    lower: z.number(),
    upper: z.number()
  }),
  pValue: z.number(),
  sampleSize: z.number(),
  statisticalPower: z.number(),
  minimumDetectableEffect: z.number(),
  isSignificant: z.boolean()
});

export type LiftAnalysis = z.infer<typeof LiftAnalysisSchema>;

// Recommendation Schema
export const RecommendationSchema = z.object({
  type: z.enum(['scaling', 'budget_reallocation', 'creative', 'targeting', 'timing']),
  priority: z.enum(['high', 'medium', 'low']),
  title: z.string(),
  description: z.string(),
  expectedImpact: z.number(),
  confidence: z.number(),
  actionItems: z.array(z.string())
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

// IExperiment Interface
export interface IExperiment {
  _id?: string;
  name: string;
  description: string;
  type: ExperimentType;
  status: ExperimentStatus;
  startDate?: Date;
  endDate?: Date;
  targeting: Targeting;
  budget: number;
  spent: number;
  metrics: Metrics;
  testGroups: string[];
  results: string[];
  liftAnalyses: string[];
  recommendations: Recommendation[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// ITestGroup Interface
export interface ITestGroup {
  _id?: string;
  experimentId: string;
  name: string;
  type: TestGroupType;
  size: number;
  metrics: Metrics;
  allocation: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// IResult Interface
export interface IResult {
  _id?: string;
  experimentId: string;
  groupId: string;
  date: Date;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cost: number;
  lift?: number;
  confidence?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ILiftAnalysis Interface
export interface ILiftAnalysis {
  _id?: string;
  experimentId: string;
  groupId?: string;
  lift: number;
  absoluteLift: number;
  relativeLift: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  pValue: number;
  tStatistic: number;
  sampleSize: number;
  statisticalPower: number;
  minimumDetectableEffect: number;
  isSignificant: boolean;
  confidenceLevel: number;
  analysisDate: Date;
  createdAt: Date;
}

// Request/Response Types
export interface CreateExperimentRequest {
  name: string;
  description: string;
  type: ExperimentType;
  targeting?: Targeting;
  budget?: number;
  testGroups?: Array<{
    name: string;
    type: TestGroupType;
    allocation: number;
  }>;
}

export interface UpdateExperimentRequest {
  name?: string;
  description?: string;
  targeting?: Targeting;
  budget?: number;
}

export interface RunAnalysisRequest {
  confidenceLevel?: number;
  groupId?: string;
}

export interface CreateGeoTestRequest {
  region: string;
  treatmentRegions: string[];
  controlRegions: string[];
  budget: number;
  duration: number;
  targeting?: Targeting;
}

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
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}