/**
 * RFM PLUS API SERVICE
 * Integration with RABTUL RFM Plus Service
 *
 * Service: REZ-rfm-plus
 * Port: 4055
 * URL: https://rez-rfm-plus.onrender.com
 *
 * Features:
 * - RFM Analysis (Recency, Frequency, Monetary)
 * - Customer Segmentation
 * - LTV Prediction
 * - Churn Prediction
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

export type RFMScore = 'champion' | 'loyal' | 'potential' | 'promising' | 'needs_attention' | 'at_risk' | 'cant_lose_them' | 'hibernating' | 'lost';

export interface CustomerRFM {
  customerId: string;
  recency: number;
  frequency: number;
  monetary: number;
  rfmScore: string;
  segment: RFMScore;
  totalOrders: number;
  avgOrderValue: number;
}

export interface ChurnRisk {
  customerId: string;
  churnScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{ factor: string; impact: number }>;
}

export interface LTVPrediction {
  customerId: string;
  predictedLTV: number;
  confidence: number;
  churnRisk: 'low' | 'medium' | 'high';
}

/**
 * Get customer RFM analysis
 */
export async function getCustomerRFM(customerId: string): Promise<ApiResponse<CustomerRFM>> {
  try {
    return await apiClient.get(`/rfm/customer/${customerId}`);
  } catch (error) {
    logger.error('rfmApi.getCustomerRFM', { customerId, error });
    throw error;
  }
}

/**
 * Get RFM segments
 */
export async function getRFMSegments(): Promise<ApiResponse<Array<{ name: string; count: number }>>> {
  try {
    return await apiClient.get('/rfm/segments');
  } catch (error) {
    logger.error('rfmApi.getRFMSegments', { error });
    throw error;
  }
}

/**
 * Get LTV prediction
 */
export async function getLTVPrediction(customerId: string): Promise<ApiResponse<LTVPrediction>> {
  try {
    return await apiClient.get(`/ltv/predict/${customerId}`);
  } catch (error) {
    logger.error('rfmApi.getLTVPrediction', { customerId, error });
    throw error;
  }
}

/**
 * Get churn risk
 */
export async function getChurnRisk(customerId: string): Promise<ApiResponse<ChurnRisk>> {
  try {
    return await apiClient.get(`/churn/risk/${customerId}`);
  } catch (error) {
    logger.error('rfmApi.getChurnRisk', { customerId, error });
    throw error;
  }
}

/**
 * Get customers at risk
 */
export async function getAtRiskCustomers(limit?: number): Promise<ApiResponse<ChurnRisk[]>> {
  try {
    return await apiClient.get(`/churn/at-risk${limit ? `?limit=${limit}` : ''}`);
  } catch (error) {
    logger.error('rfmApi.getAtRiskCustomers', { error });
    throw error;
  }
}

export default {
  getCustomerRFM,
  getRFMSegments,
  getLTVPrediction,
  getChurnRisk,
  getAtRiskCustomers,
};
