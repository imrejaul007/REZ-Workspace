/**
 * Offers API Module
 * Re-exports from split modules for backward compatibility
 */

// Main class-based exports
export { offersApi, OffersApi } from './offersApi';
export { categoriesApi, CategoriesApi } from './categoriesApi';
export { bannersApi, BannersApi } from './bannersApi';
export { redemptionsApi, RedemptionsApi } from './redemptionsApi';
export { storeOffersApi, StoreOffersApi } from './storeOffersApi';

// Types
export type * from './types';

// Backward-compatible singleton export (same as realOffersApi)
import { OffersApi } from './offersApi';
import { CategoriesApi } from './categoriesApi';
import { BannersApi } from './bannersApi';
import { RedemptionsApi } from './redemptionsApi';
import { StoreOffersApi } from './storeOffersApi';
import apiClient, { ApiResponse } from '@/services/apiClient';
import { colors } from '@/constants/theme';
import { logger } from '@/utils/logger';
import type {
  Offer,
  OfferCategory,
  HeroBanner,
  OffersPageData,
  PaginatedResponse,
  StoreOffersData,
  ZoneEligibility,
  ZoneVerificationResult,
  ZoneVerificationStatus,
  ValidationResult,
  UseRedemptionResult,
  HomepageDealsSection,
  GetOffersParams,
  SearchOffersParams,
  NearbyOffersParams,
  StoreOffersParams,
  CategoryOffersParams,
  VoucherDetails,
} from './types';

/**
 * Combined Offers API
 * Main entry point for offers functionality
 * Combines all API classes into a single API for backward compatibility
 */
class RealOffersApi {
  private offers = new OffersApi();
  private categories = new CategoriesApi();
  private banners = new BannersApi();
  private redemptions = new RedemptionsApi();
  private store = new StoreOffersApi();

  // Pass-through methods for OffersApi
  async getOffersPageData(params?: { lat?: number; lng?: number }): Promise<ApiResponse<OffersPageData>> {
    return this.offers.getOffersPageData(params);
  }

  async getOffers(params?: GetOffersParams): Promise<ApiResponse<PaginatedResponse<Offer> | Offer[]>> {
    return this.offers.getOffers(params);
  }

  async getMegaOffers(limit?: number): Promise<ApiResponse<Offer[]>> {
    return this.offers.getMegaOffers(limit);
  }

  async getStudentOffers(limit?: number): Promise<ApiResponse<Offer[]>> {
    return this.offers.getStudentOffers(limit);
  }

  async getNewArrivalOffers(limit?: number): Promise<ApiResponse<Offer[]>> {
    return this.offers.getNewArrivalOffers(limit);
  }

  async getTrendingOffers(limit?: number): Promise<ApiResponse<Offer[]>> {
    return this.offers.getTrendingOffers(limit);
  }

  async getNearbyOffers(params: NearbyOffersParams): Promise<ApiResponse<Offer[]>> {
    return this.offers.getNearbyOffers(params);
  }

  async getOfferById(id: string): Promise<ApiResponse<Offer>> {
    return this.offers.getOfferById(id);
  }

  async searchOffers(params: SearchOffersParams): Promise<ApiResponse<PaginatedResponse<Offer>>> {
    return this.offers.searchOffers(params);
  }

  async toggleOfferLike(id: string): Promise<ApiResponse<{ isLiked: boolean; likesCount: number }>> {
    return this.offers.toggleOfferLike(id);
  }

  async shareOffer(id: string, params?: { platform?: string; message?: string }): Promise<ApiResponse<{ success: boolean }>> {
    return this.offers.shareOffer(id, params);
  }

  async trackOfferView(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.offers.trackOfferView(id);
  }

  async trackOfferClick(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.offers.trackOfferClick(id);
  }

  async redeemOffer(id: string, redemptionType: 'online' | 'instore' = 'online'): Promise<ApiResponse<{ offer: Offer; voucher: VoucherDetails }>> {
    return this.offers.redeemOffer(id, redemptionType);
  }

  // Pass-through methods for CategoriesApi
  async getOfferCategories(): Promise<ApiResponse<OfferCategory[]>> {
    return this.categories.getOfferCategories();
  }

  async getOfferCategoryBySlug(slug: string): Promise<ApiResponse<OfferCategory>> {
    return this.categories.getOfferCategoryBySlug(slug);
  }

  async getOffersByCategorySlug(slug: string, params?: CategoryOffersParams): Promise<ApiResponse<PaginatedResponse<Offer>>> {
    return this.categories.getOffersByCategorySlug(slug, params);
  }

  async getHotspots(params?: { lat?: number; lng?: number; limit?: number }): Promise<ApiResponse<unknown[]>> {
    return this.categories.getHotspots(params);
  }

  async getHotspotOffers(slug: string, limit?: number): Promise<ApiResponse<{ hotspot: unknown; offers: Offer[] }>> {
    return this.categories.getHotspotOffers(slug, limit);
  }

  async getBOGOOffers(params?: { bogoType?: 'buy1get1' | 'buy2get1' | 'buy1get50' | 'buy2get50'; limit?: number }): Promise<ApiResponse<Offer[]>> {
    return this.categories.getBOGOOffers(params);
  }

  async getSaleOffers(params?: { saleTag?: 'clearance' | 'sale' | 'last_pieces' | 'mega_sale'; limit?: number }): Promise<ApiResponse<Offer[]>> {
    return this.categories.getSaleOffers(params);
  }

  async getFreeDeliveryOffers(limit?: number): Promise<ApiResponse<Offer[]>> {
    return this.categories.getFreeDeliveryOffers(limit);
  }

  async getBankOffers(params?: { cardType?: 'credit' | 'debit' | 'wallet' | 'upi' | 'bnpl'; limit?: number }): Promise<ApiResponse<unknown[]>> {
    return this.categories.getBankOffers(params);
  }

  async getSpecialProfiles(): Promise<ApiResponse<unknown[]>> {
    return this.categories.getSpecialProfiles();
  }

  async getSpecialProfileOffers(slug: string, limit?: number): Promise<ApiResponse<{ profile: unknown; offers: Offer[] }>> {
    return this.categories.getSpecialProfileOffers(slug, limit);
  }

  // Pass-through methods for BannersApi
  async getHeroBanners(params?: { page?: string; position?: string }): Promise<ApiResponse<HeroBanner[]>> {
    return this.banners.getHeroBanners(params);
  }

  async trackHeroBannerView(id: string, params?: { source?: string; device?: string; location?: { type: 'Point'; coordinates: [number, number] } }): Promise<ApiResponse<{ success: boolean }>> {
    return this.banners.trackHeroBannerView(id, params);
  }

  async trackHeroBannerClick(id: string, params?: { source?: string; device?: string; location?: { type: 'Point'; coordinates: [number, number] } }): Promise<ApiResponse<{ success: boolean }>> {
    return this.banners.trackHeroBannerClick(id, params);
  }

  async getHomepageDealsSection(region?: string): Promise<ApiResponse<HomepageDealsSection | null>> {
    return this.banners.getHomepageDealsSection(region);
  }

  async getExclusiveZones(): Promise<ApiResponse<Record<string, unknown>[]>> {
    return this.banners.getExclusiveZones();
  }

  async getExclusiveZoneOffers(slug: string, limit?: number): Promise<ApiResponse<{ zone: Record<string, unknown>; offers: unknown[] }>> {
    return this.banners.getExclusiveZoneOffers(slug, limit);
  }

  async getFriendsRedeemed(limit?: number): Promise<ApiResponse<unknown[]>> {
    return this.banners.getFriendsRedeemed(limit);
  }

  async getDoubleCashbackCampaigns(limit?: number): Promise<ApiResponse<unknown[]>> {
    return this.banners.getDoubleCashbackCampaigns(limit);
  }

  // Pass-through methods for RedemptionsApi
  async getUserFavoriteOffers(params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Offer>>> {
    return this.redemptions.getUserFavoriteOffers(params);
  }

  async addOfferToFavorites(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.redemptions.addOfferToFavorites(id);
  }

  async removeOfferFromFavorites(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.redemptions.removeOfferFromFavorites(id);
  }

  async getUserRedemptions(params?: { status?: string; page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Offer>>> {
    return this.redemptions.getUserRedemptions(params);
  }

  async validateRedemptionCode(code: string): Promise<ApiResponse<ValidationResult>> {
    return this.redemptions.validateRedemptionCode(code);
  }

  async markRedemptionAsUsed(redemptionId: string, params: { orderAmount: number; orderId?: string; storeId?: string }): Promise<ApiResponse<UseRedemptionResult>> {
    return this.redemptions.markRedemptionAsUsed(redemptionId, params);
  }

  async getRedemptionById(redemptionId: string): Promise<ApiResponse<Record<string, unknown>>> {
    return this.redemptions.getRedemptionById(redemptionId);
  }

  // Pass-through methods for StoreOffersApi
  async getStoreOffers(storeId: string, params?: StoreOffersParams): Promise<ApiResponse<StoreOffersData>> {
    return this.store.getStoreOffers(storeId, params);
  }

  generateMockStoreDeals(storeId: string, params?: StoreOffersParams) {
    return this.store.generateMockStoreDeals(storeId, params);
  }
}

// Singleton instance for backward compatibility
const realOffersApi = new RealOffersApi();
export default realOffersApi;
