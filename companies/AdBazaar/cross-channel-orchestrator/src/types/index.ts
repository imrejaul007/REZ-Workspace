import { z } from 'zod';

// Campaign Objective Types
export type CampaignObjective = 'awareness' | 'engagement' | 'conversion' | 'retention';

// Channel Types
export type Channel = 'whatsapp' | 'sms' | 'email' | 'push';

// Campaign Status Types
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';

// Frequency Types
export type CampaignFrequency = 'once' | 'daily' | 'weekly';

// WhatsApp Content
export interface WhatsAppContent {
  template: string;
  variables: Record<string, string>;
  headerType?: 'text' | 'image' | 'video';
  footerText?: string;
  buttons?: Array<{
    type: 'url' | 'quick_reply';
    text: string;
    url?: string;
  }>;
}

// SMS Content
export interface SMSContent {
  message: string;
  senderId?: string;
  characterLimit?: number;
}

// Email Content
export interface EmailContent {
  subject: string;
  body: string;
  template?: string;
  fromName?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    url: string;
    type: string;
  }>;
}

// Push Content
export interface PushContent {
  title: string;
  body: string;
  image?: string;
  icon?: string;
  clickAction?: string;
  badge?: number;
  sound?: string;
  priority?: 'high' | 'normal' | 'low';
  data?: Record<string, string>;
}

// Budget by Channel
export interface BudgetByChannel {
  whatsapp?: number;
  sms?: number;
  email?: number;
  push?: number;
}

// Campaign Budget
export interface CampaignBudget {
  total: number;
  byChannel: BudgetByChannel;
  spent: number;
  currency: string;
}

// Targeting Configuration
export interface TargetingConfig {
  audienceIds: string[];
  segments: string[];
  customAudience?: {
    demographics?: {
      ageRange?: { min: number; max: number };
      gender?: string[];
      location?: string[];
      language?: string[];
    };
    behavior?: {
      purchaseHistory?: boolean;
      engagementLevel?: ('high' | 'medium' | 'low')[];
      lastActiveDays?: number;
    };
    interests?: string[];
  };
}

// Scheduling Configuration
export interface SchedulingConfig {
  startDate: Date;
  endDate: Date;
  frequency: CampaignFrequency;
  optimalTime?: string;
  timezone?: string;
  dayOfWeek?: number[];
}

// Campaign Metrics
export interface CampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue: number;
  unsubscribed: number;
  bounced: number;
  failed: number;
  byChannel: {
    whatsapp?: CampaignMetrics;
    sms?: CampaignMetrics;
    email?: CampaignMetrics;
    push?: CampaignMetrics;
  };
}

// Cross-Channel Campaign Interface
export interface CrossChannelCampaign {
  campaignId: string;
  advertiserId: string;
  name: string;
  description?: string;
  objective: CampaignObjective;
  channels: Channel[];
  budget: CampaignBudget;
  targeting: TargetingConfig;
  content: {
    whatsapp?: WhatsAppContent;
    sms?: SMSContent;
    email?: EmailContent;
    push?: PushContent;
  };
  scheduling: SchedulingConfig;
  status: CampaignStatus;
  metrics: CampaignMetrics;
  abTest?: {
    enabled: boolean;
    variants: Array<{
      id: string;
      name: string;
      content: CrossChannelCampaign['content'];
      percentage: number;
    }>;
    winningVariant?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  launchedAt?: Date;
  pausedAt?: Date;
  completedAt?: Date;
}

// Channel Configuration
export interface ChannelConfig {
  channel: Channel;
  enabled: boolean;
  apiKey?: string;
  apiUrl: string;
  rateLimit: number;
  dailyLimit: number;
  costPerMessage: number;
}

// Available Channel Info
export interface ChannelInfo {
  channel: Channel;
  name: string;
  description: string;
  capabilities: string[];
  maxMessageLength: number;
  supportsMedia: boolean;
  supportsTemplates: boolean;
  estimatedReach: number;
}

// Create Campaign Request
export interface CreateCampaignRequest {
  name: string;
  description?: string;
  objective: CampaignObjective;
  channels: Channel[];
  budget: {
    total: number;
    byChannel?: BudgetByChannel;
  };
  targeting: TargetingConfig;
  content: CrossChannelCampaign['content'];
  scheduling: {
    startDate: string;
    endDate: string;
    frequency: CampaignFrequency;
    optimalTime?: string;
    timezone?: string;
    dayOfWeek?: number[];
  };
  abTest?: {
    enabled: boolean;
    variants: Array<{
      name: string;
      content: CrossChannelCampaign['content'];
      percentage: number;
    }>;
  };
}

// Update Campaign Request
export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  objective?: CampaignObjective;
  channels?: Channel[];
  budget?: {
    total?: number;
    byChannel?: BudgetByChannel;
  };
  targeting?: TargetingConfig;
  content?: CrossChannelCampaign['content'];
  scheduling?: Partial<SchedulingConfig>;
}

// Campaign Statistics Response
export interface CampaignStatistics {
  campaignId: string;
  status: CampaignStatus;
  metrics: CampaignMetrics;
  performance: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    roi: number;
    ctr: number;
  };
  budget: {
    total: number;
    spent: number;
    remaining: number;
    byChannel: BudgetByChannel;
  };
  timeline: {
    startDate: Date;
    endDate: Date;
    duration: number;
    daysRemaining: number;
  };
  channelBreakdown: Array<{
    channel: Channel;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    cost: number;
  }>;
}

// Zod Schemas for Validation
export const ChannelSchema = z.enum(['whatsapp', 'sms', 'email', 'push']);
export const CampaignObjectiveSchema = z.enum(['awareness', 'engagement', 'conversion', 'retention']);
export const CampaignStatusSchema = z.enum(['draft', 'scheduled', 'active', 'paused', 'completed']);
export const CampaignFrequencySchema = z.enum(['once', 'daily', 'weekly']);

export const WhatsAppContentSchema = z.object({
  template: z.string().min(1),
  variables: z.record(z.string()).optional(),
  headerType: z.enum(['text', 'image', 'video']).optional(),
  footerText: z.string().optional(),
  buttons: z.array(z.object({
    type: z.enum(['url', 'quick_reply']),
    text: z.string(),
    url: z.string().optional(),
  })).optional(),
});

export const SMSContentSchema = z.object({
  message: z.string().min(1).max(1600),
  senderId: z.string().optional(),
});

export const EmailContentSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  template: z.string().optional(),
  fromName: z.string().optional(),
  replyTo: z.string().email().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string(),
    type: z.string(),
  })).optional(),
});

export const PushContentSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  image: z.string().url().optional(),
  icon: z.string().optional(),
  clickAction: z.string().optional(),
  badge: z.number().optional(),
  sound: z.string().optional(),
  priority: z.enum(['high', 'normal', 'low']).optional(),
  data: z.record(z.string()).optional(),
});

export const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  objective: CampaignObjectiveSchema,
  channels: z.array(ChannelSchema).min(1),
  budget: z.object({
    total: z.number().positive(),
    byChannel: z.record(z.number()).optional(),
  }),
  targeting: z.object({
    audienceIds: z.array(z.string()).optional(),
    segments: z.array(z.string()).optional(),
    customAudience: z.object({
      demographics: z.object({
        ageRange: z.object({ min: z.number(), max: z.number() }).optional(),
        gender: z.array(z.string()).optional(),
        location: z.array(z.string()).optional(),
        language: z.array(z.string()).optional(),
      }).optional(),
      behavior: z.object({
        purchaseHistory: z.boolean().optional(),
        engagementLevel: z.array(z.enum(['high', 'medium', 'low'])).optional(),
        lastActiveDays: z.number().optional(),
      }).optional(),
      interests: z.array(z.string()).optional(),
    }).optional(),
  }),
  content: z.object({
    whatsapp: WhatsAppContentSchema.optional(),
    sms: SMSContentSchema.optional(),
    email: EmailContentSchema.optional(),
    push: PushContentSchema.optional(),
  }),
  scheduling: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    frequency: CampaignFrequencySchema,
    optimalTime: z.string().optional(),
    timezone: z.string().optional(),
    dayOfWeek: z.array(z.number().min(0).max(6)).optional(),
  }),
  abTest: z.object({
    enabled: z.boolean(),
    variants: z.array(z.object({
      name: z.string(),
      content: z.object({
        whatsapp: WhatsAppContentSchema.optional(),
        sms: SMSContentSchema.optional(),
        email: EmailContentSchema.optional(),
        push: PushContentSchema.optional(),
      }),
      percentage: z.number().min(0).max(100),
    })),
  }).optional(),
});

export const UpdateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  objective: CampaignObjectiveSchema.optional(),
  channels: z.array(ChannelSchema).min(1).optional(),
  budget: z.object({
    total: z.number().positive().optional(),
    byChannel: z.record(z.number()).optional(),
  }).optional(),
  targeting: z.object({
    audienceIds: z.array(z.string()).optional(),
    segments: z.array(z.string()).optional(),
    customAudience: z.any().optional(),
  }).optional(),
  content: z.object({
    whatsapp: WhatsAppContentSchema.optional(),
    sms: SMSContentSchema.optional(),
    email: EmailContentSchema.optional(),
    push: PushContentSchema.optional(),
  }).optional(),
  scheduling: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    frequency: CampaignFrequencySchema.optional(),
    optimalTime: z.string().optional(),
    timezone: z.string().optional(),
    dayOfWeek: z.array(z.number().min(0).max(6)).optional(),
  }).optional(),
});

// JWT Payload
export interface JWTPayload {
  userId: string;
  advertiserId: string;
  role: 'admin' | 'advertiser' | 'viewer';
  permissions: string[];
  iat?: number;
  exp?: number;
}

// API Response Types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Redis Keys
export const REDIS_KEYS = {
  CAMPAIGN_LOCK: (campaignId: string) => `campaign:lock:${campaignId}`,
  CAMPAIGN_METRICS: (campaignId: string) => `campaign:metrics:${campaignId}`,
  CHANNEL_QUEUE: (channel: string) => `channel:queue:${channel}`,
  CAMPAIGN_RATE: (campaignId: string) => `campaign:rate:${campaignId}`,
  AB_TEST_VARIANT: (campaignId: string, userId: string) => `abtest:${campaignId}:${userId}`,
};

// Metrics Labels
export const METRICS_LABELS = {
  CHANNEL: 'channel',
  CAMPAIGN_ID: 'campaign_id',
  STATUS: 'status',
  OBJECTIVE: 'objective',
};