/**
 * Predictive Engine Service
 * Integration with REZ Intelligence predictive services
 *
 * Features:
 * - Churn prediction
 * - Customer Lifetime Value (LTV)
 * - Revisit prediction
 * - Conversion prediction
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

// Churn Prediction
export interface ChurnPrediction {
  userId: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100
  factors: Array<{
    name: string;
    impact: number; // positive = increases churn risk
    description: string;
  }>;
  recommendedActions: Array<{
    type: 'offer' | 'message' | 'feature';
    priority: number;
    description: string;
  }>;
  predictedAt: string;
}

// LTV Prediction
export interface LTVPrediction {
  userId: string;
  predictedLTV: {
    '30d': number;
    '90d': number;
    '365d': number;
  };
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  avgOrderValue: number;
  orderFrequency: number; // orders per month
  confidence: number; // 0-1
  predictedAt: string;
}

// Revisit Prediction
export interface RevisitPrediction {
  userId: string;
  daysUntilRevisit: number;
  optimalEngagementWindow: {
    start: string; // ISO time
    end: string;
  };
  confidence: number;
  factors: string[];
}

// Conversion Prediction
export interface ConversionPrediction {
  userId: string;
  stage: 'awareness' | 'consideration' | 'intent' | 'purchase_ready';
  probability: number; // 0-100
  barriers: Array<{
    type: 'price' | 'trust' | 'convenience' | 'awareness';
    description: string;
    impact: number;
  }>;
  incentives: Array<{
    type: 'discount' | 'cashback' | 'free_delivery' | 'loyalty_points';
    value: number;
    expectedLift: number; // % increase in conversion
  }>;
  predictedAt: string;
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const PREDICTIVE_URL = process.env.EXPO_PUBLIC_PREDICTIVE_URL || 'https://REZ-predictive-engine.onrender.com';
const PREDICTIVE_API_VERSION = 'v1';
const PREDICTIVE_BASE_URL = `${PREDICTIVE_URL}/api/${PREDICTIVE_API_VERSION}`;

// Cache for predictions (5 minutes)
const PREDICTION_CACHE_TTL = 5 * 60 * 1000;
const predictionCache = new Map<string, { data: unknown; expiry: number }>();

function getCached<T>(key: string): T | null {
  const cached = predictionCache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T;
  }
  predictionCache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  predictionCache.set(key, { data, expiry: Date.now() + PREDICTION_CACHE_TTL });
}

// ============================================================================
// CHURN PREDICTION
// ============================================================================

/**
 * Get churn prediction for a user
 */
export async function getChurnPrediction(
  userId: string
): Promise<ApiResponse<ChurnPrediction>> {
  const cacheKey = `churn:${userId}`;
  const cached = getCached<ChurnPrediction>(cacheKey);
  if (cached) return { success: true, data: cached };

  try {
    const response = await apiClient.get(`${PREDICTIVE_BASE_URL}/predict/churn/${userId}`);
    if (response.success && response.data) {
      setCache(cacheKey, response.data);
    }
    // @ts-ignore
    return response;
  } catch (error) {
    logger.error('[Predictive] Failed to get churn prediction:', error);
    return { success: false, error: 'Failed to get churn prediction' };
  }
}

/**
 * Get churn risk label from score
 */
export function getChurnRiskLabel(score: number): ChurnPrediction['risk'] {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

// ============================================================================
// LTV PREDICTION
// ============================================================================

/**
 * Get LTV prediction for a user
 */
export async function getLTVPrediction(
  userId: string
): Promise<ApiResponse<LTVPrediction>> {
  const cacheKey = `ltv:${userId}`;
  const cached = getCached<LTVPrediction>(cacheKey);
  if (cached) return { success: true, data: cached };

  try {
    const response = await apiClient.get(`${PREDICTIVE_BASE_URL}/predict/ltv/${userId}`);
    if (response.success && response.data) {
      setCache(cacheKey, response.data);
    }
    // @ts-ignore
    return response;
  } catch (error) {
    logger.error('[Predictive] Failed to get LTV prediction:', error);
    return { success: false, error: 'Failed to get LTV prediction' };
  }
}

/**
 * Get tier color
 */
export function getTierColor(tier: LTVPrediction['tier']): string {
  const colors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
  };
  return colors[tier] || colors.bronze;
}

// ============================================================================
// REVISIT PREDICTION
// ============================================================================

/**
 * Get revisit prediction for a user
 */
export async function getRevisitPrediction(
  userId: string
): Promise<ApiResponse<RevisitPrediction>> {
  const cacheKey = `revisit:${userId}`;
  const cached = getCached<RevisitPrediction>(cacheKey);
  if (cached) return { success: true, data: cached };

  try {
    const response = await apiClient.get(`${PREDICTIVE_BASE_URL}/predict/revisit/${userId}`);
    if (response.success && response.data) {
      setCache(cacheKey, response.data);
    }
    // @ts-ignore
    return response;
  } catch (error) {
    logger.error('[Predictive] Failed to get revisit prediction:', error);
    return { success: false, error: 'Failed to get revisit prediction' };
  }
}

// ============================================================================
// CONVERSION PREDICTION
// ============================================================================

/**
 * Get conversion prediction for a user
 */
export async function getConversionPrediction(
  userId: string,
  context?: { storeId?: string; category?: string }
): Promise<ApiResponse<ConversionPrediction>> {
  const cacheKey = `conversion:${userId}:${context?.storeId || 'unknown'}`;
  const cached = getCached<ConversionPrediction>(cacheKey);
  if (cached) return { success: true, data: cached };

  try {
    const response = await apiClient.post(`${PREDICTIVE_BASE_URL}/predict/conversion/${userId}`, {
      context,
    });
    if (response.success && response.data) {
      setCache(cacheKey, response.data);
    }
    // @ts-ignore
    return response;
  } catch (error) {
    logger.error('[Predictive] Failed to get conversion prediction:', error);
    return { success: false, error: 'Failed to get conversion prediction' };
  }
}

/**
 * Get conversion stage label
 */
export function getConversionStageLabel(stage: ConversionPrediction['stage']): string {
  const labels = {
    awareness: 'Just browsing',
    consideration: 'Comparing options',
    intent: 'Ready to buy',
    purchase_ready: 'Complete checkout',
  };
  return labels[stage] || stage;
}

// ============================================================================
// BATCH PREDICTIONS
// ============================================================================

/**
 * Get all predictions for a user
 */
export async function getAllPredictions(
  userId: string
): Promise<ApiResponse<{
  churn: ChurnPrediction;
  ltv: LTVPrediction;
  revisit: RevisitPrediction;
}>> {
  try {
    const [churnRes, ltvRes, revisitRes] = await Promise.all([
      getChurnPrediction(userId),
      getLTVPrediction(userId),
      getRevisitPrediction(userId),
    ]);

    if (churnRes.success && ltvRes.success && revisitRes.success) {
      return {
        success: true,
        data: {
          churn: churnRes.data!,
          ltv: ltvRes.data!,
          revisit: revisitRes.data!,
        },
      };
    }

    return { success: false, error: 'Some predictions failed' };
  } catch (error) {
    logger.error('[Predictive] Failed to get all predictions:', error);
    return { success: false, error: 'Failed to get predictions' };
  }
}

// ============================================================================
// USER SEGMENTATION
// ============================================================================

export interface UserSegment {
  userId: string;
  segments: string[]; // e.g., ['high_value', 'at_risk', 'frequent_buyer']
  engagement: 'inactive' | 'casual' | 'regular' | 'power_user';
  preferences: {
    dealsSeeker: boolean;
    qualitySeeker: boolean;
    convenienceSeeker: boolean;
  };
}

/**
 * Get user segment profile
 */
export async function getUserSegment(
  userId: string
): Promise<ApiResponse<UserSegment>> {
  try {
    const response = await apiClient.get(`${PREDICTIVE_BASE_URL}/segment/${userId}`);
    // @ts-ignore
    return response;
  } catch (error) {
    logger.error('[Predictive] Failed to get user segment:', error);
    return { success: false, error: 'Failed to get user segment' };
  }
}
