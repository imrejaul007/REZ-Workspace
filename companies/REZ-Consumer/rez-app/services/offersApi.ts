// @ts-nocheck
/**
 * @deprecated Superseded by realOffersApi.ts for most use cases.
 * Only hooks/useStorePromotions.ts still imports this file (via getStorePromotions,
 * which has no equivalent in realOffersApi yet). Migrate getStorePromotions to
 * realOffersApi.ts and delete this file once done.
 * Marked: 2026-04-11
 */

// Offers API Service
/* eslint-disable @typescript-eslint/no-explicit-unknown */

import uuid from 'react-native-uuid';
// Handles offer operations, search, filtering, favorites, and redemption
// Enhanced with comprehensive error handling, validation, retry logic, and logging

import {
  ApiResponse,
  PaginatedResponse,
  GetOffersRequest,
  SearchOffersRequest,
  GetOfferDetailsRequest,
  AddToFavoritesRequest,
  RemoveFromFavoritesRequest,
  GetUserFavoritesRequest,
  TrackOfferViewRequest,
  RedeemOfferRequest,
  OffersApiEndpoints,
  ApiConfig,
  DetailedApiError,
  ApiErrorCode
} from '@/types/api.types';
import { Offer, OfferCategory } from '@/types/offers.types';
import { offersPageData } from '@/data/offersData';
import { withRetry, createErrorResponse, logApiRequest, logApiResponse, StandardApiResponse } from '@/utils/apiUtils';
import mainApiClient from './apiClient';
import { logger } from '@/utils/logger';

// API Configuration
const API_CONFIG: ApiConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL || '',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
  cache: {
    offersCache: {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 100
    },
    categoriesCache: {
      ttl: 30 * 60 * 1000, // 30 minutes
      maxSize: 50
    },
    userCache: {
      ttl: 60 * 60 * 1000, // 1 hour
      maxSize: 10
    }
  },
  endpoints: {
    // SHOWSTOPPER FIX: baseUrl (from EXPO_PUBLIC_API_BASE_URL via mainApiClient)
    // already ends in `/api`, so endpoints must NOT include a leading `/api`.
    // Previously produced URLs like `/api/api/offers` → 404.
    offers: '/offers',
    categories: '/categories',
    favorites: '/user/favorites',
    search: '/offers/search',
    analytics: '/analytics',
    recommendations: '/recommendations'
  }
};

// Simple in-memory cache implementation
class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  set(key: string, data: T, ttl: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Cache instances
const offersCache = new SimpleCache<ApiResponse<unknown>>(API_CONFIG.cache.offersCache.maxSize);
const categoriesCache = new SimpleCache<ApiResponse<OfferCategory[]>>(API_CONFIG.cache.categoriesCache.maxSize);
const userCache = new SimpleCache<ApiResponse<unknown>>(API_CONFIG.cache.userCache.maxSize);

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates offer data structure
 */
function validateOffer(offer): boolean {
  if (!offer || typeof offer !== 'object') {
    logger.warn('[OFFERS API] Invalid offer data: not an object');
    return false;
  }

  if (!offer.id || typeof offer.id !== 'string') {
    logger.warn('[OFFERS API] Offer missing valid id field');
    return false;
  }

  if (!offer.title || typeof offer.title !== 'string') {
    logger.warn('[OFFERS API] Offer missing valid title field');
    return false;
  }

  if (typeof offer.cashbackPercentage !== 'number' || offer.cashbackPercentage < 0) {
    logger.warn('[OFFERS API] Offer has invalid cashback percentage');
    return false;
  }

  if (!offer.category || typeof offer.category !== 'string') {
    logger.warn('[OFFERS API] Offer missing category');
    return false;
  }

  if (!offer.store || typeof offer.store !== 'object' || !offer.store.name) {
    logger.warn('[OFFERS API] Offer missing valid store information');
    return false;
  }

  return true;
}

/**
 * Validates and filters array of offers
 * Returns only valid offers and logs warnings for invalid ones
 */
function validateOfferArray(offers: unknown[]): Offer[] {
  if (!Array.isArray(offers)) {
    logger.warn('[OFFERS API] Expected array of offers, got:', typeof offers);
    return [];
  }

  const validOffers: Offer[] = [];
  let invalidCount = 0;

  for (const offer of offers) {
    if (validateOffer(offer)) {
      validOffers.push(offer);
    } else {
      invalidCount++;
    }
  }

  if (invalidCount > 0) {
    logger.warn(`[OFFERS API] Filtered out ${invalidCount} invalid offers from response`);
  }

  return validOffers;
}

/**
 * Validates category data structure
 */
function validateCategory(category): boolean {
  if (!category || typeof category !== 'object') {
    return false;
  }

  if (!category.id || !category.name) {
    logger.warn('[OFFERS API] Category missing required fields');
    return false;
  }

  return true;
}

/**
 * Validates pagination parameters
 */
function validatePaginationParams(page?: number, pageSize?: number): { valid: boolean; error?: string } {
  if (page !== undefined) {
    if (typeof page !== 'number' || page < 1) {
      return { valid: false, error: 'Page number must be a positive integer' };
    }
  }

  if (pageSize !== undefined) {
    if (typeof pageSize !== 'number' || pageSize < 1 || pageSize > 100) {
      return { valid: false, error: 'Page size must be between 1 and 100' };
    }
  }

  return { valid: true };
}

/**
 * Validates search query
 */
function validateSearchQuery(query: string): { valid: boolean; error?: string } {
  if (!query || typeof query !== 'string') {
    return { valid: false, error: 'Search query is required' };
  }

  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    return { valid: false, error: 'Search query must be at least 2 characters' };
  }

  if (trimmedQuery.length > 200) {
    return { valid: false, error: 'Search query too long (max 200 characters)' };
  }

  return { valid: true };
}

/**
 * Validates filter parameters
 */
function validateFilters(filters?): { valid: boolean; error?: string } {
  if (!filters) {
    return { valid: true };
  }

  if (typeof filters !== 'object') {
    return { valid: false, error: 'Filters must be an object' };
  }

  // Validate minCashBack if provided
  if (filters.minCashBack !== undefined) {
    if (typeof filters.minCashBack !== 'number' || filters.minCashBack < 0 || filters.minCashBack > 100) {
      return { valid: false, error: 'Minimum cashback must be between 0 and 100' };
    }
  }

  // Validate priceRange if provided
  if (filters.priceRange) {
    if (typeof filters.priceRange !== 'object') {
      return { valid: false, error: 'Price range must be an object' };
    }

    const { min, max } = filters.priceRange;

    if (min !== undefined && (typeof min !== 'number' || min < 0)) {
      return { valid: false, error: 'Minimum price must be a non-negative number' };
    }

    if (max !== undefined && (typeof max !== 'number' || max < 0)) {
      return { valid: false, error: 'Maximum price must be a non-negative number' };
    }

    if (min !== undefined && max !== undefined && min > max) {
      return { valid: false, error: 'Minimum price cannot be greater than maximum price' };
    }
  }

  return { valid: true };
}

/**
 * Validates sort parameters
 */
function validateSortBy(sortBy?: string): { valid: boolean; error?: string } {
  if (!sortBy) {
    return { valid: true };
  }

  const validSortOptions = ['cashback', 'price', 'newest', 'distance', 'rating', 'popularity'];

  if (!validSortOptions.includes(sortBy)) {
    return {
      valid: false,
      error: `Invalid sort option. Must be one of: ${validSortOptions.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Validates offer ID
 */
function validateOfferId(offerId: string): { valid: boolean; error?: string } {
  if (!offerId || typeof offerId !== 'string') {
    return { valid: false, error: 'Offer ID is required' };
  }

  if (offerId.trim().length === 0) {
    return { valid: false, error: 'Offer ID cannot be empty' };
  }

  return { valid: true };
}

// HTTP Client with region support
class OffersHttpClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    // Get current region from main apiClient for region filtering
    const currentRegion = mainApiClient.getRegion();

    // C-C02 FIX: Get auth token from mainApiClient and include in header.
    // Previously, OffersHttpClient sent zero Authorization headers, so all
    // authenticated requests silently returned 401.
    const authToken = mainApiClient.getAuthToken();

    const doFetch = async (token: string | null): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Rez-Region': currentRegion,
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: { ...headers, ...options.headers },
        });
        clearTimeout(timeoutId);
        // C-C02 FIX: Detect 401 and retry after token refresh.
        // Previously, no retry logic meant authenticated requests silently failed on 401.
        if (response.status === 401 && token) {
          const refreshed = await mainApiClient.handleTokenRefresh();
          if (refreshed) {
            const newToken = mainApiClient.getAuthToken();
            if (newToken && newToken !== token) {
              const newHeaders = { ...headers, 'Authorization': `Bearer ${newToken}` };
              const retryRes = await fetch(url, { ...options, headers: { ...newHeaders, ...options.headers } });
              return retryRes;
            }
          }
        }
        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    try {
      const response = await doFetch(authToken);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Handle different types of errors
      let errorCode: ApiErrorCode = 'SERVER_ERROR';
      let message = 'An unexpected error occurred';

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorCode = 'TIMEOUT';
          message = 'Request timed out';
        } else if (error.message.includes('Network')) {
          errorCode = 'NETWORK_ERROR';
          message = 'Network connection failed';
        } else {
          message = error.message;
        }
      }

      throw {
        success: false,
        error: {
          code: errorCode,
          message,
          details: error
        },
        timestamp: new Date().toISOString()
      } as DetailedApiError;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request<T>(url.pathname + url.search);
  }

  async post<T>(endpoint: string, data?): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// API Client instance — derive baseUrl from the main apiClient so both use the
// same URL (respects EXPO_PUBLIC_API_BASE_URL; avoids duplicate localhost fallbacks)
const offersApiClient = new OffersHttpClient({
  ...API_CONFIG,
  baseUrl: mainApiClient.getBaseURL(),
});

// Mock API implementation (for development)
class MockOffersApi implements OffersApiEndpoints {
  private simulateDelay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getOffers(params: GetOffersRequest): Promise<StandardApiResponse<unknown>> {
    const startTime = Date.now();

    try {
      // Validate pagination parameters
      const paginationValidation = validatePaginationParams(params.page, params.pageSize);
      if (!paginationValidation.valid) {
        return createErrorResponse({error: paginationValidation.error, message: paginationValidation.error}) as StandardApiResponse<unknown>;
      }

      // Validate filters
      const filtersValidation = validateFilters(params.filters);
      if (!filtersValidation.valid) {
        return createErrorResponse({error: filtersValidation.error, message: filtersValidation.error}) as StandardApiResponse<unknown>;
      }

      // Validate sort parameter
      const sortValidation = validateSortBy(params.sortBy);
      if (!sortValidation.valid) {
        return createErrorResponse({error: sortValidation.error, message: sortValidation.error}) as StandardApiResponse<unknown>;
      }

      logApiRequest('GET', '/api/offers', params);

      await this.simulateDelay();

      // Check cache first
      const cacheKey = `offers_${JSON.stringify(params)}`;
      const cached = offersCache.get(cacheKey);
      if (cached) {
        logger.debug('[OFFERS API] Returning cached offers');
        logApiResponse('GET', '/api/offers', cached, Date.now() - startTime);
        return cached;
      }

      // Simulate filtering and pagination
      let allOffers = offersPageData.sections.flatMap(section => section.offers);

      // Validate all offers before processing
      allOffers = validateOfferArray(allOffers);

      // Apply category filter
      if (params.category) {
        const categoryLower = params.category.toLowerCase();
        allOffers = allOffers.filter(offer =>
          offer.category.toLowerCase() === categoryLower
        );
      }

      // Apply filters
      if (params.filters) {
        const { minCashBack, priceRange } = params.filters;

        if (minCashBack !== undefined) {
          allOffers = allOffers.filter(offer =>
            offer.cashbackPercentage >= minCashBack
          );
        }

        if (priceRange) {
          allOffers = allOffers.filter(offer => {
            const price = offer.discountedPrice || offer.originalPrice;
            if (!price) return true;

            if (priceRange.min !== undefined && price < priceRange.min) return false;
            if (priceRange.max !== undefined && price > priceRange.max) return false;
            return true;
          });
        }
      }

      // Apply sorting
      if (params.sortBy) {
        switch (params.sortBy as string) {
          case 'cashback':
            allOffers.sort((a, b) => b.cashbackPercentage - a.cashbackPercentage);
            break;
          case 'price':
            allOffers.sort((a, b) => {
              const priceA = a.discountedPrice || a.originalPrice || 0;
              const priceB = b.discountedPrice || b.originalPrice || 0;
              return priceA - priceB;
            });
            break;
          case 'newest':
            allOffers.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
            break;
          case 'rating':
            allOffers.sort((a, b) => (b.store.rating || 0) - (a.store.rating || 0));
            break;
          case 'popularity':
            allOffers.sort((a, b) => (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0));
            break;
        }
      }

      // Pagination
      const page = params.page || 1;
      const pageSize = Math.min(params.pageSize || 20, 100); // Cap at 100
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedOffers = allOffers.slice(startIndex, endIndex);

      const response: ApiResponse<PaginatedResponse<Offer>> = {
        success: true,
        data: {
          items: paginatedOffers,
          totalCount: allOffers.length,
          page,
          pageSize,
          hasNext: endIndex < allOffers.length,
          hasPrevious: page > 1,
        },
        timestamp: new Date().toISOString(),
      };

      // Cache the response
      offersCache.set(cacheKey, response, API_CONFIG.cache.offersCache.ttl);

      logApiResponse('GET', '/api/offers', {
        success: true,
        itemCount: paginatedOffers.length,
        totalCount: allOffers.length,
        page,
      }, Date.now() - startTime);

      return response;
    } catch (error) {
      logger.error('[OFFERS API] Error fetching offers:', error);
      return createErrorResponse(error, 'Failed to load offers. Please try again.') as StandardApiResponse<unknown>;
    }
  }

  async getOfferDetails(params: GetOfferDetailsRequest): Promise<StandardApiResponse<unknown>> {
    const startTime = Date.now();

    try {
      // Validate offer ID
      const offerIdValidation = validateOfferId(params.offerId);
      if (!offerIdValidation.valid) {
        return createErrorResponse({error: offerIdValidation.error, message: offerIdValidation.error}) as StandardApiResponse<unknown>;
      }

      logApiRequest('GET', `/api/offers/${params.offerId}`, { offerId: params.offerId });

      await this.simulateDelay();

      const allOffers = offersPageData.sections.flatMap(section => section.offers);

      // Validate all offers
      const validOffers = validateOfferArray(allOffers);

      const offer = validOffers.find(o => o.id === params.offerId);

      if (!offer) {
        const response = {
          success: false,
          error: 'Offer not found',
          message: 'The requested offer could not be found',
          timestamp: new Date().toISOString(),
        };

        logApiResponse('GET', `/api/offers/${params.offerId}`, response, Date.now() - startTime);
        return response as StandardApiResponse<unknown>;
      }

      // Additional validation on the specific offer
      if (!validateOffer(offer)) {
        const response = {
          success: false,
          error: 'Invalid offer data',
          message: 'The offer data is invalid',
          timestamp: new Date().toISOString(),
        };

        logApiResponse('GET', `/api/offers/${params.offerId}`, response, Date.now() - startTime);
        return response as StandardApiResponse<unknown>;
      }

      const response: ApiResponse<Offer> = {
        success: true,
        data: offer,
        timestamp: new Date().toISOString(),
      };

      logApiResponse('GET', `/api/offers/${params.offerId}`, { success: true }, Date.now() - startTime);

      return response;
    } catch (error) {
      logger.error('[OFFERS API] Error fetching offer details:', error);
      return createErrorResponse(error, 'Failed to load offer details. Please try again.') as StandardApiResponse<unknown>;
    }
  }

  async searchOffers(params: SearchOffersRequest): Promise<StandardApiResponse<unknown>> {
    const startTime = Date.now();

    try {
      // Validate search query
      const queryValidation = validateSearchQuery(params.query);
      if (!queryValidation.valid) {
        return createErrorResponse({error: queryValidation.error, message: queryValidation.error}) as StandardApiResponse<unknown>;
      }

      // Validate pagination
      const paginationValidation = validatePaginationParams(params.page, params.pageSize);
      if (!paginationValidation.valid) {
        return createErrorResponse({error: paginationValidation.error, message: paginationValidation.error}) as StandardApiResponse<unknown>;
      }

      logApiRequest('GET', '/api/offers/search', { query: params.query, page: params.page });

      await this.simulateDelay();

      const allOffers = offersPageData.sections.flatMap(section => section.offers);

      // Validate offers
      const validOffers = validateOfferArray(allOffers);

      const query = params.query.toLowerCase().trim();

      const filteredOffers = validOffers.filter(offer =>
        offer.title?.toLowerCase().includes(query) ||
        (offer.subtitle && offer.subtitle.toLowerCase().includes(query)) ||
        offer.category?.toLowerCase().includes(query) ||
        offer.store?.name?.toLowerCase().includes(query) ||
        (offer.description && offer.description.toLowerCase().includes(query))
      );

      // Pagination
      const page = params.page || 1;
      const pageSize = Math.min(params.pageSize || 20, 100);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedOffers = filteredOffers.slice(startIndex, endIndex);

      const response: ApiResponse<PaginatedResponse<Offer>> = {
        success: true,
        data: {
          items: paginatedOffers,
          totalCount: filteredOffers.length,
          page,
          pageSize,
          hasNext: endIndex < filteredOffers.length,
          hasPrevious: page > 1,
        },
        timestamp: new Date().toISOString(),
      };

      logApiResponse('GET', '/api/offers/search', {
        success: true,
        resultCount: paginatedOffers.length,
        totalCount: filteredOffers.length,
      }, Date.now() - startTime);

      return response;
    } catch (error) {
      logger.error('[OFFERS API] Error searching offers:', error);
      return createErrorResponse(error, 'Failed to search offers. Please try again.') as StandardApiResponse<unknown>;
    }
  }

  async getCategories(): Promise<StandardApiResponse<unknown>> {
    const startTime = Date.now();

    try {
      logApiRequest('GET', '/api/categories');

      await this.simulateDelay();

      // Check cache first
      const cached = categoriesCache.get('categories');
      if (cached) {
        logger.debug('[OFFERS API] Returning cached categories');
        logApiResponse('GET', '/api/categories', cached, Date.now() - startTime);
        return cached;
      }

      const categories = offersPageData.categories;

      // Validate categories
      const validCategories = categories.filter(validateCategory);

      if (validCategories.length < categories.length) {
        logger.warn(`[OFFERS API] Filtered out ${categories.length - validCategories.length} invalid categories`);
      }

      const response: ApiResponse<OfferCategory[]> = {
        success: true,
        data: validCategories,
        timestamp: new Date().toISOString(),
      };

      // Cache the response
      categoriesCache.set('categories', response, API_CONFIG.cache.categoriesCache.ttl);

      logApiResponse('GET', '/api/categories', { success: true, count: validCategories.length }, Date.now() - startTime);

      return response;
    } catch (error) {
      logger.error('[OFFERS API] Error fetching categories:', error);
      return createErrorResponse(error, 'Failed to load categories. Please try again.') as StandardApiResponse<unknown>;
    }
  }

  async getOffersByCategory(categoryId: string, params?: GetOffersRequest): Promise<StandardApiResponse<unknown>> {
    try {
      // Validate category ID
      if (!categoryId || typeof categoryId !== 'string' || categoryId.trim().length === 0) {
        return createErrorResponse({error: 'Category ID is required', message: 'Category ID is required'}) as StandardApiResponse<unknown>;
      }

      const categoryParams = { ...params, category: categoryId };
      return this.getOffers(categoryParams);
    } catch (error) {
      logger.error('[OFFERS API] Error fetching offers by category:', error);
      return createErrorResponse(error, 'Failed to load offers for this category. Please try again.') as StandardApiResponse<unknown>;
    }
  }

  async getUserFavorites(params: GetUserFavoritesRequest): Promise<StandardApiResponse<unknown>> {
    const startTime = Date.now();

    try {
      // Validate pagination
      const paginationValidation = validatePaginationParams(params.page, params.pageSize);
      if (!paginationValidation.valid) {
        return createErrorResponse({error: paginationValidation.error, message: paginationValidation.error}) as StandardApiResponse<unknown>;
      }

      logApiRequest('GET', '/api/user/favorites', params);

      await this.simulateDelay();

      // In a real app, this would fetch from user's favorites
      // For now, return empty favorites
      const response: ApiResponse<PaginatedResponse<Offer>> = {
        success: true,
        data: {
          items: [],
          totalCount: 0,
          page: params.page || 1,
          pageSize: params.pageSize || 20,
          hasNext: false,
          hasPrevious: false,
        },
        timestamp: new Date().toISOString(),
      };

      logApiResponse('GET', '/api/user/favorites', { success: true, count: 0 }, Date.now() - startTime);

      return response;
    } catch (error) {
      logger.error('[OFFERS API] Error fetching user favorites:', error);
      return createErrorResponse(error, 'Failed to load favorites. Please try again.') as StandardApiResponse<unknown>;
    }
  }

  async addToFavorites(params: AddToFavoritesRequest): Promise<StandardApiResponse<unknown>> {
    const startTime = Date.now();

    try {
      // Validate offer ID
      const offerIdValidation = validateOfferId(params.offerId);
      if (!offerIdValidation.valid) {
        return createErrorResponse({error: offerIdValidation.error, message: offerIdValidation.error}) as StandardApiResponse<unknown>;
      }

      logApiRequest('POST', '/api/user/favorites', { offerId: params.offerId });

      await this.simulateDelay();

      const response: ApiResponse<{ success: boolean }> = {
        success: true,
        data: { success: true },
        message: 'Offer added to favorites',
        timestamp: new Date().toISOString(),
      };

      logApiResponse('POST', '/api/user/favorites', response, Date.now() - startTime);

      return response;
    } catch (error) {
      logger.error('[OFFERS API] Error adding to favorites:', error);
      return createErrorResponse(error, 'Failed to add offer to favorites. Please try again.') as StandardApiResponse<unknown>;
    }
  }

  async removeFromFavorites(params: RemoveFromFavoritesRequest): Promise<StandardApiResponse<unknown>> {
    const startTime = Date.now();

    try {
      // Validate offer ID
      const offerIdValidation = validateOfferId(params.offerId);
      if (!offerIdValidation.valid) {
        return createErrorResponse({error: offerIdValidation.error, message: offerIdValidation.error}) as StandardApiResponse<unknown>;
      }

      logApiRequest('DELETE', `/api/user/favorites/${params.offerId}`);

      await this.simulateDelay();

      const response: ApiResponse<{ success: boolean }> = {
        success: true,
        data: { success: true },
        message: 'Offer removed from favorites',
        timestamp: new Date().toISOString(),
      };

      logApiResponse('DELETE', `/api/user/favorites/${params.offerId}`, response, Date.now() - startTime);

      return response;
    } catch (error) {
      logger.error('[OFFERS API] Error removing from favorites:', error);
      return createErrorResponse(error, 'Failed to remove offer from favorites. Please try again.') as StandardApiResponse<unknown>;
    }
  }

  async trackOfferView(params: TrackOfferViewRequest): Promise<StandardApiResponse<unknown>> {
    try {
      // Validate offer ID
      const offerIdValidation = validateOfferId(params.offerId);
      if (!offerIdValidation.valid) {
        // For analytics, don't fail but log warning
        logger.warn('[OFFERS API] Invalid offer ID for tracking:', params.offerId);
      }

      logApiRequest('POST', '/api/analytics/offer-view', { offerId: params.offerId });

      // Fire and forget analytics - don't await
      return {
        success: true,
        data: { success: true },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // For analytics, don't fail the operation
      logger.warn('[OFFERS API] Error tracking offer view:', error);
      return {
        success: true,
        data: { success: false },
        timestamp: new Date().toISOString(),
      } as StandardApiResponse<unknown>;
    }
  }

  async redeemOffer(params: RedeemOfferRequest): Promise<StandardApiResponse<unknown>> {
    const startTime = Date.now();

    try {
      // Validate offer ID
      const offerIdValidation = validateOfferId(params.offerId);
      if (!offerIdValidation.valid) {
        return createErrorResponse({error: offerIdValidation.error, message: offerIdValidation.error}) as StandardApiResponse<unknown>;
      }

      // Validate user ID
      if (!params.userId || typeof params.userId !== 'string' || params.userId.trim().length === 0) {
        return createErrorResponse({error: 'User ID is required', message: 'User authentication required to redeem offer'}) as StandardApiResponse<unknown>;
      }

      logApiRequest('POST', '/api/offers/redeem', { offerId: params.offerId, userId: params.userId });

      await this.simulateDelay();

      // Generate redemption ID
      const redemptionId = `redemption_${Date.now()}_${uuid.v4()}`;

      const response: ApiResponse<{ success: boolean; redemptionId: string }> = {
        success: true,
        data: {
          success: true,
          redemptionId
        },
        message: 'Offer redeemed successfully',
        timestamp: new Date().toISOString(),
      };

      logApiResponse('POST', '/api/offers/redeem', { success: true, redemptionId }, Date.now() - startTime);

      return response;
    } catch (error) {
      logger.error('[OFFERS API] Error redeeming offer:', error);
      return createErrorResponse(error, 'Failed to redeem offer. Please try again.') as StandardApiResponse<unknown>;
    }
  }

  async getRecommendedOffers(userId: string, location?: { latitude: number; longitude: number }): Promise<StandardApiResponse<unknown>> {
    const startTime = Date.now();

    try {
      // Validate user ID
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        return createErrorResponse({error: 'User ID is required', message: 'User ID is required'}) as StandardApiResponse<unknown>;
      }

      logApiRequest('GET', '/api/recommendations', { userId, hasLocation: !!location });

      await this.simulateDelay();

      // Return trending offers as recommendations
      const allOffers = offersPageData.sections
        .flatMap(section => section.offers);

      const validOffers = validateOfferArray(allOffers);

      const trendingOffers = validOffers
        .filter(offer => offer.isTrending)
        .slice(0, 10);

      const response: ApiResponse<Offer[]> = {
        success: true,
        data: trendingOffers,
        timestamp: new Date().toISOString(),
      };

      logApiResponse('GET', '/api/recommendations', { success: true, count: trendingOffers.length }, Date.now() - startTime);

      return response;
    } catch (error) {
      logger.error('[OFFERS API] Error fetching recommended offers:', error);
      return createErrorResponse(error, 'Failed to load recommendations. Please try again.') as StandardApiResponse<unknown>;
    }
  }

  async getTrendingOffers(location?: { latitude: number; longitude: number }): Promise<StandardApiResponse<unknown>> {
    const startTime = Date.now();

    try {
      logApiRequest('GET', '/api/offers/trending', { hasLocation: !!location });

      await this.simulateDelay();

      const allOffers = offersPageData.sections
        .flatMap(section => section.offers);

      const validOffers = validateOfferArray(allOffers);

      const trendingOffers = validOffers.filter(offer => offer.isTrending);

      const response: ApiResponse<Offer[]> = {
        success: true,
        data: trendingOffers,
        timestamp: new Date().toISOString(),
      };

      logApiResponse('GET', '/api/offers/trending', { success: true, count: trendingOffers.length }, Date.now() - startTime);

      return response;
    } catch (error) {
      logger.error('[OFFERS API] Error fetching trending offers:', error);
      return createErrorResponse(error, 'Failed to load trending offers. Please try again.') as StandardApiResponse<unknown>;
    }
  }

  async getStorePromotions(storeId: string): Promise<StandardApiResponse<unknown>> {
    const startTime = Date.now();

    try {
      // Validate store ID
      if (!storeId || typeof storeId !== 'string' || storeId.trim().length === 0) {
        return createErrorResponse({error: 'Store ID is required', message: 'Please provide a valid store ID'}) as StandardApiResponse<unknown>;
      }

      logApiRequest('GET', `/api/stores/${storeId}/promotions`, { storeId });

      await this.simulateDelay();

      // Import mock promotions
      const { getMockPromotions } = await import('@/data/mockPromotions');
      const promotions = getMockPromotions(storeId);

      const response: ApiResponse<{
        promotions: unknown[];
        totalCount: number;
        activeCount: number;
      }> = {
        success: true,
        data: {
          promotions,
          totalCount: promotions.length,
          activeCount: promotions.filter(p => p.isActive).length,
        },
        timestamp: new Date().toISOString(),
      };

      logApiResponse('GET', `/api/stores/${storeId}/promotions`, {
        success: true,
        totalCount: promotions.length,
        activeCount: promotions.filter(p => p.isActive).length,
      }, Date.now() - startTime);

      return response;
    } catch (error) {
      logger.error('[OFFERS API] Error fetching store promotions:', error);
      return createErrorResponse(error, 'Failed to load store promotions. Please try again.') as StandardApiResponse<unknown>;
    }
  }

  async getExpiringDeals(storeId: string, hours: number = 24): Promise<StandardApiResponse<unknown>> {
    const startTime = Date.now();

    try {
      // Validate store ID
      if (!storeId || typeof storeId !== 'string' || storeId.trim().length === 0) {
        return createErrorResponse({error: 'Store ID is required', message: 'Store ID is required'}) as StandardApiResponse<unknown>;
      }

      // Validate hours parameter
      if (typeof hours !== 'number' || hours < 1 || hours > 720) {
        return createErrorResponse({error: 'Invalid hours parameter', message: 'Invalid hours parameter'}) as StandardApiResponse<unknown>;
      }

      logApiRequest('GET', `/api/stores/${storeId}/expiring-deals`, { storeId, hours });

      await this.simulateDelay();

      // Get all deals for the store
      const allDeals = offersPageData.sections.flatMap(section => section.offers);

      // Validate offers
      const validDeals = validateOfferArray(allDeals);

      // Filter deals expiring within the specified hours
      const now = new Date().getTime();
      const thresholdTime = now + (hours * 60 * 60 * 1000);

      const expiringDeals = validDeals.filter(offer => {
        const validUntil = offer.validUntil;
        if (!validUntil) return false;

        const expiryTime = new Date(validUntil).getTime();
        return expiryTime > now && expiryTime <= thresholdTime;
      });

      // Sort by expiry time (soonest first)
      expiringDeals.sort((a, b) => {
        const timeA = new Date(a.validUntil!).getTime();
        const timeB = new Date(b.validUntil!).getTime();
        return timeA - timeB;
      });

      const response: ApiResponse<Offer[]> = {
        success: true,
        data: expiringDeals,
        timestamp: new Date().toISOString(),
      };

      logApiResponse('GET', `/api/stores/${storeId}/expiring-deals`, {
        success: true,
        count: expiringDeals.length,
        hours,
      }, Date.now() - startTime);

      return response;
    } catch (error) {
      logger.error('[OFFERS API] Error fetching expiring deals:', error);
      return createErrorResponse(error, 'Failed to load expiring deals. Please try again.') as StandardApiResponse<unknown>;
    }
  }
}

// Import real API
import realOffersApi from './realOffersApi';

// MED-4: Only instantiate MockOffersApi when EXPO_PUBLIC_MOCK_API is explicitly 'true'.
// In all other environments the real API is used and the mock class is never instantiated.
// Note: bundlers (Metro, Webpack) cannot statically tree-shake the class definition above
// because it is referenced by name here. To fully exclude it from production bundles,
// move MockOffersApi to a separate file and import it conditionally in a future refactor.
const USE_MOCK_API = process.env.EXPO_PUBLIC_MOCK_API === 'true';
export const offersApi = USE_MOCK_API ? new MockOffersApi() : realOffersApi;

// Export utilities
export { API_CONFIG, offersCache, categoriesCache, userCache };

// Export for real API implementation
export { OffersHttpClient };

export default offersApi;
