// Canonical types: @rez/shared-types
// Source of truth: rez-shared/src/types/offer.types.ts

import { apiClient } from './client';
import type { ApiResponse } from '../../types/api';

/**
 * Canonical OfferType enum from rez-shared/src/types/offer.types.ts.
 * Aligns StoreOffer.type with canonical Offer type definition.
 */
export type OfferType = 'cashback' | 'discount' | 'voucher' | 'combo' | 'special' | 'walk_in';

/**
 * Canonical OfferCategory from rez-shared/src/types/offer.types.ts.
 * All 11 categories as defined in OFFER_CATEGORIES constant.
 */
export type OfferCategory =
  | 'mega'
  | 'student'
  | 'new_arrival'
  | 'trending'
  | 'food'
  | 'fashion'
  | 'electronics'
  | 'general'
  | 'entertainment'
  | 'beauty'
  | 'wellness';

export interface StoreOffer {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  category: OfferCategory;
  /**
   * Canonical OfferType enum.
   * All offer types must use these values: cashback | discount | voucher | combo | special | walk_in
   */
  type: OfferType;
  /**
   * Canonical field name: cashbackPercentage (lowercase 'b').
   * Backend model uses this spelling; all frontends must align.
   */
  cashbackPercentage: number;
  originalPrice?: number;
  discountedPrice?: number;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  store: {
    id: string;
    name: string;
    logo?: string;
    rating?: number;
    verified?: boolean;
  };
  validity: {
    startDate: string;
    endDate: string;
    isActive: boolean;
  };
  restrictions: {
    minOrderValue?: number;
    maxDiscountAmount?: number;
    applicableOn?: string[];
    excludedProducts?: string[];
    usageLimitPerUser?: number;
    usageLimit?: number;
  };
  metadata: {
    isNew?: boolean;
    isTrending?: boolean;
    isBestSeller?: boolean;
    isSpecial?: boolean;
    priority: number;
    tags: string[];
    featured?: boolean;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferRequest {
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  /**
   * Canonical OfferCategory from rez-shared.
   * All 11 categories: mega, student, new_arrival, trending, food, fashion,
   * electronics, general, entertainment, beauty, wellness
   */
  category: OfferCategory;
  /**
   * Canonical OfferType from rez-shared.
   * Valid values: cashback | discount | voucher | combo | special | walk_in
   */
  type: OfferType;
  /**
   * Canonical field name: cashbackPercentage (lowercase 'b').
   * Must match field name in backend Offer model exactly.
   */
  cashbackPercentage: number;
  originalPrice?: number;
  discountedPrice?: number;
  storeId: string;
  validity: {
    startDate: string;
    endDate: string;
    // FL-19 NOTE: isActive is always sent as true from the merchant UI. Draft/inactive
    // offer creation is not yet exposed to merchants — all offers go live immediately upon
    // creation (pending admin approval). There is no "save as draft" concept for merchant
    // offers yet. Once the UI supports it, pass isActive: false to create a draft offer
    // (backend will set status: 'pending_approval' and admins can approve it explicitly).
    isActive: boolean;
  };
  restrictions?: {
    minOrderValue?: number;
    maxDiscountAmount?: number;
    applicableOn?: string[];
    excludedProducts?: string[];
    usageLimitPerUser?: number;
    usageLimit?: number;
  };
  metadata?: {
    isNew?: boolean;
    isTrending?: boolean;
    isBestSeller?: boolean;
    isSpecial?: boolean;
    priority?: number;
    tags?: string[];
    featured?: boolean;
  };
  timeWindow?: {
    startHour: number;
    endHour: number;
    activeDays?: number[];
  };
}

// ApiResponse imported from rez-shared via client.ts
export type { ApiResponse } from './client';

class OffersService {
  // Get all offers for a store
  async getStoreOffers(
    storeId: string,
    params?: { page?: number; limit?: number }
  ): Promise<
    ApiResponse<{
      deals: StoreOffer[];
      pagination?: { page: number; pages: number; total: number };
    }>
  > {
    try {
      const query = new URLSearchParams({ store: storeId });
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      const data = await apiClient.get<unknown>(`merchant/offers?${query.toString()}`);

      return {
        success: true,
        data: {
          deals: data.data?.items || data.data || [],
          pagination: data.data?.pagination,
        },
      };
    } catch (error) {
      if (__DEV__) console.error('[OFFERS SERVICE] Error fetching store offers:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch store offers',
        error: error.message,
      };
    }
  }

  // Create a new offer
  async createOffer(offerData: CreateOfferRequest): Promise<ApiResponse<StoreOffer>> {
    try {
      const data = await apiClient.post<StoreOffer>('merchant/offers', offerData);

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      if (__DEV__) console.error('[OFFERS SERVICE] Error creating offer:', error);
      return {
        success: false,
        message: error.message || 'Failed to create offer',
        error: error.message,
      };
    }
  }

  // Update an offer
  async updateOffer(
    offerId: string,
    offerData: Partial<CreateOfferRequest>
  ): Promise<ApiResponse<StoreOffer>> {
    try {
      const data = await apiClient.put<StoreOffer>(`merchant/offers/${offerId}`, offerData);

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      if (__DEV__) console.error('[OFFERS SERVICE] Error updating offer:', error);
      return {
        success: false,
        message: error.message || 'Failed to update offer',
        error: error.message,
      };
    }
  }

  // Delete an offer
  async deleteOffer(offerId: string): Promise<ApiResponse<void>> {
    try {
      const data = await apiClient.delete(`merchant/offers/${offerId}`);

      return {
        success: true,
        message: data.message || 'Offer deleted successfully',
      };
    } catch (error) {
      if (__DEV__) console.error('[OFFERS SERVICE] Error deleting offer:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete offer',
        error: error.message,
      };
    }
  }

  // Get a single offer by ID
  async getOfferById(offerId: string): Promise<ApiResponse<StoreOffer>> {
    try {
      const data = await apiClient.get<StoreOffer>(`merchant/offers/${offerId}`);

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      if (__DEV__) console.error('[OFFERS SERVICE] Error fetching offer:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch offer',
        error: error.message,
      };
    }
  }
}

export const offersService = new OffersService();
