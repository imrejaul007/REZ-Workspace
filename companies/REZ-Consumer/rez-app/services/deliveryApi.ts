/**
 * DELIVERY API SERVICE
 * Integration with RABTUL Delivery Service
 *
 * Service: rez-delivery-service
 * Port: 4009
 * URL: https://rez-delivery-service.onrender.com
 *
 * Features:
 * - Driver tracking with real-time location
 * - Route optimization
 * - WebSocket support for live updates
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// Environment variable for delivery service
const DELIVERY_SERVICE_URL = process.env.EXPO_PUBLIC_DELIVERY_SERVICE_URL || '';

// ============================================================================
// TYPES
// ============================================================================

export interface DeliveryLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  vehicleType?: 'bike' | 'car' | 'van';
  rating?: number;
  totalDeliveries?: number;
}

export interface Delivery {
  id: string;
  orderId: string;
  status: DeliveryStatus;
  driver?: Driver;
  currentLocation?: DeliveryLocation;
  pickupAddress: Address;
  deliveryAddress: Address;
  estimatedArrival?: string;
  actualPickupTime?: string;
  actualDeliveryTime?: string;
  route?: RouteInfo;
  proofOfDelivery?: ProofOfDelivery;
  timeline: DeliveryTimeline[];
}

export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'nearby'
  | 'delivered'
  | 'cancelled'
  | 'failed';

export interface Address {
  id?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  landmark?: string;
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  polyline?: string; // encoded polyline
}

export interface ProofOfDelivery {
  type: 'photo' | 'signature' | 'otp';
  value: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
}

export interface DeliveryTimeline {
  status: DeliveryStatus;
  timestamp: string;
  message: string;
  location?: DeliveryLocation;
}

export interface DeliveryETA {
  estimatedArrival: string;
  distance: number;
  duration: number;
  isDelayed: boolean;
  delayMinutes?: number;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get delivery by order ID
 */
export async function getDeliveryByOrderId(orderId: string): Promise<ApiResponse<Delivery>> {
  try {
    return await apiClient.get<Delivery>(`/delivery/order/${orderId}`);
  } catch (error) {
    logger.error('deliveryApi.getDeliveryByOrderId', { orderId, error });
    throw error;
  }
}

/**
 * Get delivery by ID
 */
export async function getDeliveryById(deliveryId: string): Promise<ApiResponse<Delivery>> {
  try {
    return await apiClient.get<Delivery>(`/delivery/${deliveryId}`);
  } catch (error) {
    logger.error('deliveryApi.getDeliveryById', { deliveryId, error });
    throw error;
  }
}

/**
 * Get driver's current location for a delivery
 */
export async function getDriverLocation(deliveryId: string): Promise<ApiResponse<DeliveryLocation>> {
  try {
    return await apiClient.get<DeliveryLocation>(`/delivery/${deliveryId}/driver-location`);
  } catch (error) {
    logger.error('deliveryApi.getDriverLocation', { deliveryId, error });
    throw error;
  }
}

/**
 * Get delivery ETA
 */
export async function getDeliveryETA(deliveryId: string): Promise<ApiResponse<DeliveryETA>> {
  try {
    return await apiClient.get<DeliveryETA>(`/delivery/${deliveryId}/eta`);
  } catch (error) {
    logger.error('deliveryApi.getDeliveryETA', { deliveryId, error });
    throw error;
  }
}

/**
 * Get user's delivery history
 */
export async function getDeliveryHistory(
  params?: {
    page?: number;
    limit?: number;
    status?: DeliveryStatus;
    startDate?: string;
    endDate?: string;
  }
): Promise<ApiResponse<{
  deliveries: Delivery[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);

    const query = queryParams.toString();
    const url = `/delivery/history${query ? `?${query}` : ''}`;
    return await apiClient.get(url);
  } catch (error) {
    logger.error('deliveryApi.getDeliveryHistory', { params, error });
    throw error;
  }
}

/**
 * Get active deliveries (currently in progress)
 */
export async function getActiveDeliveries(): Promise<ApiResponse<Delivery[]>> {
  try {
    return await apiClient.get<Delivery[]>('/delivery/active');
  } catch (error) {
    logger.error('deliveryApi.getActiveDeliveries', { error });
    throw error;
  }
}

/**
 * Report delivery issue
 */
export async function reportDeliveryIssue(
  deliveryId: string,
  params: {
    type: 'late' | 'wrong_item' | 'damaged' | 'driver_issue' | 'other';
    description?: string;
  }
): Promise<ApiResponse<{ ticketId: string }>> {
  try {
    return await apiClient.post(`/delivery/${deliveryId}/report`, params);
  } catch (error) {
    logger.error('deliveryApi.reportDeliveryIssue', { deliveryId, params, error });
    throw error;
  }
}

/**
 * Cancel delivery (before picked up)
 */
export async function cancelDelivery(
  deliveryId: string,
  params: {
    reason: string;
    cancelType: 'customer' | 'restaurant' | 'driver';
  }
): Promise<ApiResponse<{ success: boolean; message: string }>> {
  try {
    return await apiClient.post(`/delivery/${deliveryId}/cancel`, params);
  } catch (error) {
    logger.error('deliveryApi.cancelDelivery', { deliveryId, params, error });
    throw error;
  }
}

/**
 * Share delivery tracking with someone
 */
export async function shareDeliveryTracking(
  deliveryId: string,
  params: {
    shareWith: 'sms' | 'whatsapp' | 'email';
    recipient: string;
  }
): Promise<ApiResponse<{ shareUrl: string }>> {
  try {
    return await apiClient.post(`/delivery/${deliveryId}/share`, params);
  } catch (error) {
    logger.error('deliveryApi.shareDeliveryTracking', { deliveryId, params, error });
    throw error;
  }
}

/**
 * Get delivery tracking URL for sharing
 */
export async function getDeliveryTrackingUrl(deliveryId: string): Promise<ApiResponse<{ trackingUrl: string }>> {
  try {
    return await apiClient.get<{ trackingUrl: string }>(`/delivery/${deliveryId}/tracking-url`);
  } catch (error) {
    logger.error('deliveryApi.getDeliveryTrackingUrl', { deliveryId, error });
    throw error;
  }
}

/**
 * Verify delivery OTP (for hand-off)
 */
export async function verifyDeliveryOTP(
  deliveryId: string,
  otp: string
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.post(`/delivery/${deliveryId}/verify-otp`, { otp });
  } catch (error) {
    logger.error('deliveryApi.verifyDeliveryOTP', { deliveryId, error });
    throw error;
  }
}

/**
 * Get nearby drivers (for store/admin use)
 */
export async function getNearbyDrivers(
  params: {
    latitude: number;
    longitude: number;
    radius?: number; // in meters, default 5000
    vehicleType?: 'bike' | 'car' | 'van';
  }
): Promise<ApiResponse<{
  drivers: Array<Driver & { distance: number; eta: number }>;
}>> {
  try {
    return await apiClient.post('/delivery/nearby-drivers', params);
  } catch (error) {
    logger.error('deliveryApi.getNearbyDrivers', { params, error });
    throw error;
  }
}

// ============================================================================
// WEBSOCKET EVENTS (for real-time updates)
// ============================================================================

export type DeliveryEventType =
  | 'driver_assigned'
  | 'picked_up'
  | 'location_update'
  | 'nearby'
  | 'delivered'
  | 'failed';

export interface DeliveryEvent {
  type: DeliveryEventType;
  deliveryId: string;
  data: {
    driver?: Driver;
    location?: DeliveryLocation;
    timestamp: string;
    message?: string;
  };
}

/**
 * WebSocket event handlers for delivery updates
 */
export const deliveryWebSocketEvents = {
  onDriverAssigned: (callback: (event: DeliveryEvent) => void) => {
    // To be implemented with socketService
    logger.log('[deliveryApi] Driver assigned event handler registered');
  },
  onLocationUpdate: (callback: (event: DeliveryEvent) => void) => {
    logger.log('[deliveryApi] Location update event handler registered');
  },
  onDeliveryUpdate: (callback: (event: DeliveryEvent) => void) => {
    logger.log('[deliveryApi] Delivery update event handler registered');
  },
};

export default {
  getDeliveryByOrderId,
  getDeliveryById,
  getDriverLocation,
  getDeliveryETA,
  getDeliveryHistory,
  getActiveDeliveries,
  reportDeliveryIssue,
  cancelDelivery,
  shareDeliveryTracking,
  getDeliveryTrackingUrl,
  verifyDeliveryOTP,
  getNearbyDrivers,
  deliveryWebSocketEvents,
};
