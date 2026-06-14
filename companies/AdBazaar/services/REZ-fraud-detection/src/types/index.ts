import { z } from 'zod';

// Validation Schemas
export const FraudCheckRequestSchema = z.object({
  eventType: z.enum(['impression', 'click', 'view', 'conversion']),
  sessionId: z.string().uuid(),
  userId: z.string().optional(),
  ipAddress: z.string(),
  userAgent: z.string(),
  timestamp: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
  adId: z.string().optional(),
  campaignId: z.string().optional(),
  creativeId: z.string().optional(),
});

export const BulkFraudCheckSchema = z.object({
  events: z.array(FraudCheckRequestSchema).min(1).max(100),
});

// Type Definitions
export type EventType = 'impression' | 'click' | 'view' | 'conversion';

export interface FraudCheckResult {
  sessionId: string;
  timestamp: Date;
  overall: FraudAssessment;
  botDetection: BotDetectionResult;
  clickFraud: ClickFraudResult;
  viewability: ViewabilityResult;
  ipFraud: IPFraudResult;
  recommendations: string[];
}

export interface FraudAssessment {
  isFraudulent: boolean;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
}

export interface BotDetectionResult {
  isBot: boolean;
  confidence: number;
  signals: BotSignal[];
  score: number;
}

export interface BotSignal {
  type: BotSignalType;
  value: string | number | boolean;
  weight: number;
  description: string;
}

export type BotSignalType =
  | 'user_agent_match'
  | 'suspicious_pattern'
  | 'no_javascript'
  | 'rapid_fire_behavior'
  | 'missing_headers'
  | 'datacenter_ip'
  | 'known_bot_ip';

export interface ClickFraudResult {
  isClickFraud: boolean;
  confidence: number;
  patterns: ClickFraudPattern[];
  score: number;
}

export interface ClickFraudPattern {
  type: ClickFraudPatternType;
  detected: boolean;
  value: number;
  threshold: number;
  description: string;
}

export type ClickFraudPatternType =
  | 'rapid_clicks'
  | 'coordinated_clicks'
  | 'click_to_impression_ratio'
  | 'duplicate_clicks'
  | 'non_human_pattern';

export interface ViewabilityResult {
  score: number;
  factors: ViewabilityFactor[];
  meetsThreshold: boolean;
}

export interface ViewabilityFactor {
  type: ViewabilityFactorType;
  value: number;
  description: string;
}

export type ViewabilityFactorType =
  | 'time_in_view'
  | 'viewport_percentage'
  | 'ad_position'
  | 'background_vs_foreground';

export interface IPFraudResult {
  isSuspiciousIP: boolean;
  confidence: number;
  signals: IPSignal[];
  score: number;
  country?: string;
  city?: string;
  isp?: string;
  isDatacenter: boolean;
  isVPN: boolean;
  isProxy: boolean;
}

export interface IPSignal {
  type: IPSignalType;
  detected: boolean;
  value: string | number | boolean;
  description: string;
}

export type IPSignalType =
  | 'geo_mismatch'
  | 'datacenter_ip'
  | 'vpn_detected'
  | 'proxy_detected'
  | 'tor_exit_node'
  | 'recent_abuse'
  | 'high_volume_source';

export interface FraudEvent {
  id: string;
  sessionId: string;
  eventType: EventType;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  userId?: string;
  adId?: string;
  campaignId?: string;
  creativeId?: string;
  metadata?: Record<string, unknown>;
}

export interface SessionData {
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  ipAddresses: Set<string>;
  events: FraudEvent[];
  clickCount: number;
  impressionCount: number;
  userAgent: string;
  userId?: string;
}

export interface BulkFraudCheckResult {
  total: number;
  fraudulent: number;
  suspicious: number;
  clean: number;
  results: FraudCheckResult[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Session storage type
export interface FraudCheckCache {
  sessionId: string;
  events: FraudEvent[];
  lastCheck: Date;
  riskScore: number;
}

// Type exports for Zod inference
export type FraudCheckRequest = z.infer<typeof FraudCheckRequestSchema>;
export type BulkFraudCheckRequest = z.infer<typeof BulkFraudCheckSchema>;
