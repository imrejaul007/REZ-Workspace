import { z } from 'zod';

// Goal types enum
export const GoalTypeEnum = z.enum([
  'leads',
  'sales',
  'bookings',
  'app_installs',
  'engagement'
]);
export type GoalType = z.infer<typeof GoalTypeEnum>;

// Campaign status enum
export const CampaignStatusEnum = z.enum([
  'planning',
  'running',
  'paused',
  'completed',
  'failed'
]);
export type CampaignStatus = z.infer<typeof CampaignStatusEnum>;

// Log level enum
export const LogLevelEnum = z.enum(['info', 'warning', 'error']);
export type LogLevel = z.infer<typeof LogLevelEnum>;

// Goal schema
export const GoalSchema = z.object({
  type: GoalTypeEnum,
  target: z.number().positive(),
  budget: z.number().positive(),
  deadline: z.date().optional()
});
export type Goal = z.infer<typeof GoalSchema>;

// Current status schema
export const CurrentStatusSchema = z.object({
  achieved: z.number().min(0).default(0),
  progress: z.number().min(0).max(100).default(0),
  spend: z.number().min(0).default(0),
  cpa: z.number().min(0).default(0),
  roas: z.number().min(0).default(0)
});
export type CurrentStatus = z.infer<typeof CurrentStatusSchema>;

// Agent action schema
export const AgentActionSchema = z.object({
  timestamp: z.date(),
  action: z.string(),
  details: z.record(z.unknown()),
  result: z.record(z.unknown()).optional()
});
export type AgentAction = z.infer<typeof AgentActionSchema>;

// Decision schema
export const DecisionSchema = z.object({
  audienceTargeted: z.array(z.string()).default([]),
  creativesUsed: z.array(z.string()).default([]),
  channelsActive: z.array(z.string()).default([]),
  bidStrategy: z.string().default('auto')
});
export type Decision = z.infer<typeof DecisionSchema>;

// Log entry schema
export const LogEntrySchema = z.object({
  timestamp: z.date(),
  level: LogLevelEnum,
  message: z.string(),
  context: z.record(z.unknown()).optional()
});
export type LogEntry = z.infer<typeof LogEntrySchema>;

// Goal-driven campaign schema
export const GoalDrivenCampaignSchema = z.object({
  campaignId: z.string(),
  agentId: z.string(),
  advertiserId: z.string(),
  name: z.string(),
  goal: GoalSchema,
  currentStatus: CurrentStatusSchema.default({
    achieved: 0,
    progress: 0,
    spend: 0,
    cpa: 0,
    roas: 0
  }),
  agentActions: z.array(AgentActionSchema).default([]),
  decisions: DecisionSchema.default({
    audienceTargeted: [],
    creativesUsed: [],
    channelsActive: [],
    bidStrategy: 'auto'
  }),
  status: CampaignStatusEnum.default('planning'),
  logs: z.array(LogEntrySchema).default([]),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type GoalDrivenCampaign = z.infer<typeof GoalDrivenCampaignSchema>;

// API Request schemas
export const CreateCampaignRequestSchema = z.object({
  name: z.string().min(1).max(200),
  goal: GoalSchema,
  advertiserId: z.string()
});
export type CreateCampaignRequest = z.infer<typeof CreateCampaignRequestSchema>;

export const SetGoalRequestSchema = z.object({
  type: GoalTypeEnum.optional(),
  target: z.number().positive().optional(),
  budget: z.number().positive().optional(),
  deadline: z.date().optional()
});
export type SetGoalRequest = z.infer<typeof SetGoalRequestSchema>;

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CampaignResponse {
  campaign: GoalDrivenCampaign;
}

export interface ActionsResponse {
  actions: AgentAction[];
  total: number;
}

export interface LogsResponse {
  logs: LogEntry[];
  total: number;
}

// Agent decision context
export interface AgentDecisionContext {
  campaignId: string;
  currentMetrics: CurrentStatus;
  historicalActions: AgentAction[];
  budgetRemaining: number;
  timeRemaining?: number;
  competitorData?: object;
}

// Agent action types
export type AgentActionType =
  | 'audience_research'
  | 'audience_targeting'
  | 'creative_generation'
  | 'creative_testing'
  | 'bid_optimization'
  | 'budget_reallocation'
  | 'channel_activation'
  | 'channel_deactivation'
  | 'pause_campaign'
  | 'resume_campaign'
  | 'goal_adjustment'
  | 'report_generation';

// Express extended request
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    advertiserId?: string;
    role: string;
  };
}
