/**
 * AdBazaar Dashboard Client
 *
 * React hooks and components to connect to Hojai AI Gateway.
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface IntentPrediction {
  intent: string;
  confidence: number;
  recommendations: string[];
  nextBestAction: string;
}

export interface BehaviorPrediction {
  churnRisk: 'low' | 'medium' | 'high';
  ltvScore: number;
  purchaseProbability: number;
  nextPurchaseCategory?: string;
}

export interface AudienceSegment {
  id: string;
  name: string;
  size: number;
  matchScore: number;
}

export interface CampaignPrediction {
  expectedImpressions: number;
  expectedClicks: number;
  expectedConversions: number;
  expectedCPM: number;
  expectedCPC: number;
  expectedROAS: number;
  confidence: number;
}

// ============================================================================
// API CLIENT
// ============================================================================

const HOJAI_API = process.env.NEXT_PUBLIC_HOJAI_URL || 'http://localhost:4560';

class HojaiClient {
  private apiKey: string;

  constructor(apiKey: string = '') {
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${HOJAI_API}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'X-API-Key': this.apiKey }),
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error || 'API Error');
    }

    return json.data;
  }

  async predictIntent(userId: string, context?: Record<string, unknown>): Promise<IntentPrediction> {
    return this.request('/api/intent/predict', { userId, context });
  }

  async predictBehavior(userId: string): Promise<BehaviorPrediction> {
    return this.request('/api/behavior/predict', { userId });
  }

  async getAudienceSegments(criteria?: Record<string, unknown>): Promise<{
    segments: AudienceSegment[];
    totalReach: number;
  }> {
    return this.request('/api/audience/segments', { criteria });
  }

  async predictCampaign(budget: number, targeting?: Record<string, unknown>): Promise<CampaignPrediction> {
    return this.request('/api/campaign/predict', { budget, targeting });
  }

  async optimizeTargeting(objective: string, budget: number): Promise<{
    targetingParams: Record<string, unknown>;
    estimatedReach: number;
    expectedCTR: number;
    suggestedBid: number;
  }> {
    return this.request('/api/targeting/optimize', { campaignObjective: objective, budget });
  }

  async generateCreative(product: string, objective: string): Promise<{
    headlines: string[];
    descriptions: string[];
    ctas: string[];
  }> {
    return this.request('/api/creative/generate', { product, objective });
  }

  async scoreLeads(leads: Array<{ id: string; data?: Record<string, unknown> }>): Promise<Array<{
    id: string;
    score: number;
    quality: 'hot' | 'warm' | 'cold';
    reasons: string[];
  }>> {
    return this.request('/api/leads/score', { leads });
  }

  async detectFraud(userId: string, events: Array<{ type: string; timestamp: number }>): Promise<{
    isFraudulent: boolean;
    fraudScore: number;
    riskFactors: string[];
  }> {
    return this.request('/api/fraud/detect', { userId, events });
  }

  async nextBestAction(userId: string, context?: Record<string, unknown>): Promise<{
    action: string;
    confidence: number;
    expectedOutcome: string;
  }> {
    return this.request('/api/action/next-best', { userId, context });
  }
}

export const hojaiClient = new HojaiClient();

// ============================================================================
// REACT HOOKS
// ============================================================================

export function useIntentPrediction(userId: string | null) {
  const [data, setData] = useState<IntentPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    hojaiClient.predictIntent(userId)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  return { data, loading, error, refetch: () => userId && hojaiClient.predictIntent(userId).then(setData) };
}

export function useBehaviorPrediction(userId: string | null) {
  const [data, setData] = useState<BehaviorPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    hojaiClient.predictBehavior(userId)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  return { data, loading, error };
}

export function useAudienceSegments(criteria?: Record<string, unknown>) {
  const [data, setData] = useState<{ segments: AudienceSegment[]; totalReach: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    hojaiClient.getAudienceSegments(criteria)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [JSON.stringify(criteria)]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useCampaignPrediction(budget: number, targeting?: Record<string, unknown>) {
  const [data, setData] = useState<CampaignPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    hojaiClient.predictCampaign(budget, targeting)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [budget, JSON.stringify(targeting)]);

  return { data, loading, error };
}

export function useTargetingOptimization(objective: string, budget: number) {
  const [data, setData] = useState<{
    targetingParams: Record<string, unknown>;
    estimatedReach: number;
    expectedCTR: number;
    suggestedBid: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    hojaiClient.optimizeTargeting(objective, budget)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [objective, budget]);

  return { data, loading, error };
}

export function useCreativeGeneration(product: string, objective: string) {
  const [data, setData] = useState<{
    headlines: string[];
    descriptions: string[];
    ctas: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    hojaiClient.generateCreative(product, objective)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [product, objective]);

  return { data, loading, error };
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

export function IntentBadge({ intent, confidence }: { intent: string; confidence: number }) {
  const colors: Record<string, string> = {
    browse: 'bg-blue-100 text-blue-800',
    purchase: 'bg-green-100 text-green-800',
    research: 'bg-yellow-100 text-yellow-800',
    loyalty: 'bg-purple-100 text-purple-800',
    're-engage': 'bg-orange-100 text-orange-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-sm ${colors[intent] || 'bg-gray-100 text-gray-800'}`}>
      {intent} ({Math.round(confidence * 100)}%)
    </span>
  );
}

export function ChurnRiskBadge({ risk }: { risk: 'low' | 'medium' | 'high' }) {
  const colors: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-sm ${colors[risk]}`}>
      Churn Risk: {risk}
    </span>
  );
}

export function LeadQualityBadge({ quality }: { quality: 'hot' | 'warm' | 'cold' }) {
  const colors: Record<string, string> = {
    hot: 'bg-red-100 text-red-800',
    warm: 'bg-orange-100 text-orange-800',
    cold: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-sm ${colors[quality]}`}>
      {quality.toUpperCase()}
    </span>
  );
}

export function CampaignMetrics({ prediction }: { prediction: CampaignPrediction }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 bg-gray-50 rounded">
        <div className="text-sm text-gray-600">Expected ROAS</div>
        <div className="text-2xl font-bold">{prediction.expectedROAS.toFixed(2)}x</div>
      </div>
      <div className="p-4 bg-gray-50 rounded">
        <div className="text-sm text-gray-600">Conversions</div>
        <div className="text-2xl font-bold">{prediction.expectedConversions.toLocaleString()}</div>
      </div>
      <div className="p-4 bg-gray-50 rounded">
        <div className="text-sm text-gray-600">Confidence</div>
        <div className="text-2xl font-bold">{Math.round(prediction.confidence * 100)}%</div>
      </div>
    </div>
  );
}

export function SegmentCard({ segment }: { segment: AudienceSegment }) {
  return (
    <div className="p-4 bg-white border rounded shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{segment.name}</h3>
          <p className="text-sm text-gray-600">{segment.size.toLocaleString()} users</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{Math.round(segment.matchScore * 100)}%</div>
          <div className="text-xs text-gray-500">match</div>
        </div>
      </div>
    </div>
  );
}

export default hojaiClient;
