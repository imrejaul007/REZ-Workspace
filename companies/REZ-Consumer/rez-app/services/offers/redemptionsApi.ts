/**
 * Offers Redemptions API
 * Split from realOffersApi.ts for better modularity
 */

import apiClient, { ApiResponse } from '@/services/apiClient';
import { logger } from '@/utils/logger';
import type { Offer, PaginatedResponse, ValidationResult, UseRedemptionResult } from './types';

export class RedemptionsApi {
  /**
   * Get user's favorite offers
   */
  async getUserFavoriteOffers(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Offer>>> {
    try {
      return await apiClient.get<PaginatedResponse<Offer>>('/offers/user/favorites', params);
    } catch (error) {
      logger.error('[OFFERS API] Error fetching user favorite offers:', error);
      throw error;
    }
  }

  /**
   * Add offer to favorites
   */
  async addOfferToFavorites(id: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      return await apiClient.post<{ success: boolean }>(`/offers/${id}/favorite`);
    } catch (error) {
      logger.error(`[OFFERS API] Error adding offer ${id} to favorites:`, error);
      throw error;
    }
  }

  /**
   * Remove offer from favorites
   */
  async removeOfferFromFavorites(id: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      return await apiClient.delete<{ success: boolean }>(`/offers/${id}/favorite`);
    } catch (error) {
      logger.error(`[OFFERS API] Error removing offer ${id} from favorites:`, error);
      throw error;
    }
  }

  /**
   * Get user's offer redemptions
   */
  async getUserRedemptions(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Offer>>> {
    try {
      return await apiClient.get<PaginatedResponse<Offer>>('/offers/user/redemptions', params);
    } catch (error) {
      logger.error('[OFFERS API] Error fetching user redemptions:', error);
      throw error;
    }
  }

  /**
   * Validate a redemption code before use
   */
  async validateRedemptionCode(code: string): Promise<ApiResponse<ValidationResult>> {
    try {
      return await apiClient.post<ValidationResult>('/offers/redemptions/validate', { code });
    } catch (error) {
      logger.error('[OFFERS API] Error validating redemption code:', error);
      throw error;
    }
  }

  /**
   * Mark a redemption as used and credit cashback
   */
  async markRedemptionAsUsed(
    redemptionId: string,
    params: {
      orderAmount: number;
      orderId?: string;
      storeId?: string;
    }
  ): Promise<ApiResponse<UseRedemptionResult>> {
    try {
      return await apiClient.post<UseRedemptionResult>(
        `/offers/redemptions/${redemptionId}/use`,
        {
          orderAmount: params.orderAmount,
          orderId: params.orderId,
          storeId: params.storeId,
        }
      );
    } catch (error) {
      logger.error('[OFFERS API] Error marking redemption as used:', error);
      throw error;
    }
  }

  /**
   * Get single redemption details
   */
  async getRedemptionById(redemptionId: string): Promise<ApiResponse<Record<string, unknown>>> {
    try {
      return await apiClient.get<Record<string, unknown>>(`/offers/redemptions/${redemptionId}`);
    } catch (error) {
      logger.error('[OFFERS API] Error fetching redemption:', error);
      throw error;
    }
  }
}

export const redemptionsApi = new RedemptionsApi();
export default redemptionsApi;
