// Merchant AI Employee UI - Type Definitions
import { z } from 'zod';

// ============== AI Agent Configuration ==============

export enum AgentType {
  SUPPORT = 'support',
  SALES = 'sales',
  CONVERSATIONAL = 'conversational',
  ANALYTICS = 'analytics',
  ESCALATION = 'escalation',
}

export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRAINING = 'training',
  ERROR = 'error',
}

export const AIGentConfigSchema = z.object({
  merchantId: z.string().min(1),
  agentType: z.nativeEnum(AgentType),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  status: z.nativeEnum(AgentStatus).default(AgentStatus.INACTIVE),
  personality: z.object({
    tone: z.enum(['formal', 'casual', 'friendly', 'professional']),
    responseLength: z.enum(['short', 'medium', 'long']),
    language: z.string().default('en'),
  }),
  capabilities: z.object({
    maxConcurrentConversations: z.number().min(1).max(100).default(10),
    autoEscalation: z.boolean().default(true),
    sentimentAnalysis: z.boolean().default(true),
    multiTurnMemory: z.boolean().default(true),
    productRecommendations: z.boolean().default(false),
    dynamicPricing: z.boolean().default(false),
  }),
  operatingHours: z.object({
    enabled: z.boolean().default(true),
    timezone: z.string().default('Asia/Kolkata'),
    schedule: z.record(
      z.object({
        enabled: z.boolean(),
        startTime: z.string(),
        endTime: z.string(),
      })
    ).optional(),
  }),
  escalationSettings: z.object({
    autoEscalateOnSentiment: z.boolean().default(true),
    sentimentThreshold: z.number().min(-1).max(1).default(-0.5),
    maxBotHandoffs: z.number().min(0).max(10).default(3),
    handoffDelaySeconds: z.number().min(0).max(300).default(30),
  }),
});

export type AIGentConfig = z.infer<typeof AIGentConfigSchema>;

// ============== Training Data ==============

export enum TrainingDataType {
  FAQ = 'faq',
  PRODUCT = 'product',
  POLICY = 'policy',
  CONVERSATION = 'conversation',
  CUSTOM = 'custom',
}

export const TrainingDataSchema = z.object({
  merchantId: z.string().min(1),
  type: z.nativeEnum(TrainingDataType),
  question: z.string().min(1).max(1000),
  answer: z.string().min(1).max(5000),
  intent: z.string().optional(),
  entities: z.array(z.string()).optional(),
  metadata: z.object({
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    confidence: z.number().min(0).max(1).optional(),
    source: z.string().optional(),
  }).optional(),
});

export type TrainingData = z.infer<typeof TrainingDataSchema>;

// ============== Performance Metrics ==============

export interface AgentMetrics {
  agentId: string;
  merchantId: string;
  period: {
    start: Date;
    end: Date;
  };
  conversations: {
    total: number;
    completed: number;
    escalated: number;
    abandoned: number;
  };
  responseMetrics: {
    avgResponseTimeMs: number;
    avgResolutionTimeMs: number;
    firstResponseTimeMs: number;
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    avgScore: number;
  };
  customerSatisfaction: {
    csat: number;
    nps: number;
    responses: number;
  };
  topicDistribution: {
    topic: string;
    count: number;
    percentage: number;
  }[];
  hourlyVolume: {
    hour: number;
    count: number;
  }[];
}

export interface TrainingJob {
  id: string;
  merchantId: string;
  agentId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  samplesProcessed: number;
  totalSamples: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

// ============== API Response Types ==============

export const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }).optional(),
  meta: z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    total: z.number().optional(),
  }).optional(),
});

export interface APIResponse<T> {
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
  };
}

// ============== Employee Context ==============

export const EmployeeContextSchema = z.object({
  id: z.string(),
  merchantId: z.string(),
  employeeId: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'agent', 'viewer']),
  permissions: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export interface EmployeeContext {
  id: string;
  merchantId: string;
  employeeId: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'agent' | 'viewer';
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeSession {
  employeeId: string;
  merchantId: string;
  permissions: string[];
  expiresAt: Date;
}
