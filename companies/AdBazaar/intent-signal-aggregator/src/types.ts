// Intent Signal Types

export type EventType = 'search' | 'view' | 'wishlist' | 'cart_add' | 'checkout_start' | 'fulfilled';
export type SignalCategory = 'DINING' | 'TRAVEL' | 'RETAIL' | 'HEALTHCARE' | 'GENERAL';

export interface IntentSignal {
  signalId: string;
  source: string;
  sourceService: string;
  userId: string;
  eventType: EventType;
  category: SignalCategory;
  intentKey: string;
  intentQuery?: string;
  metadata: Record<string, unknown>;
  confidence: number;
  enriched: boolean;
  timestamp: Date;
}

export interface SignalSource {
  name: string;
  service: string;
  category: SignalCategory;
  mappings: {
    eventType: string;
    intentKey: string;
  }[];
}

export interface SignalStats {
  totalSignals: number;
  signalsBySource: Record<string, number>;
  signalsByCategory: Record<string, number>;
  signalsByEventType: Record<string, number>;
  averageConfidence: number;
  enrichedSignals: number;
  lastUpdated: Date;
}

export interface EnrichmentContext {
  userId: string;
  profile?: UserProfile;
  history?: SignalHistory;
  affinities?: UserAffinities;
}

export interface UserProfile {
  userId: string;
  age?: number;
  location?: string;
  preferences?: string[];
  segments?: string[];
}

export interface SignalHistory {
  recentSignals: IntentSignal[];
  totalCount: number;
  lastSignalTime?: Date;
}

export interface UserAffinities {
  categories: Record<SignalCategory, number>;
  brands: Record<string, number>;
  priceRange: { min: number; max: number };
}

export interface NormalizedSignal {
  signalId: string;
  source: string;
  sourceService: string;
  userId: string;
  eventType: EventType;
  category: SignalCategory;
  intentKey: string;
  intentQuery?: string;
  metadata: Record<string, unknown>;
  confidence: number;
  enriched: boolean;
  timestamp: Date;
  enrichedAt?: Date;
  enrichmentData?: {
    userProfile?: UserProfile;
    relatedSignals?: string[];
    intentClusters?: string[];
    predictedNextActions?: string[];
  };
}

export interface BatchIngestRequest {
  signals: RawSignal[];
}

export interface RawSignal {
  source: string;
  sourceService: string;
  userId: string;
  eventType: string;
  category: string;
  intentKey: string;
  intentQuery?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface IngestResponse {
  success: boolean;
  signalId?: string;
  error?: string;
  duplicate?: boolean;
}

export interface BatchIngestResponse {
  success: boolean;
  processed: number;
  duplicates: number;
  failed: number;
  signalIds: string[];
  errors?: { index: number; error: string }[];
}

export interface SignalRoutingTarget {
  service: string;
  endpoint: string;
  priority: number;
  metadata?: Record<string, unknown>;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Config types
export interface AppConfig {
  port: number;
  mongoUri: string;
  redisUrl: string;
  jwtSecret: string;
  internalServiceKey: string;
  signalDedupWindowMs: number;
  nodeEnv: string;
  logLevel: string;
}

// Express types
export interface AuthenticatedRequest {
  userId?: string;
  isInternalService?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      isInternalService?: boolean;
    }
  }
}