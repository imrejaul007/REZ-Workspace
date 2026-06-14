/**
 * DOOH Service
 * Integration with REZ Media DOOH services for proximity advertising
 *
 * Features:
 * - Screen discovery based on user location
 * - Screen playlist management
 * - Proximity triggers
 * - Impression attribution
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export interface DOOHScreen {
  id: string;
  name: string;
  type: 'cab_tablet' | 'retail_kiosk' | 'elevator_screen' | 'billboard_led' | 'restaurant_order';
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
    zone?: string;
  };
  merchant?: {
    id: string;
    name: string;
  };
  specs: {
    width: number;
    height: number;
    orientation: 'landscape' | 'portrait';
    cpm: number; // Cost per 1000 impressions
  };
  isActive: boolean;
  currentPlaylist?: DOOHPlaylist;
}

export interface DOOHPlaylist {
  id: string;
  screenId: string;
  ads: DOOHAd[];
  startsAt: string;
  endsAt: string;
}

export interface DOOHAd {
  adId: string;
  campaignId: string;
  creativeUrl: string;
  duration: number; // seconds
  targetAudience?: string[];
  clickUrl?: string;
}

export interface DOOHProximityEvent {
  userId: string;
  screenId: string;
  timestamp: string;
  location: { lat: number; lng: number };
}

export interface DOOHAttribution {
  impressionId: string;
  screenId: string;
  userId: string;
  adId: string;
  campaignId: string;
  attributedOrderId?: string;
  attributionWindow: number; // hours
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const DOOH_SERVICE_URL = process.env.EXPO_PUBLIC_DOOH_SERVICE_URL || 'https://rez-dooh-service.onrender.com';
const DOOH_API_VERSION = 'v1';
const DOOH_BASE_URL = `${DOOH_SERVICE_URL}/api/${DOOH_API_VERSION}`;

// ============================================================================
// API METHODS
// ============================================================================

/**
 * Get nearby DOOH screens
 */
export async function getNearbyScreens(
  lat: number,
  lng: number,
  radiusKm = 5
): Promise<ApiResponse<DOOHScreen[]>> {
  try {
    const response = await apiClient.get(
      `${DOOH_BASE_URL}/screens/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`
    );
    // @ts-ignore
    return response;
  } catch (error) {
    logger.error('[DOOH] Failed to get nearby screens:', error);
    return { success: false, error: 'Failed to load nearby screens' };
  }
}

/**
 * Get screen by ID
 */
export async function getScreen(screenId: string): Promise<ApiResponse<DOOHScreen>> {
  try {
    const response = await apiClient.get(`${DOOH_BASE_URL}/screens/${screenId}`);
    // @ts-ignore
    return response;
  } catch (error) {
    logger.error('[DOOH] Failed to get screen:', error);
    return { success: false, error: 'Failed to load screen' };
  }
}

/**
 * Get current playlist for a screen
 */
export async function getScreenPlaylist(
  screenId: string
): Promise<ApiResponse<DOOHPlaylist>> {
  try {
    const response = await apiClient.get(`${DOOH_BASE_URL}/screens/${screenId}/playlist`);
    // @ts-ignore
    return response;
  } catch (error) {
    logger.error('[DOOH] Failed to get playlist:', error);
    return { success: false, error: 'Failed to load playlist' };
  }
}

/**
 * Record proximity event
 */
export async function recordProximityEvent(
  event: DOOHProximityEvent
): Promise<ApiResponse<{ recorded: boolean }>> {
  try {
    const response = await apiClient.post(`${DOOH_BASE_URL}/proximity`, event);
    // @ts-ignore
    return response;
  } catch (error) {
    logger.debug('[DOOH] Proximity recording failed:', error);
    return { success: true, data: { recorded: false } }; // Silent fail for proximity
  }
}

/**
 * Record ad impression
 */
export async function recordImpression(
  attribution: DOOHAttribution
): Promise<ApiResponse<{ impressionId: string }>> {
  try {
    const response = await apiClient.post(`${DOOH_BASE_URL}/attribution/impression`, attribution);
    // @ts-ignore
    return response;
  } catch (error) {
    logger.debug('[DOOH] Impression recording failed:', error);
    return { success: true, data: { impressionId: '' } };
  }
}

/**
 * Track DOOH-to-conversion attribution
 */
export async function trackConversion(
  attributionData: {
    impressionId: string;
    orderId: string;
    revenue: number;
  }
): Promise<ApiResponse<{ attributed: boolean; revenueAttributed: number }>> {
  try {
    const response = await apiClient.post(`${DOOH_BASE_URL}/attribution/convert`, attributionData);
    // @ts-ignore
    return response;
  } catch (error) {
    logger.debug('[DOOH] Conversion tracking failed:', error);
    return { success: false, error: 'Failed to track conversion' };
  }
}

/**
 * Get user's DOOH ad history
 */
export async function getUserAdHistory(
  userId: string,
  limit = 50
): Promise<ApiResponse<Array<{
  timestamp: string;
  screenId: string;
  screenName: string;
  adId: string;
  campaignId: string;
  rewardEarned?: number;
}>>> {
  try {
    const response = await apiClient.get(
      `${DOOH_BASE_URL}/users/${userId}/history?limit=${limit}`
    );
    // @ts-ignore
    return response;
  } catch (error) {
    logger.error('[DOOH] Failed to get ad history:', error);
    return { success: false, error: 'Failed to load ad history' };
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DOOH_SCREEN_TYPES = {
  cab_tablet: { label: 'Cab Tablet', icon: 'car', cpm: '₹15-25' },
  retail_kiosk: { label: 'Retail Kiosk', icon: 'storefront', cpm: '₹10-20' },
  elevator_screen: { label: 'Elevator Screen', icon: 'business', cpm: '₹8-15' },
  billboard_led: { label: 'LED Billboard', icon: 'tablet-landscape', cpm: '₹50-150' },
  restaurant_order: { label: 'Restaurant Display', icon: 'restaurant', cpm: '₹12-18' },
};

export const PROXIMITY_THRESHOLDS = {
  NEAR: 50, // meters - user is near screen
  VIEW: 100, // meters - user can see screen
  WALKING: 500, // meters - user walking by
};
