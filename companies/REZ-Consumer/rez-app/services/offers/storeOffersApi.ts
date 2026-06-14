// @ts-nocheck
/**
 * Offers Store API
 * Split from realOffersApi.ts for better modularity
 */

import apiClient, { ApiResponse } from '@/services/apiClient';
import { logger } from '@/utils/logger';
import { colors } from '@/constants/theme';
import type { Offer, StoreOffersData, StoreOffersParams, PaginatedResponse } from './types';

// Mock deal type
interface MockDeal {
  id: string;
  storeId: string;
  title: string;
  description: string;
  type: 'walk_in' | 'online' | 'combo' | 'cashback' | 'flash_sale';
  discountType: 'percentage' | 'fixed' | 'bogo';
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  terms: string[];
  applicableProducts: string[];
  isActive: boolean;
  isFeatured: boolean;
  category: string;
  priority: number;
  usageLimit: number;
  usedCount: number;
  badge: {
    text: string;
    backgroundColor: string;
    textColor: string;
  };
}

export class StoreOffersApi {
  /**
   * Get store-specific deals/offers (Walk-in deals)
   */
  async getStoreOffers(
    storeId: string,
    params?: StoreOffersParams
  ): Promise<ApiResponse<StoreOffersData>> {
    try {
      const queryParams: Record<string, string | number | boolean | undefined | null> = {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      };

      if (params?.active !== undefined) {
        queryParams.active = params.active;
      } else {
        queryParams.active = true;
      }

      const response = await apiClient.get<PaginatedResponse<Offer>>(
        `/offers/store/${storeId}`,
        queryParams
      );

      if (response.success && response.data) {
        const offers = Array.isArray(response.data) ? response.data : [];
        const pagination = (response as Record<string, unknown>).meta?.pagination ||
          (response as Record<string, unknown>).pagination || {};

        return {
          ...response,
          data: {
            deals: offers,
            totalCount: (pagination as Record<string, unknown>).total as number || offers.length,
            storeInfo: { id: storeId },
          },
        };
      }

      const mockDeals = this.generateMockStoreDeals(storeId, params) as unknown as Offer[];
      return {
        success: true,
        data: {
          deals: mockDeals,
          totalCount: mockDeals.length,
          storeInfo: { id: storeId, name: 'Store Name' },
        },
        message: 'Store deals retrieved successfully (fallback)',
      };
    } catch (error) {
      logger.error(`[OFFERS API] Error fetching store offers for ${storeId}:`, error);
      throw error;
    }
  }

  /**
   * Generate comprehensive mock store deals
   */
  generateMockStoreDeals(
    storeId: string,
    params?: StoreOffersParams
  ): MockDeal[] {
    const allMockDeals: MockDeal[] = [
      {
        id: 'deal-001',
        storeId,
        title: 'Mega Weekend Sale',
        description: 'Get flat 30% off on all products this weekend',
        type: 'walk_in',
        discountType: 'percentage',
        discountValue: 30,
        minPurchase: 2000,
        maxDiscount: 1500,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Valid on weekends only', 'Not applicable on sale items', 'Cannot be combined with other offers'],
        applicableProducts: ['Fashion', 'Electronics', 'Home'],
        isActive: true,
        isFeatured: true,
        category: 'instant-discount',
        priority: 1,
        usageLimit: 100,
        usedCount: 23,
        badge: { text: 'Save 30%', backgroundColor: '#E5E7EB', textColor: '#374151' },
      },
      {
        id: 'deal-002',
        storeId,
        title: 'Flash Sale - Limited Time',
        description: 'Grab amazing deals before they expire',
        type: 'flash_sale',
        discountType: 'percentage',
        discountValue: 50,
        minPurchase: 1500,
        maxDiscount: 2000,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Valid for 48 hours only', 'While stocks last', 'Limited to 5 items per customer'],
        applicableProducts: ['Fashion', 'Accessories'],
        isActive: true,
        isFeatured: true,
        category: 'seasonal',
        priority: 2,
        usageLimit: 50,
        usedCount: 31,
        badge: { text: '50% OFF', backgroundColor: '#FEE2E2', textColor: '#991B1B' },
      },
      {
        id: 'deal-003',
        storeId,
        title: 'Buy 2 Get 1 Free',
        description: 'Purchase 2 items and get the lowest priced item absolutely free',
        type: 'combo',
        discountType: 'bogo',
        discountValue: 0,
        minPurchase: 3000,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Lowest priced item will be free', 'Valid on marked products only', 'Maximum 3 free items per transaction'],
        applicableProducts: ['Fashion', 'Personal Care'],
        isActive: true,
        isFeatured: false,
        category: 'buy-one-get-one',
        priority: 3,
        usageLimit: 75,
        usedCount: 12,
        badge: { text: 'BOGO', backgroundColor: '#FEF3C7', textColor: '#92400E' },
      },
      {
        id: 'deal-004',
        storeId,
        title: 'Cashback Bonanza',
        description: 'Earn 15% cashback on all purchases',
        type: 'cashback',
        discountType: 'percentage',
        discountValue: 15,
        minPurchase: 1000,
        maxDiscount: 500,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Cashback credited within 24 hours', 'Valid on all payment methods', 'Maximum 2 transactions per day'],
        applicableProducts: ['All Categories'],
        isActive: true,
        isFeatured: true,
        category: 'cashback',
        priority: 4,
        usageLimit: 200,
        usedCount: 87,
        badge: { text: '15% Cashback', backgroundColor: '#D1FAE5', textColor: '#065F46' },
      },
      {
        id: 'deal-005',
        storeId,
        title: 'First Time Customer Special',
        description: 'Exclusive 25% discount for new customers',
        type: 'walk_in',
        discountType: 'percentage',
        discountValue: 25,
        minPurchase: 1500,
        maxDiscount: 1000,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Valid for first-time customers only', 'ID verification required', 'One-time use only'],
        applicableProducts: ['Fashion', 'Electronics', 'Home'],
        isActive: true,
        isFeatured: true,
        category: 'first-time',
        priority: 5,
        usageLimit: 150,
        usedCount: 45,
        badge: { text: 'New Customer', backgroundColor: '#DBEAFE', textColor: '#1E40AF' },
      },
      {
        id: 'deal-006',
        storeId,
        title: 'VIP Member Exclusive',
        description: 'Special discount for our loyal VIP members',
        type: 'walk_in',
        discountType: 'percentage',
        discountValue: 20,
        minPurchase: 5000,
        maxDiscount: 2500,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Valid for VIP members only', 'Show membership card', 'Earn double loyalty points'],
        applicableProducts: ['All Categories'],
        isActive: true,
        isFeatured: false,
        category: 'loyalty',
        priority: 6,
        usageLimit: 300,
        usedCount: 156,
        badge: { text: 'VIP 20%', backgroundColor: '#F3E8FF', textColor: '#7C3AED' },
      },
      {
        id: 'deal-007',
        storeId,
        title: 'Clearance Mega Sale',
        description: 'Massive discounts on clearance items',
        type: 'walk_in',
        discountType: 'percentage',
        discountValue: 60,
        minPurchase: 500,
        maxDiscount: 3000,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Clearance items only', 'No returns or exchanges', 'While stocks last'],
        applicableProducts: ['Fashion', 'Home'],
        isActive: true,
        isFeatured: true,
        category: 'clearance',
        priority: 7,
        usageLimit: 100,
        usedCount: 67,
        badge: { text: '60% OFF', backgroundColor: '#FEE2E2', textColor: '#991B1B' },
      },
      {
        id: 'deal-008',
        storeId,
        title: 'Student Discount',
        description: 'Special offer for students with valid ID',
        type: 'walk_in',
        discountType: 'percentage',
        discountValue: 18,
        minPurchase: 1200,
        maxDiscount: 800,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Valid student ID required', 'Available all days', 'Not valid on sale items'],
        applicableProducts: ['Fashion', 'Electronics', 'Books'],
        isActive: true,
        isFeatured: false,
        category: 'instant-discount',
        priority: 8,
        usageLimit: 250,
        usedCount: 98,
        badge: { text: 'Student 18%', backgroundColor: '#E0E7FF', textColor: '#3730A3' },
      },
      {
        id: 'deal-009',
        storeId,
        title: 'Online Exclusive Deal',
        description: 'Order online and get extra 10% off',
        type: 'online',
        discountType: 'percentage',
        discountValue: 10,
        minPurchase: 800,
        maxDiscount: 400,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Online orders only', 'Free home delivery', 'Prepaid orders only'],
        applicableProducts: ['All Categories'],
        isActive: true,
        isFeatured: false,
        category: 'instant-discount',
        priority: 9,
        usageLimit: 500,
        usedCount: 234,
        badge: { text: 'Online 10%', backgroundColor: '#E0F2FE', textColor: '#075985' },
      },
      {
        id: 'deal-010',
        storeId,
        title: 'Festive Season Offer',
        description: 'Celebrate with amazing festive discounts',
        type: 'walk_in',
        discountType: 'percentage',
        discountValue: 35,
        minPurchase: 3500,
        maxDiscount: 2000,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Valid during festive season', 'Special gift with purchase', 'Limited period offer'],
        applicableProducts: ['Fashion', 'Jewelry', 'Home Decor'],
        isActive: true,
        isFeatured: true,
        category: 'seasonal',
        priority: 10,
        usageLimit: 120,
        usedCount: 54,
        badge: { text: 'Festive 35%', backgroundColor: '#FED7AA', textColor: '#9A3412' },
      },
      {
        id: 'deal-011',
        storeId,
        title: 'Combo Deal Special',
        description: 'Save more when you buy in combo',
        type: 'combo',
        discountType: 'percentage',
        discountValue: 25,
        minPurchase: 2500,
        maxDiscount: 1200,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Buy 3 products', 'Get 25% off on total', 'Selected products only'],
        applicableProducts: ['Fashion', 'Accessories', 'Personal Care'],
        isActive: true,
        isFeatured: false,
        category: 'buy-one-get-one',
        priority: 11,
        usageLimit: 80,
        usedCount: 34,
        badge: { text: 'Combo 25%', backgroundColor: '#FEF3C7', textColor: '#78350F' },
      },
      {
        id: 'deal-012',
        storeId,
        title: 'Early Bird Discount',
        description: 'Shop before 12 PM and get extra discount',
        type: 'walk_in',
        discountType: 'percentage',
        discountValue: 12,
        minPurchase: 1000,
        maxDiscount: 600,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Valid before 12 PM only', 'All days of the week', 'Show this offer at billing'],
        applicableProducts: ['All Categories'],
        isActive: true,
        isFeatured: false,
        category: 'instant-discount',
        priority: 12,
        usageLimit: 180,
        usedCount: 89,
        badge: { text: 'Early Bird', backgroundColor: '#FEF9C3', textColor: '#713F12' },
      },
      {
        id: 'deal-013',
        storeId,
        title: 'Birthday Month Special',
        description: 'Celebrate your birthday month with extra savings',
        type: 'walk_in',
        discountType: 'percentage',
        discountValue: 22,
        minPurchase: 2000,
        maxDiscount: 1100,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Valid ID required', 'Valid throughout birthday month', 'One-time use per year'],
        applicableProducts: ['All Categories'],
        isActive: true,
        isFeatured: true,
        category: 'loyalty',
        priority: 13,
        usageLimit: 400,
        usedCount: 167,
        badge: { text: 'Birthday 22%', backgroundColor: '#FCE7F3', textColor: '#9F1239' },
      },
      {
        id: 'deal-014',
        storeId,
        title: 'Senior Citizen Discount',
        description: 'Special discount for senior citizens',
        type: 'walk_in',
        discountType: 'percentage',
        discountValue: 15,
        minPurchase: 800,
        maxDiscount: 700,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Age 60+ required', 'Valid ID proof needed', 'Available all days'],
        applicableProducts: ['All Categories'],
        isActive: true,
        isFeatured: false,
        category: 'instant-discount',
        priority: 14,
        usageLimit: 300,
        usedCount: 134,
        badge: { text: 'Senior 15%', backgroundColor: '#E0E7FF', textColor: '#4338CA' },
      },
      {
        id: 'deal-015',
        storeId,
        title: 'Referral Bonus',
        description: 'Refer a friend and both get discount',
        type: 'cashback',
        discountType: 'fixed',
        discountValue: 500,
        minPurchase: 2500,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Both referrer and referee get bonus', 'Valid on first purchase of referee', 'No maximum limit'],
        applicableProducts: ['All Categories'],
        isActive: true,
        isFeatured: true,
        category: 'cashback',
        priority: 15,
        usageLimit: 1000,
        usedCount: 312,
        badge: { text: 'Refer & Earn', backgroundColor: '#D1FAE5', textColor: '#064E3B' },
      },
      {
        id: 'deal-016',
        storeId,
        title: 'Midnight Sale',
        description: 'Exclusive deals available only at midnight',
        type: 'flash_sale',
        discountType: 'percentage',
        discountValue: 40,
        minPurchase: 2000,
        maxDiscount: 1800,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Valid between 12 AM to 2 AM only', 'Limited quantity', 'First come first serve'],
        applicableProducts: ['Electronics', 'Fashion'],
        isActive: true,
        isFeatured: true,
        category: 'seasonal',
        priority: 16,
        usageLimit: 60,
        usedCount: 41,
        badge: { text: 'Midnight 40%', backgroundColor: '#1F2937', textColor: '#F9FAFB' },
      },
      {
        id: 'deal-017',
        storeId,
        title: 'Bulk Purchase Discount',
        description: 'Buy more, save more with bulk discounts',
        type: 'walk_in',
        discountType: 'percentage',
        discountValue: 28,
        minPurchase: 10000,
        maxDiscount: 5000,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Minimum 10 items required', 'Bulk orders only', 'Prior intimation preferred'],
        applicableProducts: ['All Categories'],
        isActive: true,
        isFeatured: false,
        category: 'instant-discount',
        priority: 17,
        usageLimit: 40,
        usedCount: 18,
        badge: { text: 'Bulk 28%', backgroundColor: '#E0E7FF', textColor: '#3730A3' },
      },
      {
        id: 'deal-018',
        storeId,
        title: 'App Exclusive Deal',
        description: 'Download our app and get instant discount',
        type: 'online',
        discountType: 'percentage',
        discountValue: 20,
        minPurchase: 1500,
        maxDiscount: 1000,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Valid for app users only', 'One-time offer', 'Prepaid orders preferred'],
        applicableProducts: ['All Categories'],
        isActive: true,
        isFeatured: true,
        category: 'instant-discount',
        priority: 18,
        usageLimit: 200,
        usedCount: 127,
        badge: { text: 'App 20%', backgroundColor: '#DBEAFE', textColor: '#1E40AF' },
      },
      {
        id: 'deal-019',
        storeId,
        title: 'Weekend Flash Deal',
        description: 'Super saver weekend deals',
        type: 'flash_sale',
        discountType: 'percentage',
        discountValue: 45,
        minPurchase: 3000,
        maxDiscount: 2200,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Weekend only', 'Saturday and Sunday', 'Limited stock available'],
        applicableProducts: ['Fashion', 'Home', 'Electronics'],
        isActive: true,
        isFeatured: true,
        category: 'seasonal',
        priority: 19,
        usageLimit: 90,
        usedCount: 62,
        badge: { text: 'Weekend 45%', backgroundColor: '#FEE2E2', textColor: '#7F1D1D' },
      },
      {
        id: 'deal-020',
        storeId,
        title: 'Loyalty Points 2X',
        description: 'Earn double loyalty points on all purchases',
        type: 'cashback',
        discountType: 'percentage',
        discountValue: 10,
        minPurchase: 1000,
        maxDiscount: 500,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Loyalty members only', 'Points credited instantly', 'Valid on all purchases'],
        applicableProducts: ['All Categories'],
        isActive: true,
        isFeatured: false,
        category: 'loyalty',
        priority: 20,
        usageLimit: 400,
        usedCount: 245,
        badge: { text: '2X Points', backgroundColor: '#F3E8FF', textColor: '#6B21A8' },
      },
    ];

    let filteredDeals = allMockDeals;

    if (params?.type && params.type !== 'all') {
      filteredDeals = filteredDeals.filter(deal => deal.type === params.type);
    }

    if (params?.category) {
      filteredDeals = filteredDeals.filter(deal => deal.category === params.category);
    }

    if (params?.active !== undefined) {
      filteredDeals = filteredDeals.filter(deal => deal.isActive === params.active);
    }

    if (params?.featured !== undefined) {
      filteredDeals = filteredDeals.filter(deal => deal.isFeatured === params.featured);
    }

    if (params?.sortBy) {
      switch (params.sortBy) {
        case 'priority':
          filteredDeals.sort((a, b) => a.priority - b.priority);
          break;
        case 'discount':
          filteredDeals.sort((a, b) => b.discountValue - a.discountValue);
          break;
        case 'expiry':
          filteredDeals.sort((a, b) => new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime());
          break;
        case 'newest':
          filteredDeals.sort((a, b) => new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime());
          break;
      }
    }

    const limit = params?.limit || 20;
    const page = params?.page || 1;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return filteredDeals.slice(startIndex, endIndex);
  }
}

export const storeOffersApi = new StoreOffersApi();
export default storeOffersApi;
