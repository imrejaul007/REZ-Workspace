/**
 * Offers API - Main offer endpoints
 * Split from realOffersApi.ts for better modularity
 */

import apiClient, { ApiResponse } from '@/services/apiClient';
import { logger } from '@/utils/logger';
import type {
  Offer,
  PaginatedResponse,
  GetOffersParams,
  SearchOffersParams,
  NearbyOffersParams,
  OffersPageData,
  UseRedemptionResult,
  VoucherDetails,
} from './types';

export class OffersApi {
  /**
   * Get complete offers page data
   */
  async getOffersPageData(params?: {
    lat?: number;
    lng?: number;
  }): Promise<ApiResponse<OffersPageData>> {
    try {
      return await apiClient.get<OffersPageData>('/offers/page-data', params);
    } catch (error) {
      logger.error('[OFFERS API] Error fetching offers page data:', error);
      throw error;
    }
  }

  /**
   * Get all offers with filters
   */
  async getOffers(params?: GetOffersParams): Promise<ApiResponse<PaginatedResponse<Offer> | Offer[]>> {
    try {
      return await apiClient.get<PaginatedResponse<Offer>>('/offers', params);
    } catch (error) {
      logger.error('[OFFERS API] Error fetching offers:', error);
      throw error;
    }
  }

  /**
   * Get mega offers
   */
  async getMegaOffers(limit?: number): Promise<ApiResponse<Offer[]>> {
    try {
      return await apiClient.get<Offer[]>('/offers/mega', { limit });
    } catch (error) {
      logger.error('[OFFERS API] Error fetching mega offers:', error);
      throw error;
    }
  }

  /**
   * Get student offers
   */
  async getStudentOffers(limit?: number): Promise<ApiResponse<Offer[]>> {
    try {
      return await apiClient.get<Offer[]>('/offers/students', { limit });
    } catch (error) {
      logger.error('[OFFERS API] Error fetching student offers:', error);
      throw error;
    }
  }

  /**
   * Get new arrival offers
   */
  async getNewArrivalOffers(limit?: number): Promise<ApiResponse<Offer[]>> {
    try {
      return await apiClient.get<Offer[]>('/offers/new-arrivals', { limit });
    } catch (error) {
      logger.error('[OFFERS API] Error fetching new arrival offers:', error);
      throw error;
    }
  }

  /**
   * Get trending offers
   */
  async getTrendingOffers(limit?: number): Promise<ApiResponse<Offer[]>> {
    try {
      return await apiClient.get<Offer[]>('/offers/trending', { limit });
    } catch (error) {
      logger.error('[OFFERS API] Error fetching trending offers:', error);
      throw error;
    }
  }

  /**
   * Get nearby offers
   */
  async getNearbyOffers(params: NearbyOffersParams): Promise<ApiResponse<Offer[]>> {
    try {
      return await apiClient.get<Offer[]>('/offers/nearby', params);
    } catch (error) {
      logger.error('[OFFERS API] Error fetching nearby offers:', error);
      throw error;
    }
  }

  /**
   * Get single offer by ID
   */
  async getOfferById(id: string): Promise<ApiResponse<Offer>> {
    try {
      return await apiClient.get<Offer>(`/offers/${id}`);
    } catch (error) {
      logger.error(`[OFFERS API] Error fetching offer ${id}:`, error);
      throw error;
    }
  }

  /**
   * Search offers
   */
  async searchOffers(params: SearchOffersParams): Promise<ApiResponse<PaginatedResponse<Offer>>> {
    try {
      return await apiClient.get<PaginatedResponse<Offer>>('/offers/search', params);
    } catch (error) {
      logger.error('[OFFERS API] Error searching offers:', error);
      throw error;
    }
  }

  /**
   * Like/unlike an offer
   */
  async toggleOfferLike(id: string): Promise<ApiResponse<{ isLiked: boolean; likesCount: number }>> {
    try {
      return await apiClient.post<{ isLiked: boolean; likesCount: number }>(`/offers/${id}/like`);
    } catch (error) {
      logger.error(`[OFFERS API] Error toggling like for offer ${id}:`, error);
      throw error;
    }
  }

  /**
   * Share an offer
   */
  async shareOffer(id: string, params?: {
    platform?: string;
    message?: string;
  }): Promise<ApiResponse<{ success: boolean }>> {
    try {
      return await apiClient.post<{ success: boolean }>(`/offers/${id}/share`, params);
    } catch (error) {
      logger.error(`[OFFERS API] Error sharing offer ${id}:`, error);
      throw error;
    }
  }

  /**
   * Track offer view
   */
  async trackOfferView(id: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      return await apiClient.post<{ success: boolean }>(`/offers/${id}/view`);
    } catch (error) {
      logger.error(`[OFFERS API] Error tracking view for offer ${id}:`, error);
      throw error;
    }
  }

  /**
   * Track offer click
   */
  async trackOfferClick(id: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      return await apiClient.post<{ success: boolean }>(`/offers/${id}/click`);
    } catch (error) {
      logger.error(`[OFFERS API] Error tracking click for offer ${id}:`, error);
      throw error;
    }
  }

  /**
   * Redeem an offer - generates a voucher for the user
   */
  async redeemOffer(id: string, redemptionType: 'online' | 'instore' = 'online'): Promise<ApiResponse<{
    offer: Offer;
    voucher: VoucherDetails;
  }>> {
    try {
      return await apiClient.post<{
        offer: Offer;
        voucher: VoucherDetails;
      }>(`/offers/${id}/redeem`, { redemptionType });
    } catch (error) {
      logger.error(`[OFFERS API] Error redeeming offer ${id}:`, error);
      throw error;
    }
  }
}

export const offersApi = new OffersApi();
export default offersApi;
