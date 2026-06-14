/**
 * Offers Categories API
 * Split from realOffersApi.ts for better modularity
 */

import apiClient, { ApiResponse } from '@/services/apiClient';
import { logger } from '@/utils/logger';
import type { OfferCategory, Offer, PaginatedResponse, CategoryOffersParams } from './types';

export class CategoriesApi {
  /**
   * Get all offer categories
   */
  async getOfferCategories(): Promise<ApiResponse<OfferCategory[]>> {
    try {
      return await apiClient.get<OfferCategory[]>('/offer-categories');
    } catch (error) {
      logger.error('[OFFERS API] Error fetching offer categories:', error);
      throw error;
    }
  }

  /**
   * Get offer category by slug
   */
  async getOfferCategoryBySlug(slug: string): Promise<ApiResponse<OfferCategory>> {
    try {
      return await apiClient.get<OfferCategory>(`/offer-categories/${slug}`);
    } catch (error) {
      logger.error(`[OFFERS API] Error fetching category ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Get offers by category slug
   */
  async getOffersByCategorySlug(
    slug: string,
    params?: CategoryOffersParams
  ): Promise<ApiResponse<PaginatedResponse<Offer>>> {
    try {
      return await apiClient.get<PaginatedResponse<Offer>>(
        `/offer-categories/${slug}/offers`,
        params
      );
    } catch (error) {
      logger.error(`[OFFERS API] Error fetching offers for category ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Get hotspots
   */
  async getHotspots(params?: {
    lat?: number;
    lng?: number;
    limit?: number;
  }): Promise<ApiResponse<unknown[]>> {
    try {
      return await apiClient.get<unknown[]>('/offers/hotspots', params);
    } catch (error) {
      logger.error('[OFFERS API] Error fetching hotspots:', error);
      throw error;
    }
  }

  /**
   * Get offers for a specific hotspot
   */
  async getHotspotOffers(slug: string, limit?: number): Promise<ApiResponse<{
    hotspot: unknown;
    offers: Offer[];
  }>> {
    try {
      return await apiClient.get<{ hotspot: unknown; offers: Offer[] }>(
        `/offers/hotspots/${slug}/offers`,
        { limit }
      );
    } catch (error) {
      logger.error(`[OFFERS API] Error fetching hotspot ${slug} offers:`, error);
      throw error;
    }
  }

  /**
   * Get BOGO offers
   */
  async getBOGOOffers(params?: {
    bogoType?: 'buy1get1' | 'buy2get1' | 'buy1get50' | 'buy2get50';
    limit?: number;
  }): Promise<ApiResponse<Offer[]>> {
    try {
      return await apiClient.get<Offer[]>('/offers/bogo', params);
    } catch (error) {
      logger.error('[OFFERS API] Error fetching BOGO offers:', error);
      throw error;
    }
  }

  /**
   * Get sale and clearance offers
   */
  async getSaleOffers(params?: {
    saleTag?: 'clearance' | 'sale' | 'last_pieces' | 'mega_sale';
    limit?: number;
  }): Promise<ApiResponse<Offer[]>> {
    try {
      return await apiClient.get<Offer[]>('/offers/sales-clearance', params);
    } catch (error) {
      logger.error('[OFFERS API] Error fetching sale offers:', error);
      throw error;
    }
  }

  /**
   * Get free delivery offers
   */
  async getFreeDeliveryOffers(limit?: number): Promise<ApiResponse<Offer[]>> {
    try {
      return await apiClient.get<Offer[]>('/offers/free-delivery', { limit });
    } catch (error) {
      logger.error('[OFFERS API] Error fetching free delivery offers:', error);
      throw error;
    }
  }

  /**
   * Get bank and wallet offers
   */
  async getBankOffers(params?: {
    cardType?: 'credit' | 'debit' | 'wallet' | 'upi' | 'bnpl';
    limit?: number;
  }): Promise<ApiResponse<unknown[]>> {
    try {
      return await apiClient.get<unknown[]>('/offers/bank-offers', params);
    } catch (error) {
      logger.error('[OFFERS API] Error fetching bank offers:', error);
      throw error;
    }
  }

  /**
   * Get special profiles (Defence, Healthcare, etc.)
   */
  async getSpecialProfiles(): Promise<ApiResponse<unknown[]>> {
    try {
      return await apiClient.get<unknown[]>('/offers/special-profiles');
    } catch (error) {
      logger.error('[OFFERS API] Error fetching special profiles:', error);
      throw error;
    }
  }

  /**
   * Get offers for a specific special profile
   */
  async getSpecialProfileOffers(
    slug: string,
    limit?: number
  ): Promise<ApiResponse<{ profile: unknown; offers: Offer[] }>> {
    try {
      return await apiClient.get<{ profile: unknown; offers: Offer[] }>(
        `/offers/special-profiles/${slug}/offers`,
        { limit }
      );
    } catch (error) {
      logger.error(`[OFFERS API] Error fetching special profile ${slug} offers:`, error);
      throw error;
    }
  }
}

export const categoriesApi = new CategoriesApi();
export default categoriesApi;
