/**
 * Offers Banners API
 * Split from realOffersApi.ts for better modularity
 */

import apiClient, { ApiResponse } from '@/services/apiClient';
import { logger } from '@/utils/logger';
import type { HeroBanner, HomepageDealsSection } from './types';

export class BannersApi {
  /**
   * Get hero banners
   */
  async getHeroBanners(params?: {
    page?: string;
    position?: string;
  }): Promise<ApiResponse<HeroBanner[]>> {
    try {
      return await apiClient.get<HeroBanner[]>('/hero-banners', params);
    } catch (error) {
      logger.error('[OFFERS API] Error fetching hero banners:', error);
      throw error;
    }
  }

  /**
   * Track hero banner view
   */
  async trackHeroBannerView(
    id: string,
    params?: {
      source?: string;
      device?: string;
      location?: {
        type: 'Point';
        coordinates: [number, number];
      };
    }
  ): Promise<ApiResponse<{ success: boolean }>> {
    try {
      return await apiClient.post<{ success: boolean }>(`/hero-banners/${id}/view`, params);
    } catch (error) {
      logger.error(`[OFFERS API] Error tracking hero banner view ${id}:`, error);
      throw error;
    }
  }

  /**
   * Track hero banner click
   */
  async trackHeroBannerClick(
    id: string,
    params?: {
      source?: string;
      device?: string;
      location?: {
        type: 'Point';
        coordinates: [number, number];
      };
    }
  ): Promise<ApiResponse<{ success: boolean }>> {
    try {
      return await apiClient.post<{ success: boolean }>(`/hero-banners/${id}/click`, params);
    } catch (error) {
      logger.error(`[OFFERS API] Error tracking hero banner click ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get homepage deals section config and items
   */
  async getHomepageDealsSection(region?: string): Promise<ApiResponse<HomepageDealsSection | null>> {
    try {
      const headers: Record<string, string> = {};
      if (region) {
        headers['X-Rez-Region'] = region;
      }
      return await apiClient.get<HomepageDealsSection>(
        '/offers/homepage-deals-section',
        {},
        { headers }
      );
    } catch (error) {
      logger.error('[OFFERS API] Error fetching homepage deals section:', error);
      throw error;
    }
  }

  /**
   * Get exclusive zones
   */
  async getExclusiveZones(): Promise<ApiResponse<Record<string, unknown>[]>> {
    try {
      return await apiClient.get<Record<string, unknown>[]>('/offers/exclusive-zones');
    } catch (error) {
      logger.error('[OFFERS API] Error fetching exclusive zones:', error);
      throw error;
    }
  }

  /**
   * Get offers for a specific exclusive zone
   */
  async getExclusiveZoneOffers(
    slug: string,
    limit?: number
  ): Promise<ApiResponse<{ zone: Record<string, unknown>; offers: unknown[] }>> {
    try {
      return await apiClient.get<{ zone: Record<string, unknown>; offers: unknown[] }>(
        `/offers/exclusive-zones/${slug}/offers`,
        { limit }
      );
    } catch (error) {
      logger.error(`[OFFERS API] Error fetching exclusive zone ${slug} offers:`, error);
      throw error;
    }
  }

  /**
   * Get friends' redeemed offers (social proof)
   */
  async getFriendsRedeemed(limit?: number): Promise<ApiResponse<unknown[]>> {
    try {
      return await apiClient.get<unknown[]>('/offers/friends-redeemed', { limit });
    } catch (error) {
      logger.error('[OFFERS API] Error fetching friends redeemed:', error);
      throw error;
    }
  }

  /**
   * Get double cashback campaigns
   */
  async getDoubleCashbackCampaigns(limit?: number): Promise<ApiResponse<unknown[]>> {
    try {
      return await apiClient.get<unknown[]>('/offers/double-cashback', { limit });
    } catch (error) {
      logger.error('[OFFERS API] Error fetching double cashback campaigns:', error);
      throw error;
    }
  }
}

export const bannersApi = new BannersApi();
export default bannersApi;
