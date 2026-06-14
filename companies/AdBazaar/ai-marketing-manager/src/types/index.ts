import { z } from 'zod';

// Business Profile Schema
export const BusinessProfileSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  location: z.string().min(1).max(500),
  hours: z.string().max(200).optional(),
  priceRange: z.enum(['budget', 'moderate', 'premium', 'luxury']).optional(),
  competitors: z.array(z.string()).optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  socialMedia: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    googleBusiness: z.string().optional(),
  }).optional(),
});

export type BusinessProfile = z.infer<typeof BusinessProfileSchema>;

// Capabilities Schema
export const CapabilitiesSchema = z.object({
  adCreation: z.boolean().default(true),
  reviewManagement: z.boolean().default(true),
  socialPosting: z.boolean().default(true),
  whatsappCampaigns: z.boolean().default(true),
  localSEO: z.boolean().default(true),
  emailMarketing: z.boolean().default(false),
  smsMarketing: z.boolean().default(false),
  loyaltyPrograms: z.boolean().default(false),
});

export type Capabilities = z.infer<typeof CapabilitiesSchema>;

// Campaign Types
export const CampaignTypeSchema = z.enum([
  'social_post',
  'google_ad',
  'facebook_ad',
  'instagram_ad',
  'whatsapp_broadcast',
  'review_request',
  'email_campaign',
  'sms_campaign',
  'loyalty_offer',
]);

export type CampaignType = z.infer<typeof CampaignTypeSchema>;

// Campaign Status
export const CampaignStatusSchema = z.enum([
  'draft',
  'scheduled',
  'active',
  'paused',
  'completed',
  'failed',
]);

export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;

// Campaign Performance
export const CampaignPerformanceSchema = z.object({
  impressions: z.number().int().min(0).default(0),
  clicks: z.number().int().min(0).default(0),
  conversions: z.number().int().min(0).default(0),
  spend: z.number().min(0).default(0),
  revenue: z.number().min(0).default(0),
  reach: z.number().int().min(0).default(0),
  engagement: z.number().int().min(0).default(0),
  ctr: z.number().min(0).default(0),
  cpc: z.number().min(0).default(0),
  roas: z.number().min(0).default(0),
});

export type CampaignPerformance = z.infer<typeof CampaignPerformanceSchema>;

// Active Campaign
export const ActiveCampaignSchema = z.object({
  campaignId: z.string(),
  type: CampaignTypeSchema,
  status: CampaignStatusSchema,
  name: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().min(0).optional(),
  performance: CampaignPerformanceSchema,
  content: z.object({
    headline: z.string().optional(),
    body: z.string().optional(),
    imageUrl: z.string().optional(),
    callToAction: z.string().optional(),
  }).optional(),
});

export type ActiveCampaign = z.infer<typeof ActiveCampaignSchema>;

// Schedule Item
export const ScheduleItemSchema = z.object({
  id: z.string(),
  type: z.enum(['post', 'ad', 'review_request', 'email', 'sms']),
  content: z.string(),
  scheduledFor: z.string(),
  status: z.enum(['pending', 'sent', 'failed', 'cancelled']),
  platform: z.string().optional(),
});

export type ScheduleItem = z.infer<typeof ScheduleItemSchema>;

// Marketing Schedule
export const MarketingScheduleSchema = z.object({
  recurringPosts: z.array(ScheduleItemSchema),
  adSchedules: z.array(ScheduleItemSchema),
  reviewRequests: z.array(ScheduleItemSchema),
});

export type MarketingSchedule = z.infer<typeof MarketingScheduleSchema>;

// Recommendation
export const RecommendationSchema = z.object({
  id: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  category: z.string(),
  action: z.string(),
  description: z.string(),
  expectedImpact: z.string(),
  estimatedCost: z.number().optional(),
  estimatedRevenue: z.number().optional(),
  timeline: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'executed']).default('pending'),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

// Performance Report
export const PerformanceReportSchema = z.object({
  totalReach: z.number().int().min(0).default(0),
  totalImpressions: z.number().int().min(0).default(0),
  totalEngagement: z.number().int().min(0).default(0),
  totalClicks: z.number().int().min(0).default(0),
  totalConversions: z.number().int().min(0).default(0),
  totalSpend: z.number().min(0).default(0),
  totalRevenue: z.number().min(0).default(0),
  roas: z.number().min(0).default(0),
  averageCTR: z.number().min(0).default(0),
  averageCPC: z.number().min(0).default(0),
  periodStart: z.string(),
  periodEnd: z.string(),
});

export type PerformanceReport = z.infer<typeof PerformanceReportSchema>;

// AI Marketing Manager
export const AIMarketingManagerSchema = z.object({
  managerId: z.string(),
  merchantId: z.string(),
  businessProfile: BusinessProfileSchema,
  capabilities: CapabilitiesSchema,
  activeCampaigns: z.array(ActiveCampaignSchema),
  schedule: MarketingScheduleSchema,
  recommendations: z.array(RecommendationSchema),
  performance: PerformanceReportSchema,
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AIMarketingManager = z.infer<typeof AIMarketingManagerSchema>;

// Request/Response Types

// Initialize Request
export const InitializeAIManagerRequestSchema = z.object({
  merchantId: z.string().min(1),
  businessProfile: BusinessProfileSchema,
  capabilities: CapabilitiesSchema.optional(),
});

export type InitializeAIManagerRequest = z.infer<typeof InitializeAIManagerRequestSchema>;

// Recommend Request
export const GetRecommendationsRequestSchema = z.object({
  merchantId: z.string().min(1),
  category: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export type GetRecommendationsRequest = z.infer<typeof GetRecommendationsRequestSchema>;

// Execute Request
export const ExecuteActionRequestSchema = z.object({
  merchantId: z.string().min(1),
  actionType: z.enum([
    'create_campaign',
    'optimize_campaign',
    'respond_to_review',
    'schedule_post',
    'send_whatsapp',
    'request_review',
    'update_seo',
  ]),
  parameters: z.record(z.any()),
});

export type ExecuteActionRequest = z.infer<typeof ExecuteActionRequestSchema>;

// Calendar Request
export const GetCalendarRequestSchema = z.object({
  merchantId: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.string().optional(),
});

export type GetCalendarRequest = z.infer<typeof GetCalendarRequestSchema>;

// Performance Request
export const GetPerformanceRequestSchema = z.object({
  merchantId: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  campaignId: z.string().optional(),
});

export type GetPerformanceRequest = z.infer<typeof GetPerformanceRequestSchema>;

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    requestId?: string;
  };
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth Types
export interface JWTPayload {
  userId: string;
  merchantId?: string;
  role: 'admin' | 'merchant' | 'user';
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest {
  user: JWTPayload;
  headers: {
    authorization?: string;
  };
}

// Campaign Creation
export const CreateCampaignRequestSchema = z.object({
  merchantId: z.string().min(1),
  type: CampaignTypeSchema,
  name: z.string().min(1).max(200),
  content: z.object({
    headline: z.string().min(1).max(100),
    body: z.string().min(1).max(2000),
    imageUrl: z.string().url().optional(),
    callToAction: z.string().max(50).optional(),
  }),
  budget: z.number().min(0).optional(),
  schedule: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    frequency: z.enum(['once', 'daily', 'weekly', 'monthly']).optional(),
  }).optional(),
});

export type CreateCampaignRequest = z.infer<typeof CreateCampaignRequestSchema>;

// Review Response
export const ReviewResponseRequestSchema = z.object({
  merchantId: z.string().min(1),
  reviewId: z.string().min(1),
  response: z.string().min(1).max(1000),
  tone: z.enum(['professional', 'friendly', 'apologetic', 'grateful']).optional(),
});

export type ReviewResponseRequest = z.infer<typeof ReviewResponseRequestSchema>;

// WhatsApp Campaign
export const WhatsAppCampaignRequestSchema = z.object({
  merchantId: z.string().min(1),
  campaignName: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  segment: z.enum(['all_customers', 'recent_customers', 'vip_customers', 'inactive_customers']),
  scheduledFor: z.string().optional(),
});

export type WhatsAppCampaignRequest = z.infer<typeof WhatsAppCampaignRequestSchema>;

// SEO Update
export const SEOUpdateRequestSchema = z.object({
  merchantId: z.string().min(1),
  updates: z.object({
    title: z.string().max(60).optional(),
    description: z.string().max(160).optional(),
    keywords: z.array(z.string()).optional(),
    businessHours: z.string().optional(),
    photos: z.array(z.string().url()).optional(),
  }),
});

export type SEOUpdateRequest = z.infer<typeof SEOUpdateRequestSchema>;