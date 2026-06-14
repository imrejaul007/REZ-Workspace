/**
 * FEEDBACK SERVICE
 * Integration with REZ-feedback-service (REZ-Media)
 *
 * Service: REZ-feedback-service
 * Port: 4066
 * URL: https://REZ-feedback-service.onrender.com
 *
 * Features:
 * - Multi-channel feedback collection
 * - Post-purchase surveys
 * - NPS/CSAT tracking
 * - Product ratings & reviews
 * - Service feedback
 * - Feedback analytics
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export type FeedbackType =
  | 'nps'
  | 'csat'
  | 'product_review'
  | 'service_review'
  | 'delivery_review'
  | 'support_feedback'
  | 'general';

export type FeedbackChannel = 'in_app' | 'email' | 'sms' | 'whatsapp';

export interface FeedbackSubmission {
  id: string;
  type: FeedbackType;
  customerId: string;
  rating?: number; // 1-5 for CSAT, 0-10 for NPS
  npsScore?: number; // 0-10 NPS score
  title?: string;
  comment?: string;
  tags?: string[];
  metadata?: {
    orderId?: string;
    productId?: string;
    storeId?: string;
    deliveryId?: string;
    agentId?: string;
    source?: string;
  };
  submittedAt: string;
}

export interface FeedbackConfig {
  type: FeedbackType;
  title: string;
  description: string;
  questions: FeedbackQuestion[];
  ratingConfig?: {
    min: number;
    max: number;
    labels?: { [key: number]: string };
  };
  requiresComment?: boolean;
  thankYouMessage?: string;
}

export interface FeedbackQuestion {
  id: string;
  type: 'rating' | 'text' | 'multiple_choice' | 'emoji';
  question: string;
  required: boolean;
  options?: string[]; // for multiple_choice
  emojiScale?: string[]; // e.g., ['😞', '😐', '😊', '😍']
}

export interface ProductReview extends FeedbackSubmission {
  metadata: {
    productId: string;
    orderId?: string;
    isVerifiedPurchase: boolean;
    photos?: string[];
    helpfulVotes?: number;
  };
  pros?: string[];
  cons?: string[];
  recommendation?: 'yes' | 'no' | 'neutral';
}

export interface ServiceReview extends FeedbackSubmission {
  metadata: {
    storeId: string;
    orderId?: string;
    serviceType: string;
    staffName?: string;
    staffId?: string;
  };
  aspects: Array<{
    name: string;
    rating: number;
  }>;
}

export interface FeedbackAnalytics {
  period: { start: string; end: string };
  overall: {
    totalResponses: number;
    avgRating: number;
    responseRate: number;
  };
  nps: {
    score: number;
    promoters: number;
    passives: number;
    detractors: number;
    trend: number; // vs previous period
  };
  csat: {
    score: number; // percentage satisfied
    satisfied: number;
    neutral: number;
    unsatisfied: number;
  };
  byChannel: Record<FeedbackChannel, {
    responses: number;
    avgRating: number;
    responseRate: number;
  }>;
  byProduct: Array<{
    productId: string;
    avgRating: number;
    reviewCount: number;
  }>;
  byStore: Array<{
    storeId: string;
    avgRating: number;
    reviewCount: number;
  }>;
}

export interface FeedbackCampaign {
  id: string;
  name: string;
  type: FeedbackType;
  status: 'scheduled' | 'active' | 'completed';
  trigger: 'immediate' | 'delayed' | 'manual';
  delay?: number; // hours after event
  targetSegment: {
    type: 'all_customers' | 'recent_buyers' | 'specific_products' | 'specific_stores';
    criteria?: Record<string, unknown>;
  };
  config: FeedbackConfig;
  stats: {
    sent: number;
    responded: number;
    responseRate: number;
    avgRating: number;
  };
  schedule?: {
    startDate: string;
    endDate?: string;
  };
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const FEEDBACK_SERVICE_URL = process.env.EXPO_PUBLIC_FEEDBACK_SERVICE_URL || 'https://REZ-feedback-service.onrender.com';
const FEEDBACK_API_VERSION = 'v1';
const FEEDBACK_BASE_URL = `${FEEDBACK_SERVICE_URL}/api/${FEEDBACK_API_VERSION}`;

// ============================================================================
// API METHODS - SUBMISSIONS
// ============================================================================

/**
 * Submit feedback
 */
export async function submitFeedback(
  feedback: Omit<FeedbackSubmission, 'id' | 'submittedAt'>
): Promise<ApiResponse<FeedbackSubmission>> {
  try {
    const response = await apiClient.post(`${FEEDBACK_BASE_URL}/submit`, {
      ...feedback,
      submittedAt: new Date().toISOString(),
    });
    return response;
  } catch (error) {
    logger.error('[FeedbackService] Failed to submit feedback:', error);
    return { success: false, error: 'Failed to submit feedback' };
  }
}

/**
 * Submit NPS feedback
 */
export async function submitNPS(
  customerId: string,
  npsScore: number,
  comment?: string,
  metadata?: Record<string, unknown>
): Promise<ApiResponse<{ submitted: boolean; promoterStatus: 'promoter' | 'passive' | 'detractor' }>> {
  try {
    const response = await apiClient.post(`${FEEDBACK_BASE_URL}/nps`, {
      customerId,
      npsScore,
      comment,
      metadata,
    });
    return response;
  } catch (error) {
    logger.error('[FeedbackService] Failed to submit NPS:', error);
    return { success: false, error: 'Failed to submit NPS' };
  }
}

/**
 * Submit product review
 */
export async function submitProductReview(
  review: Omit<ProductReview, 'id' | 'submittedAt' | 'type'>
): Promise<ApiResponse<ProductReview>> {
  try {
    const response = await apiClient.post(`${FEEDBACK_BASE_URL}/product`, {
      ...review,
      type: 'product_review',
      submittedAt: new Date().toISOString(),
    });
    return response;
  } catch (error) {
    logger.error('[FeedbackService] Failed to submit product review:', error);
    return { success: false, error: 'Failed to submit review' };
  }
}

/**
 * Submit service review
 */
export async function submitServiceReview(
  review: Omit<ServiceReview, 'id' | 'submittedAt' | 'type'>
): Promise<ApiResponse<ServiceReview>> {
  try {
    const response = await apiClient.post(`${FEEDBACK_BASE_URL}/service`, {
      ...review,
      type: 'service_review',
      submittedAt: new Date().toISOString(),
    });
    return response;
  } catch (error) {
    logger.error('[FeedbackService] Failed to submit service review:', error);
    return { success: false, error: 'Failed to submit review' };
  }
}

/**
 * Submit CSAT rating
 */
export async function submitCSAT(
  customerId: string,
  rating: number, // 1-5
  type: 'product' | 'service' | 'delivery' | 'support',
  metadata?: Record<string, unknown>
): Promise<ApiResponse<{ submitted: boolean }>> {
  try {
    const response = await apiClient.post(`${FEEDBACK_BASE_URL}/csat`, {
      customerId,
      rating,
      type,
      metadata,
    });
    return response;
  } catch (error) {
    logger.error('[FeedbackService] Failed to submit CSAT:', error);
    return { success: false, error: 'Failed to submit rating' };
  }
}

// ============================================================================
// API METHODS - RETRIEVAL
// ============================================================================

/**
 * Get feedback config for a specific type
 */
export async function getFeedbackConfig(
  type: FeedbackType
): Promise<ApiResponse<FeedbackConfig>> {
  try {
    const response = await apiClient.get(`${FEEDBACK_BASE_URL}/config/${type}`);
    return response;
  } catch (error) {
    logger.error('[FeedbackService] Failed to get feedback config:', error);
    return { success: false, error: 'Failed to load feedback form' };
  }
}

/**
 * Get user's feedback history
 */
export async function getFeedbackHistory(
  customerId: string,
  options?: {
    type?: FeedbackType;
    limit?: number;
    offset?: number;
  }
): Promise<ApiResponse<FeedbackSubmission[]>> {
  try {
    const params = new URLSearchParams();
    if (options?.type) params.append('type', options.type);
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));

    const response = await apiClient.get(`${FEEDBACK_BASE_URL}/history/${customerId}?${params}`);
    return response;
  } catch (error) {
    logger.error('[FeedbackService] Failed to get feedback history:', error);
    return { success: false, error: 'Failed to load feedback history' };
  }
}

/**
 * Get product reviews
 */
export async function getProductReviews(
  productId: string,
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
  }
): Promise<ApiResponse<{
  reviews: ProductReview[];
  stats: {
    avgRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  };
}>> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));
    if (options?.sortBy) params.append('sortBy', options.sortBy);

    const response = await apiClient.get(`${FEEDBACK_BASE_URL}/product/${productId}/reviews?${params}`);
    return response;
  } catch (error) {
    logger.error('[FeedbackService] Failed to get product reviews:', error);
    return { success: false, error: 'Failed to load reviews' };
  }
}

/**
 * Get store reviews
 */
export async function getStoreReviews(
  storeId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<ApiResponse<{
  reviews: ServiceReview[];
  stats: {
    avgRating: number;
    totalReviews: number;
    aspectRatings: Record<string, number>;
  };
}>> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));

    const response = await apiClient.get(`${FEEDBACK_BASE_URL}/store/${storeId}/reviews?${params}`);
    return response;
  } catch (error) {
    logger.error('[FeedbackService] Failed to get store reviews:', error);
    return { success: false, error: 'Failed to load reviews' };
  }
}

// ============================================================================
// API METHODS - ANALYTICS & CAMPAIGNS
// ============================================================================

/**
 * Get feedback analytics
 */
export async function getFeedbackAnalytics(
  period?: { start: string; end: string }
): Promise<ApiResponse<FeedbackAnalytics>> {
  try {
    const params = period ? `?start=${period.start}&end=${period.end}` : '';
    const response = await apiClient.get(`${FEEDBACK_BASE_URL}/analytics${params}`);
    return response;
  } catch (error) {
    logger.error('[FeedbackService] Failed to get analytics:', error);
    return { success: false, error: 'Failed to load analytics' };
  }
}

/**
 * Get user's NPS history
 */
export async function getNPSHistory(
  customerId: string
): Promise<ApiResponse<Array<{
  score: number;
  promoterStatus: 'promoter' | 'passive' | 'detractor';
  comment?: string;
  submittedAt: string;
}>>> {
  try {
    const response = await apiClient.get(`${FEEDBACK_BASE_URL}/nps/history/${customerId}`);
    return response;
  } catch (error) {
    logger.error('[FeedbackService] Failed to get NPS history:', error);
    return { success: false, error: 'Failed to load NPS history' };
  }
}

/**
 * Get active feedback campaigns
 */
export async function getFeedbackCampaigns(
  status?: 'scheduled' | 'active' | 'completed'
): Promise<ApiResponse<FeedbackCampaign[]>> {
  try {
    const params = status ? `?status=${status}` : '';
    const response = await apiClient.get(`${FEEDBACK_BASE_URL}/campaigns${params}`);
    return response;
  } catch (error) {
    logger.error('[FeedbackService] Failed to get campaigns:', error);
    return { success: false, error: 'Failed to load campaigns' };
  }
}

/**
 * Mark review as helpful
 */
export async function markReviewHelpful(
  reviewId: string,
  customerId: string
): Promise<ApiResponse<{ marked: boolean }>> {
  try {
    const response = await apiClient.post(`${FEEDBACK_BASE_URL}/review/${reviewId}/helpful`, {
      customerId,
    });
    return response;
  } catch (error) {
    logger.error('[FeedbackService] Failed to mark review helpful:', error);
    return { success: false, error: 'Failed to mark as helpful' };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate NPS score from array of scores
 */
export function calculateNPS(scores: number[]): {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
} {
  const promoters = scores.filter(s => s >= 9).length;
  const passives = scores.filter(s => s >= 7 && s <= 8).length;
  const detractors = scores.filter(s => s <= 6).length;
  const total = scores.length || 1;

  return {
    score: Math.round(((promoters - detractors) / total) * 100),
    promoters: Math.round((promoters / total) * 100),
    passives: Math.round((passives / total) * 100),
    detractors: Math.round((detractors / total) * 100),
  };
}

/**
 * Get emoji for rating
 */
export function getRatingEmoji(rating: number, maxRating = 5): string {
  const percentage = rating / maxRating;
  if (percentage >= 0.9) return '😍';
  if (percentage >= 0.7) return '😊';
  if (percentage >= 0.5) return '😐';
  if (percentage >= 0.3) return '😕';
  return '😞';
}

/**
 * Get promoter status label
 */
export function getPromoterStatus(score: number): 'promoter' | 'passive' | 'detractor' {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

/**
 * Check if feedback is overdue (for re-prompt)
 */
export function isFeedbackOverdue(lastFeedback: string, maxDays = 7): boolean {
  const daysSince = (Date.now() - new Date(lastFeedback).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > maxDays;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const feedbackService = {
  // Submissions
  submitFeedback,
  submitNPS,
  submitProductReview,
  submitServiceReview,
  submitCSAT,

  // Retrieval
  getFeedbackConfig,
  getFeedbackHistory,
  getProductReviews,
  getStoreReviews,

  // Analytics
  getFeedbackAnalytics,
  getNPSHistory,
  getFeedbackCampaigns,
  markReviewHelpful,

  // Helpers
  calculateNPS,
  getRatingEmoji,
  getPromoterStatus,
  isFeedbackOverdue,
};

export default feedbackService;
