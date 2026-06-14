// Campaign Goal Types
export type GoalType = 'leads' | 'sales' | 'bookings' | 'traffic' | 'awareness';

// Campaign Status
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

// Build Status
export type BuildStatus = 'parsing' | 'generating' | 'completed' | 'failed';

// Channel Types
export type ChannelType = 'google' | 'facebook' | 'instagram' | 'youtube' | 'linkedin' | 'twitter' | 'tiktok' | 'display' | 'native';

// Audience Demographics
export interface Demographics {
  age?: string;
  gender?: string;
  income?: string;
  education?: string;
  occupation?: string[];
}

// Audience Targeting
export interface AudienceTargeting {
  location: string[];
  demographics?: Demographics;
  interests?: string[];
  income?: string;
  behaviors?: string[];
  customSegments?: string[];
}

// Product/Service
export interface Product {
  name: string;
  price?: number;
  category?: string;
  sku?: string;
  description?: string;
}

// Budget Configuration
export interface BudgetConfig {
  amount: number;
  currency: string;
  allocation: {
    channels: Record<string, number>;
    creative: number;
    testing: number;
  };
  optimization: 'aggressive' | 'moderate' | 'conservative';
}

// Parsed Campaign Goal
export interface CampaignGoal {
  type: GoalType;
  target: number;
  timeline?: string;
  kpi?: string;
  conversionMetric?: string;
}

// Parsed Intent
export interface ParsedIntent {
  goal: CampaignGoal;
  audience: AudienceTargeting;
  budget: BudgetConfig;
  products?: Product[];
  channels?: ChannelType[];
  timeline?: {
    startDate?: Date;
    endDate?: Date;
    duration?: string;
  };
  additionalContext?: Record<string, unknown>;
}

// Generated Campaign Ad
export interface CampaignAd {
  id: string;
  type: 'image' | 'video' | 'carousel' | 'text' | 'story';
  headline: string;
  description: string;
  callToAction: string;
  creativeAssets?: {
    images?: string[];
    videos?: string[];
    copyVariants?: string[];
  };
  targetingOverrides?: Partial<AudienceTargeting>;
}

// A/B Test Configuration
export interface ABTestConfig {
  enabled: boolean;
  variants: {
    id: string;
    name: string;
    weight: number;
    changes: Record<string, unknown>;
  }[];
  metric: string;
  sampleSize: number;
  confidence: number;
}

// Campaign Targeting Settings
export interface CampaignTargeting {
  locations: string[];
  ageRange?: { min: number; max: number };
  gender?: string[];
  interests: string[];
  behaviors: string[];
  customAudiences?: string[];
  lookalikeAudiences?: string[];
  placement?: string[];
  deviceTypes?: ('desktop' | 'mobile' | 'tablet')[];
}

// Generated Campaign Structure
export interface GeneratedCampaign {
  name: string;
  objective: GoalType;
  status: CampaignStatus;
  budget: BudgetConfig;
  targeting: CampaignTargeting;
  ads: CampaignAd[];
  schedule: {
    startDate: Date;
    endDate?: Date;
    frequencyCap?: number;
  };
  bidStrategy: {
    type: 'cpc' | 'cpm' | 'cpa' | 'cpv' | 'auto';
    bidAmount?: number;
    maxBid?: number;
    targetCost?: number;
  };
  tracking: {
    pixelIds?: string[];
    conversionEvents?: string[];
    utmParams?: Record<string, string>;
  };
  optimization: {
    bidOptimization: boolean;
    audienceExpansion: boolean;
    placements: string[];
  };
}

// Main NL Campaign Build Interface
export interface NLCampaignBuild {
  buildId: string;
  advertiserId: string;
  naturalLanguage: string;
  parsed: ParsedIntent;
  generatedCampaign: GeneratedCampaign;
  confidence: number;
  suggestions: string[];
  status: BuildStatus;
  errors?: string[];
  warnings?: string[];
  metadata: {
    model?: string;
    processingTime?: number;
    tokensUsed?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// API Request/Response Types
export interface BuildCampaignRequest {
  naturalLanguage: string;
  advertiserId: string;
  context?: {
    previousCampaigns?: string[];
    industry?: string;
    brandGuidelines?: Record<string, string>;
  };
}

export interface BuildCampaignResponse {
  buildId: string;
  success: boolean;
  campaign?: GeneratedCampaign;
  confidence: number;
  suggestions: string[];
  warnings?: string[];
}

export interface ValidateCampaignRequest {
  campaign: Partial<GeneratedCampaign>;
  strict?: boolean;
}

export interface ValidateCampaignResponse {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  score: number;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

export interface AdjustCampaignRequest {
  feedback: string;
  changes?: Partial<GeneratedCampaign>;
}

export interface AdjustCampaignResponse {
  success: boolean;
  updatedCampaign?: GeneratedCampaign;
  confidence: number;
  appliedChanges: string[];
}

// Session/Cache Types
export interface BuildSession {
  sessionId: string;
  advertiserId: string;
  buildId: string;
  naturalLanguage: string;
  step: 'parse' | 'generate' | 'validate' | 'complete';
  progress: number;
  createdAt: Date;
  expiresAt: Date;
}

// Analytics Types
export interface BuildMetrics {
  totalBuilds: number;
  successfulBuilds: number;
  failedBuilds: number;
  averageConfidence: number;
  averageProcessingTime: number;
  buildsByGoalType: Record<GoalType, number>;
  channelRecommendations: Record<ChannelType, number>;
}

// Error Types
export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  advertiserId: string;
  role: 'advertiser' | 'admin' | 'support';
  permissions: string[];
  iat?: number;
  exp?: number;
}