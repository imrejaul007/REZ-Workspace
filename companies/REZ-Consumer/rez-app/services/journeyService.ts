/**
 * JOURNEY SERVICE
 * Integration with REZ-journey-service (REZ-Media)
 *
 * Service: REZ-journey-service
 * Port: 4019
 * URL: https://REZ-journey-service.onrender.com
 *
 * Features:
 * - Lifecycle automation
 * - Behavioral triggers
 * - Multi-channel campaigns (push, email, SMS, WhatsApp)
 * - Journey analytics
 * - Personalization at scale
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export type JourneyChannel = 'push' | 'email' | 'sms' | 'whatsapp' | 'in_app';
export type JourneyStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type TriggerType =
  | 'user_signup'
  | 'first_order'
  | 'order_completed'
  | 'cart_abandoned'
  | 'wishlist_item_left'
  | 'review_submitted'
  | 'refund_requested'
  | 'subscription_renewed'
  | 'subscription_cancelled'
  | 'payment_failed'
  | 'birthday'
  | 'inactive_days'
  | 'custom';

export interface JourneyStep {
  stepId: string;
  action: {
    type: 'send_message' | 'wait' | 'condition' | 'webhook' | 'update_segment' | 'delay';
    config: Record<string, unknown>;
  };
  nextStepId?: string;
}

export interface Journey {
  id: string;
  name: string;
  description: string;
  status: JourneyStatus;
  trigger: {
    type: TriggerType;
    conditions?: Record<string, unknown>;
  };
  steps: JourneyStep[];
  channel: JourneyChannel;
  createdAt: string;
  updatedAt: string;
  stats: {
    enrolled: number;
    completed: number;
    conversionRate: number;
    avgTimeToComplete: number;
  };
}

export interface JourneyEnrollment {
  userId: string;
  journeyId: string;
  enrolledAt: string;
  currentStep: number;
  completedAt?: string;
  exitReason?: string;
}

export interface JourneyEvent {
  userId: string;
  journeyId: string;
  event: TriggerType;
  properties: Record<string, unknown>;
  timestamp: string;
}

export interface JourneyAnalytics {
  journeyId: string;
  period: { start: string; end: string };
  enrollmentStats: {
    totalEnrolled: number;
    currentlyActive: number;
    completed: number;
    exited: number;
  };
  conversionFunnel: Array<{
    step: number;
    stepName: string;
    entered: number;
    exited: number;
    conversionRate: number;
  }>;
  channelPerformance: Record<JourneyChannel, {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    conversionRate: number;
  }>;
  revenue: {
    attributed: number;
    avgOrderValue: number;
  };
}

// Campaign Types
export interface Campaign {
  id: string;
  name: string;
  type: 'promotional' | 'transactional' | 'behavioral' | 'seasonal';
  status: JourneyStatus;
  channels: JourneyChannel[];
  targetSegment: string;
  schedule?: {
    startDate: string;
    endDate?: string;
    recurring?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string;
    };
  };
  content: {
    subject?: string;
    title: string;
    body: string;
    imageUrl?: string;
    cta?: { label: string; url: string };
  };
  budget?: {
    total: number;
    spent: number;
    maxCpm?: number;
  };
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    revenue: number;
  };
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const JOURNEY_SERVICE_URL = process.env.EXPO_PUBLIC_JOURNEY_SERVICE_URL || 'https://REZ-journey-service.onrender.com';
const JOURNEY_API_VERSION = 'v1';
const JOURNEY_BASE_URL = `${JOURNEY_SERVICE_URL}/api/${JOURNEY_API_VERSION}`;

// ============================================================================
// API METHODS - JOURNEYS
// ============================================================================

/**
 * Get available journeys for a user
 */
export async function getUserJourneys(userId: string): Promise<ApiResponse<Journey[]>> {
  try {
    const response = await apiClient.get(`${JOURNEY_BASE_URL}/user/${userId}/journeys`);
    return response;
  } catch (error) {
    logger.error('[JourneyService] Failed to get user journeys:', error);
    return { success: false, error: 'Failed to load journeys' };
  }
}

/**
 * Enroll user in a journey
 */
export async function enrollInJourney(
  userId: string,
  journeyId: string
): Promise<ApiResponse<JourneyEnrollment>> {
  try {
    const response = await apiClient.post(`${JOURNEY_BASE_URL}/enroll`, {
      userId,
      journeyId,
    });
    return response;
  } catch (error) {
    logger.error('[JourneyService] Failed to enroll in journey:', error);
    return { success: false, error: 'Failed to enroll' };
  }
}

/**
 * Exit user from a journey
 */
export async function exitJourney(
  userId: string,
  journeyId: string,
  reason?: string
): Promise<ApiResponse<{ exited: boolean }>> {
  try {
    const response = await apiClient.post(`${JOURNEY_BASE_URL}/exit`, {
      userId,
      journeyId,
      reason,
    });
    return response;
  } catch (error) {
    logger.error('[JourneyService] Failed to exit journey:', error);
    return { success: false, error: 'Failed to exit journey' };
  }
}

/**
 * Record a journey event (trigger)
 */
export async function recordJourneyEvent(event: JourneyEvent): Promise<ApiResponse<{ processed: boolean }>> {
  try {
    // Fire and forget with short timeout
    const response = await apiClient.post(`${JOURNEY_BASE_URL}/event`, event, { timeout: 5000 });
    return response;
  } catch (error) {
    logger.debug('[JourneyService] Event recording failed:', error);
    return { success: true, data: { processed: false } };
  }
}

/**
 * Get journey analytics
 */
export async function getJourneyAnalytics(
  journeyId: string,
  period?: { start: string; end: string }
): Promise<ApiResponse<JourneyAnalytics>> {
  try {
    const params = period ? `?start=${period.start}&end=${period.end}` : '';
    const response = await apiClient.get(`${JOURNEY_BASE_URL}/analytics/${journeyId}${params}`);
    return response;
  } catch (error) {
    logger.error('[JourneyService] Failed to get analytics:', error);
    return { success: false, error: 'Failed to load analytics' };
  }
}

// ============================================================================
// API METHODS - CAMPAIGNS
// ============================================================================

/**
 * Get active campaigns for user
 */
export async function getActiveCampaigns(
  userId: string
): Promise<ApiResponse<Campaign[]>> {
  try {
    const response = await apiClient.get(`${JOURNEY_BASE_URL}/campaigns/active?userId=${userId}`);
    return response;
  } catch (error) {
    logger.error('[JourneyService] Failed to get campaigns:', error);
    return { success: false, error: 'Failed to load campaigns' };
  }
}

/**
 * Get campaign details
 */
export async function getCampaignDetails(
  campaignId: string
): Promise<ApiResponse<Campaign>> {
  try {
    const response = await apiClient.get(`${JOURNEY_BASE_URL}/campaigns/${campaignId}`);
    return response;
  } catch (error) {
    logger.error('[JourneyService] Failed to get campaign:', error);
    return { success: false, error: 'Failed to load campaign' };
  }
}

/**
 * Track campaign interaction
 */
export async function trackCampaignInteraction(
  campaignId: string,
  userId: string,
  interaction: 'received' | 'opened' | 'clicked' | 'converted'
): Promise<ApiResponse<{ tracked: boolean }>> {
  try {
    const response = await apiClient.post(`${JOURNEY_BASE_URL}/campaigns/${campaignId}/track`, {
      userId,
      interaction,
      timestamp: new Date().toISOString(),
    });
    return response;
  } catch (error) {
    logger.debug('[JourneyService] Campaign tracking failed:', error);
    return { success: true, data: { tracked: false } };
  }
}

/**
 * Opt out of marketing communications
 */
export async function optOutMarketing(
  userId: string,
  channels?: JourneyChannel[]
): Promise<ApiResponse<{ optedOut: boolean }>> {
  try {
    const response = await apiClient.post(`${JOURNEY_BASE_URL}/opt-out`, {
      userId,
      channels: channels || ['push', 'email', 'sms', 'whatsapp'],
    });
    return response;
  } catch (error) {
    logger.error('[JourneyService] Opt-out failed:', error);
    return { success: false, error: 'Failed to update preferences' };
  }
}

// ============================================================================
// EVENT TRIGGERS (for lifecycle automation)
// ============================================================================

/**
 * Trigger on user signup
 */
export async function triggerOnSignup(userId: string, data: {
  email: string;
  source?: string;
}): Promise<void> {
  await recordJourneyEvent({
    userId,
    journeyId: 'signup',
    event: 'user_signup',
    properties: data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Trigger on first order
 */
export async function triggerOnFirstOrder(userId: string, data: {
  orderId: string;
  total: number;
  storeId: string;
}): Promise<void> {
  await recordJourneyEvent({
    userId,
    journeyId: 'first_order',
    event: 'first_order',
    properties: data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Trigger on order completed
 */
export async function triggerOnOrderCompleted(userId: string, data: {
  orderId: string;
  total: number;
  items: string[];
  storeId: string;
}): Promise<void> {
  await recordJourneyEvent({
    userId,
    journeyId: 'order_completed',
    event: 'order_completed',
    properties: data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Trigger on cart abandoned
 */
export async function triggerOnCartAbandoned(userId: string, data: {
  cartId: string;
  items: string[];
  total: number;
  recoveryUrl?: string;
}): Promise<void> {
  await recordJourneyEvent({
    userId,
    journeyId: 'cart_abandoned',
    event: 'cart_abandoned',
    properties: data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Trigger on refund requested
 */
export async function triggerOnRefundRequested(userId: string, data: {
  orderId: string;
  reason: string;
  amount: number;
}): Promise<void> {
  await recordJourneyEvent({
    userId,
    journeyId: 'refund_requested',
    event: 'refund_requested',
    properties: data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Trigger on payment failed
 */
export async function triggerOnPaymentFailed(userId: string, data: {
  orderId: string;
  reason: string;
  amount: number;
}): Promise<void> {
  await recordJourneyEvent({
    userId,
    journeyId: 'payment_failed',
    event: 'payment_failed',
    properties: data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Trigger on subscription renewed
 */
export async function triggerOnSubscriptionRenewed(userId: string, data: {
  subscriptionId: string;
  plan: string;
  amount: number;
  nextBillingDate: string;
}): Promise<void> {
  await recordJourneyEvent({
    userId,
    journeyId: 'subscription_renewed',
    event: 'subscription_renewed',
    properties: data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Trigger on subscription cancelled
 */
export async function triggerOnSubscriptionCancelled(userId: string, data: {
  subscriptionId: string;
  reason: string;
  plan: string;
}): Promise<void> {
  await recordJourneyEvent({
    userId,
    journeyId: 'subscription_cancelled',
    event: 'subscription_cancelled',
    properties: data,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export const journeyService = {
  // Journeys
  getUserJourneys,
  enrollInJourney,
  exitJourney,
  recordJourneyEvent,
  getJourneyAnalytics,

  // Campaigns
  getActiveCampaigns,
  getCampaignDetails,
  trackCampaignInteraction,
  optOutMarketing,

  // Event triggers
  triggerOnSignup,
  triggerOnFirstOrder,
  triggerOnOrderCompleted,
  triggerOnCartAbandoned,
  triggerOnRefundRequested,
  triggerOnPaymentFailed,
  triggerOnSubscriptionRenewed,
  triggerOnSubscriptionCancelled,
};

export default journeyService;
