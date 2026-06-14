// @ts-nocheck
// Canonical types: @rez/shared-types — migrate imports when package is published
import { StandardApiResponse } from '@/utils/apiUtils';
// Canonical types: @rez/shared-types — migrate imports when package is published
// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// API Request Types
export interface GetOffersRequest {
  page?: number;
  pageSize?: number;
  category?: string;
  sortBy?: 'distance' | 'cashback' | 'price' | 'newest' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  filters?: {
    minCashBack?: number;
    maxDistance?: number;
    priceRange?: {
      min: number;
      max: number;
    };
    tags?: string[];
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface SearchOffersRequest {
  query: string;
  page?: number;
  pageSize?: number;
  category?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface GetOfferDetailsRequest {
  offerId: string;
  userId?: string;
}

export interface AddToFavoritesRequest {
  offerId: string;
  userId: string;
}

export interface RemoveFromFavoritesRequest {
  offerId: string;
  userId: string;
}

export interface GetUserFavoritesRequest {
  userId: string;
  page?: number;
  pageSize?: number;
}

export interface TrackOfferViewRequest {
  offerId: string;
  userId?: string;
  sessionId: string;
  timestamp: string;
}

export interface RedeemOfferRequest {
  offerId: string;
  userId: string;
  storeId: string;
  amount?: number;
}

// API Endpoint Types
export interface OffersApiEndpoints {
  // Core offer endpoints
  getOffers: (params: GetOffersRequest) => Promise<StandardApiResponse<unknown>>;
  getOfferDetails: (params: GetOfferDetailsRequest) => Promise<StandardApiResponse<unknown>>;
  searchOffers: (params: SearchOffersRequest) => Promise<StandardApiResponse<unknown>>;

  // Category endpoints
  getCategories: () => Promise<StandardApiResponse<unknown>>;
  getOffersByCategory: (categoryId: string, params?: GetOffersRequest) => Promise<StandardApiResponse<unknown>>;

  // User favorites
  getUserFavorites: (params: GetUserFavoritesRequest) => Promise<StandardApiResponse<unknown>>;
  addToFavorites: (params: AddToFavoritesRequest) => Promise<StandardApiResponse<unknown>>;
  removeFromFavorites: (params: RemoveFromFavoritesRequest) => Promise<StandardApiResponse<unknown>>;

  // Analytics
  trackOfferView: (params: TrackOfferViewRequest) => Promise<StandardApiResponse<unknown>>;
  redeemOffer: (params: RedeemOfferRequest) => Promise<StandardApiResponse<unknown>>;

  // Personalization
  getRecommendedOffers: (userId: string, location?: { latitude: number; longitude: number }) => Promise<StandardApiResponse<unknown>>;
  getTrendingOffers: (location?: { latitude: number; longitude: number }) => Promise<StandardApiResponse<unknown>>;
}

// Cache Configuration
export interface CacheConfig {
  offersCache: {
    ttl: number; // Time to live in milliseconds
    maxSize: number; // Maximum cache size
  };
  categoriesCache: {
    ttl: number;
    maxSize: number;
  };
  userCache: {
    ttl: number;
    maxSize: number;
  };
}

// API Configuration
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  cache: CacheConfig;
  endpoints: {
    offers: string;
    categories: string;
    favorites: string;
    search: string;
    analytics: string;
    recommendations: string;
  };
}

// Backend Integration Types
import { Offer, OfferCategory } from './offers.types';

export interface BackendOffer extends Omit<Offer, 'id'> {
  _id: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  analytics: {
    views: number;
    clicks: number;
    redemptions: number;
    conversionRate: number;
  };
  targeting: {
    userSegments: string[];
    locationRadiusKm: number;
    ageRange?: {
      min: number;
      max: number;
    };
    interests?: string[];
  };
}

export interface BackendOfferCategory extends Omit<OfferCategory, 'id'> {
  _id: string;
  displayOrder: number;
  isActive: boolean;
  metadata: {
    description?: string;
    seoKeywords?: string[];
    iconUrl?: string;
  };
}

// Sync Types
export interface SyncRequest {
  lastSyncTimestamp?: string;
  deviceId: string;
  userId?: string;
}

export interface SyncResponse {
  offers: {
    added: BackendOffer[];
    updated: BackendOffer[];
    removed: string[];
  };
  categories: {
    added: BackendOfferCategory[];
    updated: BackendOfferCategory[];
    removed: string[];
  };
  userFavorites?: string[];
  timestamp: string;
}

// Error Types
export type ApiErrorCode = 
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'TIMEOUT'
  | 'OFFLINE';

export interface DetailedApiError extends ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: {
      field?: string;
      validationErrors?: string[];
      retryAfter?: number;
    };
  };
}