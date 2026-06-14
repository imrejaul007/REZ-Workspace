import { z } from 'zod';

// Computation types
export enum ComputationType {
  FEDERATED = 'federated',
  MPC = 'mpc',
  DIFFERENTIAL_PRIVACY = 'differential_privacy',
  SECURE_AGGREGATION = 'secure_aggregation',
}

export enum ComputationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// Federated Learning types
export interface FederatedRound {
  roundNumber: number;
  participants: string[];
  gradients: Record<string, number[]>;
  aggregatedGradient: number[] | null;
  timestamp: Date;
}

export interface FederatedConfig {
  rounds: number;
  minParticipants: number;
  aggregationStrategy: 'fedavg' | 'fedmed' | 'fedopt';
  privacyBudget: number;
  clipNorm: number;
}

export interface FederatedResult {
  computationId: string;
  rounds: FederatedRound[];
  finalModel: number[] | null;
  aggregationMethod: string;
  privacyMechanism: string;
  completedAt: Date;
}

// MPC types
export interface MPCShare {
  partyId: string;
  shareValue: string; // Encrypted share value
  index: number;
}

export interface MPCConfig {
  parties: string[];
  threshold: number;
  operation: 'addition' | 'multiplication' | 'comparison' | 'dot_product';
  modulus: string;
}

export interface MPCResult {
  computationId: string;
  shares: MPCShare[];
  reconstructedValue: string | null;
  operation: string;
  threshold: number;
  completedAt: Date;
}

// Differential Privacy types
export interface PrivacyParams {
  epsilon: number;
  delta: number;
  sensitivity: number;
  mechanism: 'laplace' | 'gaussian' | 'exponential';
}

export interface DifferentialPrivacyConfig {
  privacyParams: PrivacyParams;
  queryType: 'count' | 'sum' | 'mean' | 'variance' | 'histogram';
  datasetSize: number;
  noiseMultiplier: number;
}

export interface DifferentialPrivacyResult {
  computationId: string;
  noisyResult: number | Record<string, number>;
  trueResult: number | Record<string, number> | null;
  privacyParams: PrivacyParams;
  privacyBudgetUsed: number;
  compositionCount: number;
  completedAt: Date;
}

// Secure Aggregation types
export interface SecureAggregationConfig {
  participants: string[];
  threshold: number;
  secureSum: boolean;
  secureMean: boolean;
  clippingRange: number;
}

export interface SecureAggregationResult {
  computationId: string;
  aggregatedValue: number;
  participantCount: number;
  droppedParticipants: string[];
  secureProtocol: string;
  completedAt: Date;
}

// Audit types
export interface AuditEntry {
  computationId: string;
  action: AuditAction;
  actor: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

export enum AuditAction {
  COMPUTATION_CREATED = 'computation_created',
  COMPUTATION_STARTED = 'computation_started',
  COMPUTATION_COMPLETED = 'computation_completed',
  COMPUTATION_FAILED = 'computation_failed',
  ROUND_COMPLETED = 'round_completed',
  PARTICIPANT_JOINED = 'participant_joined',
  PARTICIPANT_LEFT = 'participant_left',
  VALIDATION_PASSED = 'validation_passed',
  VALIDATION_FAILED = 'validation_failed',
  PRIVACY_BUDGET_UPDATED = 'privacy_budget_updated',
}

// Zod schemas for validation
export const FederatedInputSchema = z.object({
  computationId: z.string().optional(),
  modelId: z.string(),
  participants: z.array(z.string()).min(2),
  config: z.object({
    rounds: z.number().int().positive().default(10),
    minParticipants: z.number().int().positive().default(2),
    aggregationStrategy: z.enum(['fedavg', 'fedmed', 'fedopt']).default('fedavg'),
    privacyBudget: z.number().positive().default(1.0),
    clipNorm: z.number().positive().default(1.0),
  }).optional(),
  initialModel: z.array(z.number()).optional(),
});

export const MPCInputSchema = z.object({
  computationId: z.string().optional(),
  operation: z.enum(['addition', 'multiplication', 'comparison', 'dot_product']),
  parties: z.array(z.string()).min(2),
  inputs: z.record(z.string(), z.string()), // partyId -> encrypted input
  config: z.object({
    threshold: z.number().int().positive().default(2),
    modulus: z.string().default('prime'),
  }).optional(),
});

export const DifferentialPrivacyInputSchema = z.object({
  computationId: z.string().optional(),
  query: z.object({
    type: z.enum(['count', 'sum', 'mean', 'variance', 'histogram']),
    column: z.string().optional(),
    filters: z.record(z.string(), z.unknown()).optional(),
  }),
  privacyParams: z.object({
    epsilon: z.number().positive().default(1.0),
    delta: z.number().positive().optional().default(1e-5),
    sensitivity: z.number().positive().default(1.0),
    mechanism: z.enum(['laplace', 'gaussian', 'exponential']).default('laplace'),
  }),
  datasetSize: z.number().int().positive().default(1000),
});

export const SecureAggregationInputSchema = z.object({
  computationId: z.string().optional(),
  participants: z.array(z.string()).min(2),
  values: z.record(z.string(), z.number()), // participantId -> value
  config: z.object({
    secureSum: z.boolean().default(true),
    secureMean: z.boolean().default(false),
    clippingRange: z.number().positive().default(10.0),
    threshold: z.number().int().positive().default(2),
  }).optional(),
});

export const ValidationInputSchema = z.object({
  computationId: z.string(),
  privacyGuarantees: z.object({
    epsilon: z.number().positive(),
    delta: z.number().positive().optional(),
    mechanism: z.string(),
  }),
  participants: z.array(z.string()).optional(),
});

// Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ComputationResponse {
  id: string;
  type: ComputationType;
  status: ComputationStatus;
  result?: unknown;
  privacyParams?: PrivacyParams;
  createdAt: Date;
  completedAt?: Date;
}