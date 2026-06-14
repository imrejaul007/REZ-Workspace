/**
 * LOGISTICS AGGREGATOR API SERVICE
 * Integration with RABTUL Logistics Aggregator Service
 *
 * Service: REZ-logistics-aggregator
 * Port: 4052
 * URL: https://rez-logistics-aggregator.onrender.com
 *
 * Features:
 * - Multi-carrier rate comparison
 * - Courier tracking
 * - Shipping label generation
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

export type CarrierName = 'delhivery' | 'bluedart' | 'dtdc' | 'fedex' | 'ecom' | 'shadowfax';
export type ShipmentStatus = 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';

export interface RateRequest {
  pickupPincode: string;
  deliveryPincode: string;
  weight: number;
}

export interface Rate {
  carrier: CarrierName;
  rate: number;
  deliveryDays: number;
}

export interface Shipment {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: CarrierName;
  status: ShipmentStatus;
  estimatedDelivery?: string;
}

export interface TrackingEvent {
  status: ShipmentStatus;
  location?: string;
  timestamp: string;
  message: string;
}

/**
 * Get rates from all carriers
 */
export async function getRates(request: RateRequest): Promise<ApiResponse<Rate[]>> {
  try {
    return await apiClient.post('/logistics/rates', request);
  } catch (error) {
    logger.error('logisticsApi.getRates', { error });
    throw error;
  }
}

/**
 * Create shipment
 */
export async function createShipment(params: { orderId: string; carrier: CarrierName; pickupPincode: string; deliveryPincode: string; weight: number }): Promise<ApiResponse<Shipment>> {
  try {
    return await apiClient.post('/logistics/shipments', params);
  } catch (error) {
    logger.error('logisticsApi.createShipment', { orderId: params.orderId, error });
    throw error;
  }
}

/**
 * Track shipment
 */
export async function trackShipment(shipmentId: string): Promise<ApiResponse<TrackingEvent[]>> {
  try {
    return await apiClient.get(`/logistics/shipments/${shipmentId}/track`);
  } catch (error) {
    logger.error('logisticsApi.trackShipment', { shipmentId, error });
    throw error;
  }
}

/**
 * Get shipment
 */
export async function getShipment(shipmentId: string): Promise<ApiResponse<Shipment>> {
  try {
    return await apiClient.get(`/logistics/shipments/${shipmentId}`);
  } catch (error) {
    logger.error('logisticsApi.getShipment', { shipmentId, error });
    throw error;
  }
}

/**
 * Get shipment by tracking number
 */
export async function getShipmentByTracking(trackingNumber: string): Promise<ApiResponse<Shipment>> {
  try {
    return await apiClient.get(`/logistics/shipments/tracking/${trackingNumber}`);
  } catch (error) {
    logger.error('logisticsApi.getShipmentByTracking', { trackingNumber, error });
    throw error;
  }
}

/**
 * Generate shipping label
 */
export async function generateLabel(shipmentId: string): Promise<ApiResponse<{ labelUrl: string }>> {
  try {
    return await apiClient.post(`/logistics/shipments/${shipmentId}/label`, {});
  } catch (error) {
    logger.error('logisticsApi.generateLabel', { shipmentId, error });
    throw error;
  }
}

export default {
  getRates,
  createShipment,
  trackShipment,
  getShipment,
  getShipmentByTracking,
  generateLabel,
};
