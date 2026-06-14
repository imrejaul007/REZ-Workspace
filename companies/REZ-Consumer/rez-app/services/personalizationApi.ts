/**
 * PERSONALIZATION ENGINE API SERVICE
 * Integration with REZ Personalization Engine
 *
 * Service: REZ-personalization-engine
 * URL: https://REZ-personalization-engine.onrender.com
 *
 * Features:
 * - Real-time personalization
 * - Product recommendations
 * - User preferences
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

export interface PersonalizationConfig {
  userId: string;
  features: {
    recommendations: boolean;
    searchRanking: boolean;
    notifications: boolean;
  };
}

export interface PersonalizedContent {
  id: string;
  type: 'product' | 'offer' | 'content';
  score: number;
  reason: string;
}

/**
 * Get personalization config
 */
export async function getPersonalizationConfig(userId: string): Promise<ApiResponse<PersonalizationConfig>> {
  try {
    return await apiClient.get(`/personalization/${userId}/config`);
  } catch (error) {
    logger.error('personalizationApi.getConfig', { userId, error });
    throw error;
  }
}

/**
 * Update personalization config
 */
export async function updatePersonalizationConfig(userId: string, config: Partial<PersonalizationConfig['features']>): Promise<ApiResponse<PersonalizationConfig>> {
  try {
    return await apiClient.patch(`/personalization/${userId}/config`, config);
  } catch (error) {
    logger.error('personalizationApi.updateConfig', { userId, error });
    throw error;
  }
}

/**
 * Get personalized products
 */
export async function getPersonalizedProducts(userId: string, limit?: number): Promise<ApiResponse<PersonalizedContent[]>> {
  try {
    return await apiClient.get(`/personalization/${userId}/products${limit ? `?limit=${limit}` : ''}`);
  } catch (error) {
    logger.error('personalizationApi.getProducts', { userId, error });
    throw error;
  }
}

/**
 * Get personalized offers
 */
export async function getPersonalizedOffers(userId: string): Promise<ApiResponse<PersonalizedContent[]>> {
  try {
    return await apiClient.get(`/personalization/${userId}/offers`);
  } catch (error) {
    logger.error('personalizationApi.getOffers', { userId, error });
    throw error;
  }
}

/**
 * Get personalized search results
 */
export async function getPersonalizedSearch(userId: string, query: string): Promise<ApiResponse<{ results: PersonalizedContent[] }>> {
  try {
    return await apiClient.get(`/personalization/${userId}/search?q=${encodeURIComponent(query)}`);
  } catch (error) {
    logger.error('personalizationApi.getSearch', { userId, query, error });
    throw error;
  }
}

/**
 * Record personalization feedback
 */
export async function recordPersonalizationFeedback(userId: string, itemId: string, action: 'click' | 'purchase' | 'dismiss'): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.post(`/personalization/${userId}/feedback`, { itemId, action });
  } catch (error) {
    logger.error('personalizationApi.recordFeedback', { userId, itemId, action, error });
    return { success: false };
  }
}

export default {
  getPersonalizationConfig,
  updatePersonalizationConfig,
  getPersonalizedProducts,
  getPersonalizedOffers,
  getPersonalizedSearch,
  recordPersonalizationFeedback,
};
