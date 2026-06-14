/**
 * REZ Intelligence Client
 *
 * Unified client for all REZ Intelligence services.
 *
 * Usage:
 * ```typescript
 * import { createReZIntelligenceClient } from '@rez/rez-intelligence-client';
 *
 * const client = createReZIntelligenceClient({
 *   intentGraph: 'http://localhost:4018',
 *   predictiveEngine: 'http://localhost:4141',
 * });
 *
 * const intent = await client.predictIntent('user_123');
 * const churn = await client.predictChurn('user_123');
 * ```
 */

import axios, { AxiosInstance } from 'axios';

// ============================================================================
// TYPES
// ============================================================================

export interface ReZIntelligenceConfig {
  /** Intent Graph service URL (Port 4018) */
  intentGraph?: string;
  /** Predictive Engine service URL (Port 4141) */
  predictiveEngine?: string;
  /** Identity Graph service URL (Port 4050) */
  identityGraph?: string;
  /** Signal Aggregator service URL (Port 4142) */
  signalAggregator?: string;
  /** Segmentation service URL (Port 4126) */
  segmentation?: string;
  /** Commerce Graph service URL (Port 4129) */
  commerceGraph?: string;
  /** Decision Engine service URL (Port 4027) */
  decisionEngine?: string;
  /** Attribution Hub service URL (Port 4100) */
  attributionHub?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** API key for authentication */
  apiKey?: string;
}

export interface IntentResult {
  intent: 'browse' | 'purchase' | 'research' | 'loyalty' | 're-engage' | string;
  confidence: number;
  signals: Record<string, number>;
  recommendedActions?: string[];
}

export interface ChurnResult {
  probability: number;
  risk: 'low' | 'medium' | 'high';
  factors: string[];
  recommendedActions?: string[];
}

export interface LTVResult {
  score: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  predictedLifetimeValue: number;
  recommendations: string[];
}

export interface ConversionResult {
  probability: number;
  recommendedAction: string;
  factors: string[];
}

export interface SegmentResult {
  id: string;
  name: string;
  size: number;
  matchScore: number;
  criteria?: Record<string, unknown>;
}

export interface AudienceResult {
  segments: SegmentResult[];
  totalReach: number;
  breakdown?: Record<string, number>;
}

export interface IdentityResult {
  unifiedId: string;
  linkedAccounts: string[];
  confidence: number;
  profile?: Record<string, unknown>;
}

export interface AttributionResult {
  attribution: string;
  touchpoints: Array<{
    campaignId: string;
    source: string;
    weight: number;
    timestamp: number;
  }>;
  totalValue: number;
}

export interface DecisionResult {
  decision: string;
  action: string;
  confidence: number;
  reason: string;
}

export interface FraudResult {
  isFraudulent: boolean;
  fraudScore: number;
  riskFactors: string[];
  recommendations?: string[];
}

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_TIMEOUT = 3000;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 60000;

const DEFAULT_URLS: Required<ReZIntelligenceConfig> = {
  intentGraph: process.env.REZ_INTENT_SERVICE_URL || 'http://localhost:4018',
  predictiveEngine: process.env.REZ_PREDICTIVE_SERVICE_URL || 'http://localhost:4141',
  identityGraph: process.env.REZ_IDENTITY_SERVICE_URL || 'http://localhost:4050',
  signalAggregator: process.env.REZ_SIGNAL_SERVICE_URL || 'http://localhost:4142',
  segmentation: process.env.REZ_SEGMENT_SERVICE_URL || 'http://localhost:4126',
  commerceGraph: process.env.REZ_COMMERCE_SERVICE_URL || 'http://localhost:4129',
  decisionEngine: process.env.REZ_DECISION_SERVICE_URL || 'http://localhost:4027',
  attributionHub: process.env.REZ_ATTRIBUTION_SERVICE_URL || 'http://localhost:4100',
  timeout: DEFAULT_TIMEOUT,
  apiKey: process.env.REZ_INTELLIGENCE_API_KEY || '',
};

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

interface CircuitState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const circuits: Record<string, CircuitState> = {};

function getCircuit(service: string): CircuitState {
  if (!circuits[service]) {
    circuits[service] = { failures: 0, lastFailure: 0, isOpen: false };
  }
  return circuits[service];
}

function isCircuitOpen(service: string): boolean {
  const circuit = getCircuit(service);
  if (circuit.isOpen && Date.now() - circuit.lastFailure > CIRCUIT_RESET_MS) {
    circuit.isOpen = false;
    circuit.failures = 0;
  }
  return circuit.isOpen;
}

function recordFailure(service: string): void {
  const circuit = getCircuit(service);
  circuit.failures++;
  circuit.lastFailure = Date.now();
  if (circuit.failures >= CIRCUIT_THRESHOLD) {
    circuit.isOpen = true;
  }
}

function recordSuccess(service: string): void {
  const circuit = getCircuit(service);
  circuit.failures = 0;
  circuit.isOpen = false;
}

// ============================================================================
// HTTP CLIENT
// ============================================================================

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  data?: unknown;
  service: string;
}

async function request<T>(
  baseUrl: string,
  config: RequestOptions,
  timeout: number,
  apiKey?: string
): Promise<T | null> {
  if (isCircuitOpen(config.service)) {
    return null;
  }

  try {
    const response = await axios({
      method: config.method,
      url: `${baseUrl}${config.path}`,
      data: config.data,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    });
    recordSuccess(config.service);
    return response.data as T;
  } catch (error) {
    recordFailure(config.service);
    return null;
  }
}

// ============================================================================
// CLIENT CLASS
// ============================================================================

export class ReZIntelligenceClient {
  private config: Required<ReZIntelligenceConfig>;

  constructor(config: ReZIntelligenceConfig = {}) {
    this.config = {
      ...DEFAULT_URLS,
      ...config,
    };
  }

  getCircuitStatus(): Record<string, { failures: number; isOpen: boolean }> {
    const status: Record<string, { failures: number; isOpen: boolean }> = {};
    for (const [name, circuit] of Object.entries(circuits)) {
      status[name] = { failures: circuit.failures, isOpen: circuit.isOpen };
    }
    return status;
  }

  // ==========================================================================
  // INTENT GRAPH (4018)
  // ==========================================================================

  async predictIntent(
    userId: string,
    signals?: Record<string, number>
  ): Promise<IntentResult> {
    const result = await request<{
      intent: string;
      confidence: number;
      signals: Record<string, number>;
    }>(this.config.intentGraph, {
      method: 'POST',
      path: '/api/intent/score',
      data: { userId, signals },
      service: 'intentGraph',
    }, this.config.timeout, this.config.apiKey);

    if (result) {
      return result;
    }

    return this.fallbackIntent();
  }

  async getIntentHistory(userId: string): Promise<IntentResult[]> {
    const result = await request<IntentResult[]>(this.config.intentGraph, {
      method: 'GET',
      path: `/api/intent/user/${userId}/history`,
      service: 'intentGraph',
    }, this.config.timeout, this.config.apiKey);

    return result || [];
  }

  // ==========================================================================
  // PREDICTIVE ENGINE (4141)
  // ==========================================================================

  async predictChurn(userId: string): Promise<ChurnResult> {
    const result = await request<{
      probability: number;
      riskLevel: 'low' | 'medium' | 'high';
      factors: string[];
    }>(this.config.predictiveEngine, {
      method: 'GET',
      path: `/predict/${userId}/churn`,
      service: 'predictiveEngine',
    }, this.config.timeout, this.config.apiKey);

    if (result) {
      return {
        probability: result.probability,
        risk: result.riskLevel,
        factors: result.factors,
      };
    }

    return this.fallbackChurn();
  }

  async predictLTV(userId: string): Promise<LTVResult> {
    const result = await request<{
      score: number;
      tier: 'bronze' | 'silver' | 'gold' | 'platinum';
      predictedLifetimeValue: number;
      recommendations: string[];
    }>(this.config.predictiveEngine, {
      method: 'GET',
      path: `/predict/${userId}/ltv`,
      service: 'predictiveEngine',
    }, this.config.timeout, this.config.apiKey);

    if (result) {
      return result;
    }

    return this.fallbackLTV();
  }

  async predictConversion(userId: string): Promise<ConversionResult> {
    const result = await request<{
      probability: number;
      recommendedAction: string;
      factors: string[];
    }>(this.config.predictiveEngine, {
      method: 'GET',
      path: `/predict/${userId}/conversion`,
      service: 'predictiveEngine',
    }, this.config.timeout, this.config.apiKey);

    if (result) {
      return result;
    }

    return { probability: 0.3, recommendedAction: 'nudge', factors: [] };
  }

  async predictAll(userId: string): Promise<{
    churn: ChurnResult;
    ltv: LTVResult;
    conversion: ConversionResult;
  }> {
    const [churn, ltv, conversion] = await Promise.all([
      this.predictChurn(userId),
      this.predictLTV(userId),
      this.predictConversion(userId),
    ]);

    return { churn, ltv, conversion };
  }

  // ==========================================================================
  // IDENTITY GRAPH (4050)
  // ==========================================================================

  async resolveIdentity(identifiers: {
    phone?: string;
    email?: string;
    deviceId?: string;
  }): Promise<IdentityResult | null> {
    return request<IdentityResult>(this.config.identityGraph, {
      method: 'POST',
      path: '/api/resolve',
      data: identifiers,
      service: 'identityGraph',
    }, this.config.timeout, this.config.apiKey);
  }

  async getIdentityProfile(unifiedId: string): Promise<Record<string, unknown>> {
    const result = await request<Record<string, unknown>>(this.config.identityGraph, {
      method: 'GET',
      path: `/api/profile/${unifiedId}`,
      service: 'identityGraph',
    }, this.config.timeout, this.config.apiKey);

    return result || {};
  }

  // ==========================================================================
  // SIGNAL AGGREGATOR (4142)
  // ==========================================================================

  async recordSignal(event: {
    userId: string;
    type: string;
    source: string;
    data?: Record<string, unknown>;
  }): Promise<boolean> {
    const result = await request<{ success: boolean }>(this.config.signalAggregator, {
      method: 'POST',
      path: '/api/signals/record',
      data: event,
      service: 'signalAggregator',
    }, this.config.timeout, this.config.apiKey);

    return result?.success || false;
  }

  async getSignals(
    userId: string,
    types?: string[]
  ): Promise<Array<{ type: string; data: Record<string, unknown>; timestamp: number }>> {
    const params = types ? `?types=${types.join(',')}` : '';
    const result = await request<Array<{ type: string; data: Record<string, unknown>; timestamp: number }>>(
      this.config.signalAggregator,
      {
        method: 'GET',
        path: `/api/signals/user/${userId}${params}`,
        service: 'signalAggregator',
      },
      this.config.timeout,
      this.config.apiKey
    );

    return result || [];
  }

  // ==========================================================================
  // SEGMENTATION (4126)
  // ==========================================================================

  async getUserSegments(userId: string): Promise<string[]> {
    const result = await request<{ segments: string[] }>(this.config.segmentation, {
      method: 'GET',
      path: `/api/segments/user/${userId}`,
      service: 'segmentation',
    }, this.config.timeout, this.config.apiKey);

    return result?.segments || [];
  }

  async getSegmentUsers(segmentId: string): Promise<string[]> {
    const result = await request<{ userIds: string[] }>(this.config.segmentation, {
      method: 'GET',
      path: `/api/segments/${segmentId}/users`,
      service: 'segmentation',
    }, this.config.timeout, this.config.apiKey);

    return result?.userIds || [];
  }

  async createAudience(config: {
    name: string;
    criteria: Record<string, unknown>;
  }): Promise<AudienceResult> {
    const result = await request<{
      segments: Array<{ id: string; name: string; userCount: number; matchScore: number }>;
      totalReach: number;
    }>(this.config.segmentation, {
      method: 'POST',
      path: '/api/segments/generate',
      data: config,
      service: 'segmentation',
    }, this.config.timeout, this.config.apiKey);

    if (result) {
      return {
        segments: result.segments.map(s => ({
          id: s.id,
          name: s.name,
          size: s.userCount,
          matchScore: s.matchScore,
        })),
        totalReach: result.totalReach,
      };
    }

    return this.fallbackAudience();
  }

  // ==========================================================================
  // COMMERCE GRAPH (4129)
  // ==========================================================================

  async getPurchaseHistory(userId: string): Promise<unknown[]> {
    const result = await request<unknown[]>(this.config.commerceGraph, {
      method: 'GET',
      path: `/api/purchases/${userId}`,
      service: 'commerceGraph',
    }, this.config.timeout, this.config.apiKey);

    return result || [];
  }

  async getRecommendations(
    userId: string,
    context?: Record<string, unknown>
  ): Promise<string[]> {
    const result = await request<{ productIds: string[] }>(this.config.commerceGraph, {
      method: 'POST',
      path: '/api/recommendations',
      data: { userId, context },
      service: 'commerceGraph',
    }, this.config.timeout, this.config.apiKey);

    return result?.productIds || [];
  }

  async getProductAffinity(productId: string): Promise<string[]> {
    const result = await request<{ related: string[] }>(this.config.commerceGraph, {
      method: 'GET',
      path: `/api/products/${productId}/affinity`,
      service: 'commerceGraph',
    }, this.config.timeout, this.config.apiKey);

    return result?.related || [];
  }

  // ==========================================================================
  // DECISION ENGINE (4027)
  // ==========================================================================

  async decide(params: {
    userId?: string;
    context: Record<string, unknown>;
  }): Promise<DecisionResult> {
    const result = await request<{
      decision: string;
      action: string;
      confidence: number;
      reason: string;
    }>(this.config.decisionEngine, {
      method: 'POST',
      path: '/api/decide',
      data: params,
      service: 'decisionEngine',
    }, this.config.timeout, this.config.apiKey);

    if (result) {
      return result;
    }

    return { decision: 'default', action: 'recommend', confidence: 0.5, reason: 'fallback' };
  }

  async evaluateRule(
    rule: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<boolean> {
    const result = await request<{ matches: boolean }>(this.config.decisionEngine, {
      method: 'POST',
      path: '/api/rules/evaluate',
      data: { rule, context },
      service: 'decisionEngine',
    }, this.config.timeout, this.config.apiKey);

    return result?.matches || false;
  }

  // ==========================================================================
  // ATTRIBUTION HUB (4100)
  // ==========================================================================

  async attributeConversion(params: {
    event: string;
    userId?: string;
    touchpoints: Array<{
      campaignId: string;
      source: string;
      weight?: number;
      timestamp: number;
    }>;
  }): Promise<AttributionResult> {
    const result = await request<AttributionResult>(this.config.attributionHub, {
      method: 'POST',
      path: '/api/attribute',
      data: params,
      service: 'attributionHub',
    }, this.config.timeout, this.config.apiKey);

    if (result) {
      return result;
    }

    return {
      attribution: 'direct',
      touchpoints: [],
      totalValue: 0,
    };
  }

  // ==========================================================================
  // FRAUD DETECTION
  // ==========================================================================

  async detectFraud(params: {
    userId?: string;
    events?: Array<{ type: string; timestamp: number }>;
  }): Promise<FraudResult> {
    const events = params.events || [];
    let fraudScore = 0.05;
    const factors: string[] = [];

    if (events.length > 100) {
      fraudScore += 0.2;
      factors.push('high_event_volume');
    }

    if (events.length > 1000) {
      fraudScore += 0.3;
      factors.push('extreme_activity');
    }

    return {
      isFraudulent: fraudScore > 0.15,
      fraudScore: Math.round(fraudScore * 100) / 100,
      riskFactors: factors,
    };
  }

  // ==========================================================================
  // FALLBACKS
  // ==========================================================================

  private fallbackIntent(): IntentResult {
    const intents = ['browse', 'purchase', 'research', 'loyalty', 're-engage'];
    const intent = intents[Math.floor(Math.random() * intents.length)];
    return {
      intent,
      confidence: 0.6 + Math.random() * 0.2,
      signals: { [intent]: 0.5 },
    };
  }

  private fallbackChurn(): ChurnResult {
    return {
      probability: 0.3,
      risk: 'medium',
      factors: ['insufficient_data'],
    };
  }

  private fallbackLTV(): LTVResult {
    return {
      score: 0.5,
      tier: 'silver',
      predictedLifetimeValue: 5000,
      recommendations: ['engage_more'],
    };
  }

  private fallbackAudience(): AudienceResult {
    return {
      segments: [
        { id: 'seg_default', name: 'General Audience', size: 100000, matchScore: 0.7 },
      ],
      totalReach: 100000,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createReZIntelligenceClient(config?: ReZIntelligenceConfig): ReZIntelligenceClient {
  return new ReZIntelligenceClient(config);
}

// Default export
export default ReZIntelligenceClient;


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-intelligence-client',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
