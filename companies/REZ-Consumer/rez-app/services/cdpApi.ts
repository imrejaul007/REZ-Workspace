/**
 * CDP API SERVICE
 * Integration with Customer Data Platform
 *
 * Service: REZ-cdp-service
 * URL: https://REZ-cdp-service.onrender.com
 *
 * Features:
 * - Customer data platform
 * - Unified customer profile
 * - Segment management
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

export interface CustomerProfile {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  traits: Record<string, unknown>;
  segments: string[];
  lifetime: {
    orders: number;
    spent: number;
    avgOrderValue: number;
  };
}

export interface Segment {
  id: string;
  name: string;
  description: string;
  customerCount: number;
  criteria: Record<string, unknown>;
}

/**
 * Get customer profile
 */
export async function getCustomerProfile(customerId: string): Promise<ApiResponse<CustomerProfile>> {
  try {
    return await apiClient.get(`/cdp/customers/${customerId}`);
  } catch (error) {
    logger.error('cdpApi.getProfile', { customerId, error });
    throw error;
  }
}

/**
 * Update customer traits
 */
export async function updateCustomerTraits(customerId: string, traits: Record<string, unknown>): Promise<ApiResponse<CustomerProfile>> {
  try {
    return await apiClient.patch(`/cdp/customers/${customerId}/traits`, traits);
  } catch (error) {
    logger.error('cdpApi.updateTraits', { customerId, error });
    throw error;
  }
}

/**
 * Get segments
 */
export async function getSegments(): Promise<ApiResponse<Segment[]>> {
  try {
    return await apiClient.get('/cdp/segments');
  } catch (error) {
    logger.error('cdpApi.getSegments', { error });
    throw error;
  }
}

/**
 * Get segment customers
 */
export async function getSegmentCustomers(segmentId: string): Promise<ApiResponse<{ customerIds: string[] }>> {
  try {
    return await apiClient.get(`/cdp/segments/${segmentId}/customers`);
  } catch (error) {
    logger.error('cdpApi.getSegmentCustomers', { segmentId, error });
    throw error;
  }
}

/**
 * Track customer event
 */
export async function trackCustomerEvent(customerId: string, event: string, properties?: Record<string, unknown>): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.post(`/cdp/customers/${customerId}/events`, { event, properties });
  } catch (error) {
    logger.error('cdpApi.trackEvent', { customerId, event, error });
    return { success: false };
  }
}

export default {
  getCustomerProfile,
  updateCustomerTraits,
  getSegments,
  getSegmentCustomers,
  trackCustomerEvent,
};
