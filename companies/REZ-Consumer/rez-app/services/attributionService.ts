/**
 * ATTRIBUTION SERVICE
 * Integration with REZ-attribution-hub (REZ-Media)
 *
 * Service: REZ-attribution-hub
 * Port: 4068
 * URL: https://REZ-attribution-hub.onrender.com
 *
 * Features:
 * - Multi-touch attribution
 * - Conversion tracking
 * - Campaign performance
 * - Channel analytics
 * - Attribution models (first-touch, last-touch, linear, etc.)
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export type AttributionModel =
  | 'first_touch'
  | 'last_touch'
  | 'linear'
  | 'time_decay'
  | 'position_based'
  | 'data_driven';

export type ConversionType =
  | 'purchase'
  | 'signup'
  | 'add_to_cart'
  | 'wishlist'
  | 'booking'
  | 'subscription'
  | 'engagement';

export type Channel =
  | 'organic_search'
  | 'paid_search'
  | 'social'
  | 'email'
  | 'referral'
  | 'direct'
  | 'affiliate'
  | 'display'
  | 'video'
  | 'push_notification'
  | 'deeplink'
  | 'qr_code';

export interface AttributionEvent {
  id: string;
  userId: string;
  sessionId: string;
  type: 'impression' | 'click' | 'conversion';
  channel: Channel;
  source?: string; // utm_source
  medium?: string; // utm_medium
  campaign?: string; // utm_campaign
  content?: string; // utm_content
  keyword?: string; // paid search keyword
  adId?: string;
  creativeId?: string;
  placement?: string;
  device?: 'mobile' | 'tablet' | 'desktop';
  referrer?: string;
  landingPage?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Conversion {
  id: string;
  userId: string;
  type: ConversionType;
  value: number; // monetary value
  currency?: string;
  orderId?: string;
  channel: Channel;
  attributedChannel: Channel;
  touchpoints: AttributionTouchpoint[];
  model: AttributionModel;
  conversionTime: string;
  metadata?: Record<string, unknown>;
}

export interface AttributionTouchpoint {
  channel: Channel;
  source?: string;
  medium?: string;
  campaign?: string;
  interactionTime: string;
  weight?: number; // for linear/time_decay models
}

export interface AttributionReport {
  period: { start: string; end: string };
  model: AttributionModel;
  summary: {
    totalConversions: number;
    totalValue: number;
    avgOrderValue: number;
    conversionRate: number;
  };
  byChannel: Record<Channel, {
    conversions: number;
    value: number;
    contribution: number; // percentage
    interactions: number;
    touchpoints: number;
  }>;
  byCampaign: Array<{
    campaignId: string;
    campaignName: string;
    channel: Channel;
    conversions: number;
    value: number;
    roi: number;
  }>;
  bySource: Array<{
    source: string;
    conversions: number;
    value: number;
    topChannels: Channel[];
  }>;
  trends: Array<{
    date: string;
    conversions: number;
    value: number;
  }>;
}

export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  status: 'active' | 'paused' | 'completed';
  period: { start: string; end: string };
  budget?: {
    total: number;
    spent: number;
    remaining: number;
  };
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    cpa: number;
    roas: number;
  };
  channelBreakdown: Record<Channel, {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
  attribution: {
    model: AttributionModel;
    firstTouch: { channel: Channel; conversions: number };
    lastTouch: { channel: Channel; conversions: number };
    linear: Array<{ channel: Channel; weight: number }>;
  };
}

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const ATTRIBUTION_SERVICE_URL = process.env.EXPO_PUBLIC_ATTRIBUTION_SERVICE_URL || 'https://REZ-attribution-hub.onrender.com';
const ATTRIBUTION_API_VERSION = 'v1';
const ATTRIBUTION_BASE_URL = `${ATTRIBUTION_SERVICE_URL}/api/${ATTRIBUTION_API_VERSION}`;

// ============================================================================
// API METHODS - TRACKING
// ============================================================================

/**
 * Track an attribution event
 */
export async function trackEvent(
  event: Omit<AttributionEvent, 'id' | 'timestamp'>
): Promise<ApiResponse<{ tracked: boolean }>> {
  try {
    // Fire and forget with short timeout
    const response = await apiClient.post(`${ATTRIBUTION_BASE_URL}/track`, {
      ...event,
      timestamp: new Date().toISOString(),
    }, { timeout: 5000 });
    return response;
  } catch (error) {
    logger.debug('[AttributionService] Event tracking failed:', error);
    return { success: true, data: { tracked: false } };
  }
}

/**
 * Track conversion
 */
export async function trackConversion(
  conversion: Omit<Conversion, 'id' | 'touchpoints' | 'model' | 'attributedChannel'>
): Promise<ApiResponse<Conversion>> {
  try {
    const response = await apiClient.post(`${ATTRIBUTION_BASE_URL}/conversion`, conversion);
    return response;
  } catch (error) {
    logger.error('[AttributionService] Failed to track conversion:', error);
    return { success: false, error: 'Failed to track conversion' };
  }
}

/**
 * Track click (for ad URLs)
 */
export async function trackClick(
  clickData: {
    userId?: string;
    sessionId: string;
    channel: Channel;
    source?: string;
    medium?: string;
    campaign?: string;
    adId?: string;
    creativeId?: string;
    url: string;
    device?: 'mobile' | 'tablet' | 'desktop';
  }
): Promise<ApiResponse<{ clickId: string; redirectUrl: string }>> {
  try {
    const response = await apiClient.post(`${ATTRIBUTION_BASE_URL}/click`, clickData);
    return response;
  } catch (error) {
    logger.error('[AttributionService] Failed to track click:', error);
    return { success: false, error: 'Failed to track click' };
  }
}

/**
 * Track impression
 */
export async function trackImpression(
  impression: {
    userId?: string;
    sessionId?: string;
    channel: Channel;
    campaignId?: string;
    adId?: string;
    creativeId?: string;
    placement?: string;
    device?: 'mobile' | 'tablet' | 'desktop';
  }
): Promise<ApiResponse<{ tracked: boolean }>> {
  try {
    const response = await apiClient.post(`${ATTRIBUTION_BASE_URL}/impression`, impression);
    return response;
  } catch (error) {
    logger.debug('[AttributionService] Impression tracking failed:', error);
    return { success: true, data: { tracked: false } };
  }
}

// ============================================================================
// API METHODS - REPORTS
// ============================================================================

/**
 * Get attribution report
 */
export async function getAttributionReport(
  options: {
    period: { start: string; end: string };
    model?: AttributionModel;
    breakdown?: 'channel' | 'campaign' | 'source' | 'all';
  }
): Promise<ApiResponse<AttributionReport>> {
  try {
    const response = await apiClient.post(`${ATTRIBUTION_BASE_URL}/report`, options);
    return response;
  } catch (error) {
    logger.error('[AttributionService] Failed to get attribution report:', error);
    return { success: false, error: 'Failed to load attribution report' };
  }
}

/**
 * Get campaign performance
 */
export async function getCampaignPerformance(
  campaignId: string,
  period?: { start: string; end: string }
): Promise<ApiResponse<CampaignPerformance>> {
  try {
    const params = period ? `?start=${period.start}&end=${period.end}` : '';
    const response = await apiClient.get(`${ATTRIBUTION_BASE_URL}/campaign/${campaignId}${params}`);
    return response;
  } catch (error) {
    logger.error('[AttributionService] Failed to get campaign performance:', error);
    return { success: false, error: 'Failed to load campaign performance' };
  }
}

/**
 * Get user's attribution history
 */
export async function getUserAttribution(
  userId: string,
  options?: {
    limit?: number;
    includeConversions?: boolean;
  }
): Promise<ApiResponse<{
  userId: string;
  firstTouch: AttributionEvent;
  lastTouch: AttributionEvent;
  touchpoints: AttributionEvent[];
  conversions: Conversion[];
  lifetimeValue: number;
}>> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.includeConversions) params.append('includeConversions', 'true');

    const response = await apiClient.get(`${ATTRIBUTION_BASE_URL}/user/${userId}?${params}`);
    return response;
  } catch (error) {
    logger.error('[AttributionService] Failed to get user attribution:', error);
    return { success: false, error: 'Failed to load user attribution' };
  }
}

// ============================================================================
// API METHODS - UTM MANAGEMENT
// ============================================================================

/**
 * Parse UTM parameters from URL
 */
export function parseUTMParams(url: string): UTMParams {
  try {
    const urlObj = new URL(url);
    return {
      utm_source: urlObj.searchParams.get('utm_source') || undefined,
      utm_medium: urlObj.searchParams.get('utm_medium') || undefined,
      utm_campaign: urlObj.searchParams.get('utm_campaign') || undefined,
      utm_content: urlObj.searchParams.get('utm_content') || undefined,
      utm_term: urlObj.searchParams.get('utm_term') || undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Build UTM URL
 */
export function buildUTMUrl(
  baseUrl: string,
  params: UTMParams & { campaignId?: string }
): string {
  try {
    const urlObj = new URL(baseUrl);
    if (params.utm_source) urlObj.searchParams.set('utm_source', params.utm_source);
    if (params.utm_medium) urlObj.searchParams.set('utm_medium', params.utm_medium);
    if (params.utm_campaign) urlObj.searchParams.set('utm_campaign', params.utm_campaign);
    if (params.utm_content) urlObj.searchParams.set('utm_content', params.utm_content);
    if (params.utm_term) urlObj.searchParams.set('utm_term', params.utm_term);
    if (params.campaignId) urlObj.searchParams.set('campaign_id', params.campaignId);
    return urlObj.toString();
  } catch {
    return baseUrl;
  }
}

/**
 * Get UTM parameters for current session
 */
export function getSessionUTMParams(): UTMParams & { storedAt?: string } {
  // In a real implementation, this would read from AsyncStorage or session storage
  return {
    storedAt: undefined,
  };
}

/**
 * Store UTM parameters for conversion tracking
 */
export async function storeUTMParams(
  userId: string,
  utmParams: UTMParams
): Promise<void> {
  // In a real implementation, this would store to AsyncStorage with user ID
  logger.debug('[AttributionService] Storing UTM params:', utmParams);
}

// ============================================================================
// API METHODS - DEEPLINK ATTRIBUTION
// ============================================================================

/**
 * Track deeplink open
 */
export async function trackDeeplink(
  deeplink: string,
  userId?: string,
  sessionId?: string
): Promise<ApiResponse<{
  tracked: boolean;
  deeplinkId?: string;
  redirectUrl?: string;
}>> {
  try {
    const response = await apiClient.post(`${ATTRIBUTION_BASE_URL}/deeplink`, {
      deeplink,
      userId,
      sessionId,
    });
    return response;
  } catch (error) {
    logger.debug('[AttributionService] Deeplink tracking failed:', error);
    return { success: true, data: { tracked: false } };
  }
}

/**
 * Track QR code scan
 */
export async function trackQRScan(
  qrData: {
    shortcode?: string;
    qrId?: string;
    source?: string;
    userId?: string;
    sessionId?: string;
    location?: { latitude: number; longitude: number };
  }
): Promise<ApiResponse<{ tracked: boolean; qrData?: Record<string, unknown> }>> {
  try {
    const response = await apiClient.post(`${ATTRIBUTION_BASE_URL}/qr`, qrData);
    return response;
  } catch (error) {
    logger.debug('[AttributionService] QR tracking failed:', error);
    return { success: true, data: { tracked: false } };
  }
}

// ============================================================================
// CONVENIENCE TRACKING METHODS
// ============================================================================

/**
 * Track referral signup
 */
export async function trackReferralSignup(
  userId: string,
  referrerCode: string,
  sessionId: string
): Promise<void> {
  await trackEvent({
    userId,
    sessionId,
    type: 'conversion',
    channel: 'referral',
    content: referrerCode,
  });
}

/**
 * Track social share
 */
export async function trackSocialShare(
  userId: string,
  sessionId: string,
  platform: string,
  shareUrl: string
): Promise<void> {
  const channel = platform.toLowerCase() as Channel;
  await trackEvent({
    userId,
    sessionId,
    type: 'click',
    channel: ['instagram', 'facebook', 'twitter', 'whatsapp'].includes(platform.toLowerCase()) ? 'social' : 'referral',
    content: platform,
    metadata: { shareUrl },
  });
}

/**
 * Track ad click
 */
export async function trackAdClick(
  adId: string,
  campaignId: string,
  userId?: string,
  sessionId?: string
): Promise<void> {
  await trackEvent({
    userId: userId || '',
    sessionId: sessionId || '',
    type: 'click',
    channel: 'paid_search',
    adId,
    metadata: { campaignId },
  });
}

/**
 * Track notification open
 */
export async function trackNotificationOpen(
  notificationId: string,
  userId: string,
  sessionId: string
): Promise<void> {
  await trackEvent({
    userId,
    sessionId,
    type: 'click',
    channel: 'push_notification',
    content: notificationId,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export const attributionService = {
  // Tracking
  trackEvent,
  trackConversion,
  trackClick,
  trackImpression,

  // Reports
  getAttributionReport,
  getCampaignPerformance,
  getUserAttribution,

  // UTM
  parseUTMParams,
  buildUTMUrl,
  getSessionUTMParams,
  storeUTMParams,

  // Deeplinks & QR
  trackDeeplink,
  trackQRScan,

  // Convenience
  trackReferralSignup,
  trackSocialShare,
  trackAdClick,
  trackNotificationOpen,
};

export default attributionService;
