/**
 * ATTRIBUTION PLATFORM API SERVICE
 * Integration with REZ Attribution Platform
 *
 * Service: REZ-attribution-platform
 * URL: https://REZ-attribution-platform.onrender.com
 *
 * Features:
 * - Campaign attribution
 * - Multi-touch attribution
 * - Conversion tracking
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

export interface AttributionEvent {
  id: string;
  userId: string;
  event: string;
  channel: string;
  campaign?: string;
  timestamp: string;
}

export interface Conversion {
  id: string;
  userId: string;
  type: 'purchase' | 'signup' | 'lead';
  value?: number;
  attributedChannels: string[];
  attributedCampaigns: string[];
  timestamp: string;
}

export interface AttributionReport {
  channel: string;
  conversions: number;
  revenue: number;
  cost: number;
  roi: number;
}

/**
 * Track event
 */
export async function trackEvent(event: { userId: string; event: string; channel: string; campaign?: string; metadata?: Record<string, unknown> }): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.post('/attribution/events', event);
  } catch (error) {
    logger.error('attributionApi.trackEvent', { error });
    return { success: false };
  }
}

/**
 * Get user journey
 */
export async function getUserJourney(userId: string): Promise<ApiResponse<AttributionEvent[]>> {
  try {
    return await apiClient.get(`/attribution/journey/${userId}`);
  } catch (error) {
    logger.error('attributionApi.getJourney', { userId, error });
    throw error;
  }
}

/**
 * Get conversions
 */
export async function getConversions(params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<Conversion[]>> {
  try {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    return await apiClient.get(`/attribution/conversions${query.toString() ? `?${query}` : ''}`);
  } catch (error) {
    logger.error('attributionApi.getConversions', { error });
    throw error;
  }
}

/**
 * Get attribution report
 */
export async function getAttributionReport(params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<AttributionReport[]>> {
  try {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    return await apiClient.get(`/attribution/report${query.toString() ? `?${query}` : ''}`);
  } catch (error) {
    logger.error('attributionApi.getReport', { error });
    throw error;
  }
}

/**
 * Get channel performance
 */
export async function getChannelPerformance(channel: string): Promise<ApiResponse<{ conversions: number; revenue: number; roi: number }>> {
  try {
    return await apiClient.get(`/attribution/channel/${channel}/performance`);
  } catch (error) {
    logger.error('attributionApi.getChannelPerformance', { channel, error });
    throw error;
  }
}

export default {
  trackEvent,
  getUserJourney,
  getConversions,
  getAttributionReport,
  getChannelPerformance,
};
