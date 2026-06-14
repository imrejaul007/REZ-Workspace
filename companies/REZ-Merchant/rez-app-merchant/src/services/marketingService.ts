/**
 * Marketing/Offers Service for REZ Merchant App
 * Handles offers, campaigns, discount codes, and analytics
 *
 * Base URL: https://rez-merchant-service.onrender.com/api/v1
 */

import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Offer {
  id: string;
  merchantId: string;
  title: string;
  description: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'free_item';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  targetAudience: 'all' | 'new_customers' | 'returning' | 'vip';
  applicableItems?: string[];
  startDate: string;
  endDate: string;
  enabled: boolean;
  usageLimit?: number;
  usageCount: number;
  imageUrl?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOffer {
  title: string;
  description: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'free_item';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  targetAudience: 'all' | 'new_customers' | 'returning' | 'vip';
  applicableItems?: string[];
  startDate: string;
  endDate: string;
  usageLimit?: number;
  imageUrl?: string;
  terms?: string;
}

export interface UpdateOffer {
  title?: string;
  description?: string;
  type?: 'percentage' | 'fixed' | 'bogo' | 'free_item';
  value?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  targetAudience?: 'all' | 'new_customers' | 'returning' | 'vip';
  applicableItems?: string[];
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
  usageLimit?: number;
  imageUrl?: string;
  terms?: string;
}

export interface Campaign {
  id: string;
  merchantId: string;
  name: string;
  description: string;
  type: 'push' | 'email' | 'sms' | 'in_app' | 'social';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  offerIds: string[];
  targeting: {
    segments: string[];
    minOrders?: number;
    lastOrderDays?: number;
  };
  schedule: {
    startDate: string;
    endDate: string;
    recurring?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string;
      daysOfWeek?: number[];
      daysOfMonth?: number[];
    };
  };
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaign {
  name: string;
  description: string;
  type: 'push' | 'email' | 'sms' | 'in_app' | 'social';
  offerIds: string[];
  targeting: {
    segments: string[];
    minOrders?: number;
    lastOrderDays?: number;
  };
  schedule: {
    startDate: string;
    endDate: string;
    recurring?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string;
      daysOfWeek?: number[];
      daysOfMonth?: number[];
    };
  };
}

export interface UpdateCampaign {
  name?: string;
  description?: string;
  type?: 'push' | 'email' | 'sms' | 'in_app' | 'social';
  offerIds?: string[];
  targeting?: {
    segments: string[];
    minOrders?: number;
    lastOrderDays?: number;
  };
  schedule?: {
    startDate: string;
    endDate: string;
    recurring?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string;
      daysOfWeek?: number[];
      daysOfMonth?: number[];
    };
  };
}

export interface DiscountCode {
  id: string;
  merchantId: string;
  code: string;
  offerId?: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'free_item';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  validFrom: string;
  validUntil: string;
  enabled: boolean;
  singleUse: boolean;
  createdAt: string;
}

export interface CreateDiscountCode {
  code: string;
  offerId?: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'free_item';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  validFrom: string;
  validUntil: string;
  singleUse: boolean;
}

export interface DiscountValidation {
  valid: boolean;
  code: string;
  discountType: 'percentage' | 'fixed' | 'bogo' | 'free_item';
  discountValue: number;
  calculatedDiscount: number;
  message: string;
  expiresAt?: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface OfferAnalytics {
  offerId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  averageOrderValue: number;
  conversionRate: number;
  totalDiscountGiven: number;
  roi: number;
  topSegments: Array<{
    segment: string;
    conversions: number;
    revenue: number;
  }>;
  timeline: Array<{
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
}

export interface CampaignAnalytics {
  campaignId: string;
  status: Campaign['status'];
  reach: number;
  engagement: {
    total: number;
    rate: number;
  };
  conversion: {
    total: number;
    rate: number;
    revenue: number;
  };
  cost: {
    total: number;
    perConversion: number;
  };
  roi: number;
  timeline: Array<{
    date: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  }>;
  channelBreakdown?: Array<{
    channel: string;
    reach: number;
    conversions: number;
    revenue: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, unknown>;
}

// ============================================================================
// SERVICE STATE
// ============================================================================

interface ServiceState {
  loading: boolean;
  error: ApiError | null;
}

const initialState: ServiceState = {
  loading: false,
  error: null,
};

// ============================================================================
// MOCK DATA
// ============================================================================

/** FIX (security): Replaced Math.random() with crypto.randomUUID() for secure ID generation */
const generateSecureId = (): string => {
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }
  // Node.js fallback
  try {
    const { randomUUID } = require('crypto');
    return randomUUID();
  } catch {
    // Legacy fallback (only for environments without crypto)
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

const generateId = (): string => {
  return `id_${Date.now()}_${generateSecureId().replace(/-/g, '').substring(0, 9)}`;
};

const mockOffers: Offer[] = [
  {
    id: 'offer_001',
    merchantId: 'merchant_demo',
    title: 'Summer Sale 20% Off',
    description: 'Get 20% off on all items this summer',
    type: 'percentage',
    value: 20,
    minOrderAmount: 25,
    maxDiscountAmount: 50,
    targetAudience: 'all',
    applicableItems: [],
    startDate: '2026-06-01T00:00:00Z',
    endDate: '2026-08-31T23:59:59Z',
    enabled: true,
    usageLimit: 1000,
    usageCount: 234,
    imageUrl: 'https://images.rez.app/summer-sale.jpg',
    terms: 'Valid for dine-in and takeout orders',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'offer_002',
    merchantId: 'merchant_demo',
    title: 'New Customer Discount',
    description: '$5 off for first-time customers',
    type: 'fixed',
    value: 5,
    minOrderAmount: 20,
    targetAudience: 'new_customers',
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    enabled: true,
    usageLimit: 500,
    usageCount: 89,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-05-01T12:00:00Z',
  },
  {
    id: 'offer_003',
    merchantId: 'merchant_demo',
    title: 'Buy One Get One Free',
    description: 'Buy unknown main course, get a dessert free',
    type: 'bogo',
    value: 100,
    targetAudience: 'all',
    applicableItems: ['main_courses'],
    startDate: '2026-05-01T00:00:00Z',
    endDate: '2026-05-31T23:59:59Z',
    enabled: true,
    usageCount: 156,
    terms: 'Dessert of equal or lesser value',
    createdAt: '2026-04-25T08:00:00Z',
    updatedAt: '2026-04-25T08:00:00Z',
  },
];

const mockCampaigns: Campaign[] = [
  {
    id: 'campaign_001',
    merchantId: 'merchant_demo',
    name: 'Summer Promo Blast',
    description: 'Push notification campaign for summer sale',
    type: 'push',
    status: 'active',
    offerIds: ['offer_001'],
    targeting: {
      segments: ['all_active'],
      minOrders: 1,
    },
    schedule: {
      startDate: '2026-06-01T09:00:00Z',
      endDate: '2026-08-31T21:00:00Z',
      recurring: {
        frequency: 'weekly',
        time: '10:00',
        daysOfWeek: [1, 3, 5],
      },
    },
    stats: {
      sent: 5420,
      delivered: 5298,
      opened: 2156,
      clicked: 876,
      converted: 234,
    },
    createdAt: '2026-05-15T14:00:00Z',
    updatedAt: '2026-05-20T10:00:00Z',
  },
  {
    id: 'campaign_002',
    merchantId: 'merchant_demo',
    name: 'VIP Loyalty Rewards',
    description: 'Exclusive offers for VIP customers',
    type: 'email',
    status: 'scheduled',
    offerIds: ['offer_002'],
    targeting: {
      segments: ['vip_customers'],
      minOrders: 10,
    },
    schedule: {
      startDate: '2026-06-15T10:00:00Z',
      endDate: '2026-06-15T10:00:00Z',
    },
    stats: {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
    },
    createdAt: '2026-05-10T09:00:00Z',
    updatedAt: '2026-05-10T09:00:00Z',
  },
];

const mockDiscountCodes: DiscountCode[] = [
  {
    id: 'dc_001',
    merchantId: 'merchant_demo',
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    minOrderAmount: 30,
    usageLimit: 100,
    usageCount: 45,
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: '2026-12-31T23:59:59Z',
    enabled: true,
    singleUse: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'dc_002',
    merchantId: 'merchant_demo',
    code: 'SUMMERFUN',
    offerId: 'offer_001',
    type: 'percentage',
    value: 25,
    maxDiscountAmount: 100,
    usageLimit: 50,
    usageCount: 12,
    validFrom: '2026-06-01T00:00:00Z',
    validUntil: '2026-08-31T23:59:59Z',
    enabled: true,
    singleUse: false,
    createdAt: '2026-05-01T12:00:00Z',
  },
];

const mockOfferAnalytics: Record<string, OfferAnalytics> = {
  'offer_001': {
    offerId: 'offer_001',
    impressions: 15420,
    clicks: 3256,
    conversions: 234,
    revenue: 18450.00,
    averageOrderValue: 78.85,
    conversionRate: 7.19,
    totalDiscountGiven: 3690.00,
    roi: 400,
    topSegments: [
      { segment: 'returning_customers', conversions: 156, revenue: 12350.00 },
      { segment: 'new_customers', conversions: 78, revenue: 6100.00 },
    ],
    timeline: [
      { date: '2026-05-01', impressions: 450, clicks: 89, conversions: 12, revenue: 945.00 },
      { date: '2026-05-02', impressions: 520, clicks: 112, conversions: 15, revenue: 1180.00 },
      { date: '2026-05-03', impressions: 480, clicks: 95, conversions: 10, revenue: 790.00 },
      { date: '2026-05-04', impressions: 610, clicks: 134, conversions: 18, revenue: 1420.00 },
      { date: '2026-05-05', impressions: 580, clicks: 128, conversions: 16, revenue: 1260.00 },
    ],
  },
};

const mockCampaignAnalytics: Record<string, CampaignAnalytics> = {
  'campaign_001': {
    campaignId: 'campaign_001',
    status: 'active',
    reach: 5420,
    engagement: { total: 3032, rate: 56.31 },
    conversion: { total: 234, rate: 4.32, revenue: 18450.00 },
    cost: { total: 150.00, perConversion: 0.64 },
    roi: 12200,
    timeline: [
      { date: '2026-06-01', sent: 1800, delivered: 1765, opened: 720, clicked: 290, converted: 78 },
      { date: '2026-06-02', sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0 },
      { date: '2026-06-03', sent: 1820, delivered: 1788, opened: 728, clicked: 298, converted: 82 },
      { date: '2026-06-04', sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0 },
      { date: '2026-06-05', sent: 1800, delivered: 1745, opened: 708, clicked: 288, converted: 74 },
    ],
    channelBreakdown: [
      { channel: 'push_notification', reach: 5420, conversions: 234, revenue: 18450.00 },
    ],
  },
};

// ============================================================================
// HTTP CLIENT
// ============================================================================

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private retryCount: number;
  private retryDelay: number;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    this.retryCount = 3;
    this.retryDelay = 1000;
  }

  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  async request<T>(endpoint: string, config: RequestConfig): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);

    const fetchOptions: RequestInit = {
      method: config.method,
      headers: { ...this.defaultHeaders, ...config.headers },
      signal: controller.signal,
    };

    if (config.body && config.method !== 'GET') {
      fetchOptions.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.message || `HTTP error ${response.status}`,
          code: errorData.code || 'HTTP_ERROR',
          status: response.status,
          details: errorData,
        } as ApiError;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === 'AbortError') {
        throw {
          message: 'Request timeout',
          code: 'TIMEOUT',
          status: 408,
        } as ApiError;
      }

      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// ============================================================================
// MARKETING SERVICE
// ============================================================================

export class MarketingService {
  private http: HttpClient;
  private loadingSubject: BehaviorSubject<boolean>;
  private errorSubject: BehaviorSubject<ApiError | null>;
  private useMockData: boolean;

  // In-memory storage for local operations
  private offers: Map<string, Offer>;
  private campaigns: Map<string, Campaign>;
  private discountCodes: Map<string, DiscountCode>;

  constructor(baseUrl: string = 'https://rez-merchant-service.onrender.com/api/v1') {
    this.http = new HttpClient(baseUrl);
    this.loadingSubject = new BehaviorSubject<boolean>(initialState.loading);
    this.errorSubject = new BehaviorSubject<ApiError | null>(initialState.error);
    this.useMockData = false;

    // Initialize mock storage
    this.offers = new Map(mockOffers.map(o => [o.id, o]));
    this.campaigns = new Map(mockCampaigns.map(c => [c.id, c]));
    this.discountCodes = new Map(mockDiscountCodes.map(d => [d.id, d]));
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API: Observable State
  // ---------------------------------------------------------------------------

  get loading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  get error$(): Observable<ApiError | null> {
    return this.errorSubject.asObservable();
  }

  get isLoading(): boolean {
    return this.loadingSubject.getValue();
  }

  get lastError(): ApiError | null {
    return this.errorSubject.getValue();
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API: Configuration
  // ---------------------------------------------------------------------------

  setAuthToken(token: string): void {
    this.http.setAuthToken(token);
  }

  clearAuth(): void {
    this.http.removeAuthToken();
  }

  enableMockData(): void {
    this.useMockData = true;
  }

  disableMockData(): void {
    this.useMockData = false;
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: ApiError | null): void {
    this.errorSubject.next(error);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    retryCount: number = 3
  ): Promise<T> {
    let lastError: ApiError | null = null;

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as ApiError;

        // Don't retry on client errors (4xx)
        if (lastError.status >= 400 && lastError.status < 500) {
          throw error;
        }

        // Wait before retrying
        if (attempt < retryCount) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError;
  }

  private async execute<T>(
    operation: () => Promise<T>,
    fallbackData?: T
  ): Promise<T> {
    this.setLoading(true);
    this.clearError();

    try {
      const result = await this.withRetry(operation);
      this.setLoading(false);
      return result;
    } catch (error) {
      const apiError = error as ApiError;
      this.setError(apiError);
      this.setLoading(false);

      // Return fallback data if provided
      if (fallbackData !== undefined) {
        console.warn('API failed, using fallback data:', apiError.message);
        return fallbackData;
      }

      throw error;
    }
  }

  // ==========================================================================
  // OFFERS
  // ==========================================================================

  /**
   * Get all offers for a merchant
   */
  async getOffers(merchantId: string): Promise<Offer[]> {
    const mockResult = Array.from(this.offers.values()).filter(
      o => o.merchantId === merchantId
    );

    const apiOperation = async (): Promise<Offer[]> => {
      const response = await this.http.get<ApiResponse<Offer[]>>(
        `/merchants/${merchantId}/offers`
      );
      return response.data;
    };

    if (this.useMockData) {
      this.setLoading(false);
      return mockResult;
    }

    try {
      return await this.execute(apiOperation, mockResult);
    } catch {
      return mockResult;
    }
  }

  /**
   * Get a single offer by ID
   */
  async getOfferById(id: string): Promise<Offer> {
    const mockResult = this.offers.get(id);

    const apiOperation = async (): Promise<Offer> => {
      const response = await this.http.get<ApiResponse<Offer>>(`/offers/${id}`);
      return response.data;
    };

    if (this.useMockData) {
      this.setLoading(false);
      if (!mockResult) {
        throw {
          message: `Offer not found: ${id}`,
          code: 'NOT_FOUND',
          status: 404,
        } as ApiError;
      }
      return mockResult;
    }

    try {
      return await this.execute(apiOperation);
    } catch {
      if (mockResult) {
        return mockResult;
      }
      throw {
        message: `Offer not found: ${id}`,
        code: 'NOT_FOUND',
        status: 404,
      } as ApiError;
    }
  }

  /**
   * Create a new offer
   */
  async createOffer(data: CreateOffer): Promise<Offer> {
    const now = new Date().toISOString();
    const mockOffer: Offer = {
      id: generateId(),
      merchantId: 'merchant_demo',
      title: data.title,
      description: data.description,
      type: data.type,
      value: data.value,
      minOrderAmount: data.minOrderAmount,
      maxDiscountAmount: data.maxDiscountAmount,
      targetAudience: data.targetAudience,
      applicableItems: data.applicableItems || [],
      startDate: data.startDate,
      endDate: data.endDate,
      enabled: true,
      usageLimit: data.usageLimit,
      usageCount: 0,
      imageUrl: data.imageUrl,
      terms: data.terms,
      createdAt: now,
      updatedAt: now,
    };

    const apiOperation = async (): Promise<Offer> => {
      const response = await this.http.post<ApiResponse<Offer>>('/offers', data);
      return response.data;
    };

    if (this.useMockData) {
      this.offers.set(mockOffer.id, mockOffer);
      this.setLoading(false);
      return mockOffer;
    }

    try {
      const result = await this.execute(apiOperation);
      this.offers.set(result.id, result);
      return result;
    } catch {
      // Save to mock storage on API failure
      this.offers.set(mockOffer.id, mockOffer);
      return mockOffer;
    }
  }

  /**
   * Update an existing offer
   */
  async updateOffer(id: string, data: UpdateOffer): Promise<Offer> {
    const existingOffer = this.offers.get(id);

    const apiOperation = async (): Promise<Offer> => {
      const response = await this.http.patch<ApiResponse<Offer>>(
        `/offers/${id}`,
        data
      );
      return response.data;
    };

    if (this.useMockData) {
      this.setLoading(false);
      if (!existingOffer) {
        throw {
          message: `Offer not found: ${id}`,
          code: 'NOT_FOUND',
          status: 404,
        } as ApiError;
      }

      const updatedOffer: Offer = {
        ...existingOffer,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      this.offers.set(id, updatedOffer);
      return updatedOffer;
    }

    try {
      return await this.execute(apiOperation);
    } catch {
      if (existingOffer) {
        const updatedOffer: Offer = {
          ...existingOffer,
          ...data,
          updatedAt: new Date().toISOString(),
        };
        this.offers.set(id, updatedOffer);
        return updatedOffer;
      }
      throw {
        message: `Offer not found: ${id}`,
        code: 'NOT_FOUND',
        status: 404,
      } as ApiError;
    }
  }

  /**
   * Delete an offer
   */
  async deleteOffer(id: string): Promise<void> {
    const apiOperation = async (): Promise<void> => {
      await this.http.delete<void>(`/offers/${id}`);
    };

    if (this.useMockData) {
      this.setLoading(false);
      if (!this.offers.has(id)) {
        throw {
          message: `Offer not found: ${id}`,
          code: 'NOT_FOUND',
          status: 404,
        } as ApiError;
      }
      this.offers.delete(id);
      return;
    }

    try {
      await this.execute(apiOperation);
      this.offers.delete(id);
    } catch {
      if (this.offers.has(id)) {
        this.offers.delete(id);
        return;
      }
      throw {
        message: `Offer not found: ${id}`,
        code: 'NOT_FOUND',
        status: 404,
      } as ApiError;
    }
  }

  /**
   * Toggle offer enabled/disabled status
   */
  async toggleOffer(id: string, enabled: boolean): Promise<Offer> {
    return this.updateOffer(id, { enabled });
  }

  // ==========================================================================
  // CAMPAIGNS
  // ==========================================================================

  /**
   * Get all campaigns for a merchant
   */
  async getCampaigns(merchantId: string): Promise<Campaign[]> {
    const mockResult = Array.from(this.campaigns.values()).filter(
      c => c.merchantId === merchantId
    );

    const apiOperation = async (): Promise<Campaign[]> => {
      const response = await this.http.get<ApiResponse<Campaign[]>>(
        `/merchants/${merchantId}/campaigns`
      );
      return response.data;
    };

    if (this.useMockData) {
      this.setLoading(false);
      return mockResult;
    }

    try {
      return await this.execute(apiOperation, mockResult);
    } catch {
      return mockResult;
    }
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaignById(id: string): Promise<Campaign> {
    const mockResult = this.campaigns.get(id);

    const apiOperation = async (): Promise<Campaign> => {
      const response = await this.http.get<ApiResponse<Campaign>>(
        `/campaigns/${id}`
      );
      return response.data;
    };

    if (this.useMockData) {
      this.setLoading(false);
      if (!mockResult) {
        throw {
          message: `Campaign not found: ${id}`,
          code: 'NOT_FOUND',
          status: 404,
        } as ApiError;
      }
      return mockResult;
    }

    try {
      return await this.execute(apiOperation);
    } catch {
      if (mockResult) {
        return mockResult;
      }
      throw {
        message: `Campaign not found: ${id}`,
        code: 'NOT_FOUND',
        status: 404,
      } as ApiError;
    }
  }

  /**
   * Create a new campaign
   */
  async createCampaign(data: CreateCampaign): Promise<Campaign> {
    const now = new Date().toISOString();
    const mockCampaign: Campaign = {
      id: generateId(),
      merchantId: 'merchant_demo',
      name: data.name,
      description: data.description,
      type: data.type,
      status: 'draft',
      offerIds: data.offerIds,
      targeting: data.targeting,
      schedule: data.schedule,
      stats: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
      },
      createdAt: now,
      updatedAt: now,
    };

    const apiOperation = async (): Promise<Campaign> => {
      const response = await this.http.post<ApiResponse<Campaign>>(
        '/campaigns',
        data
      );
      return response.data;
    };

    if (this.useMockData) {
      this.campaigns.set(mockCampaign.id, mockCampaign);
      this.setLoading(false);
      return mockCampaign;
    }

    try {
      const result = await this.execute(apiOperation);
      this.campaigns.set(result.id, result);
      return result;
    } catch {
      this.campaigns.set(mockCampaign.id, mockCampaign);
      return mockCampaign;
    }
  }

  /**
   * Update an existing campaign
   */
  async updateCampaign(id: string, data: UpdateCampaign): Promise<Campaign> {
    const existingCampaign = this.campaigns.get(id);

    const apiOperation = async (): Promise<Campaign> => {
      const response = await this.http.patch<ApiResponse<Campaign>>(
        `/campaigns/${id}`,
        data
      );
      return response.data;
    };

    if (this.useMockData) {
      this.setLoading(false);
      if (!existingCampaign) {
        throw {
          message: `Campaign not found: ${id}`,
          code: 'NOT_FOUND',
          status: 404,
        } as ApiError;
      }

      const updatedCampaign: Campaign = {
        ...existingCampaign,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      this.campaigns.set(id, updatedCampaign);
      return updatedCampaign;
    }

    try {
      return await this.execute(apiOperation);
    } catch {
      if (existingCampaign) {
        const updatedCampaign: Campaign = {
          ...existingCampaign,
          ...data,
          updatedAt: new Date().toISOString(),
        };
        this.campaigns.set(id, updatedCampaign);
        return updatedCampaign;
      }
      throw {
        message: `Campaign not found: ${id}`,
        code: 'NOT_FOUND',
        status: 404,
      } as ApiError;
    }
  }

  /**
   * Pause a running campaign
   */
  async pauseCampaign(id: string): Promise<void> {
    const campaign = await this.getCampaignById(id);

    const apiOperation = async (): Promise<void> => {
      await this.http.post<void>(`/campaigns/${id}/pause`, {});
    };

    if (this.useMockData) {
      this.setLoading(false);
      const updatedCampaign: Campaign = {
        ...campaign,
        status: 'paused',
        updatedAt: new Date().toISOString(),
      };
      this.campaigns.set(id, updatedCampaign);
      return;
    }

    try {
      await this.execute(apiOperation);
    } catch {
      // Continue with local update
    }

    const updatedCampaign: Campaign = {
      ...campaign,
      status: 'paused',
      updatedAt: new Date().toISOString(),
    };
    this.campaigns.set(id, updatedCampaign);
  }

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(id: string): Promise<void> {
    const campaign = await this.getCampaignById(id);

    const apiOperation = async (): Promise<void> => {
      await this.http.post<void>(`/campaigns/${id}/resume`, {});
    };

    if (this.useMockData) {
      this.setLoading(false);
      const updatedCampaign: Campaign = {
        ...campaign,
        status: 'active',
        updatedAt: new Date().toISOString(),
      };
      this.campaigns.set(id, updatedCampaign);
      return;
    }

    try {
      await this.execute(apiOperation);
    } catch {
      // Continue with local update
    }

    const updatedCampaign: Campaign = {
      ...campaign,
      status: 'active',
      updatedAt: new Date().toISOString(),
    };
    this.campaigns.set(id, updatedCampaign);
  }

  // ==========================================================================
  // DISCOUNT CODES
  // ==========================================================================

  /**
   * Get all discount codes for a merchant
   */
  async getDiscountCodes(merchantId: string): Promise<DiscountCode[]> {
    const mockResult = Array.from(this.discountCodes.values()).filter(
      d => d.merchantId === merchantId
    );

    const apiOperation = async (): Promise<DiscountCode[]> => {
      const response = await this.http.get<ApiResponse<DiscountCode[]>>(
        `/merchants/${merchantId}/discount-codes`
      );
      return response.data;
    };

    if (this.useMockData) {
      this.setLoading(false);
      return mockResult;
    }

    try {
      return await this.execute(apiOperation, mockResult);
    } catch {
      return mockResult;
    }
  }

  /**
   * Create a new discount code
   */
  async createDiscountCode(data: CreateDiscountCode): Promise<DiscountCode> {
    const now = new Date().toISOString();
    const mockCode: DiscountCode = {
      id: generateId(),
      merchantId: 'merchant_demo',
      code: data.code.toUpperCase(),
      offerId: data.offerId,
      type: data.type,
      value: data.value,
      minOrderAmount: data.minOrderAmount,
      maxDiscountAmount: data.maxDiscountAmount,
      usageLimit: data.usageLimit,
      usageCount: 0,
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      enabled: true,
      singleUse: data.singleUse,
      createdAt: now,
    };

    const apiOperation = async (): Promise<DiscountCode> => {
      const response = await this.http.post<ApiResponse<DiscountCode>>(
        '/discount-codes',
        data
      );
      return response.data;
    };

    if (this.useMockData) {
      this.discountCodes.set(mockCode.id, mockCode);
      this.setLoading(false);
      return mockCode;
    }

    try {
      const result = await this.execute(apiOperation);
      this.discountCodes.set(result.id, result);
      return result;
    } catch {
      this.discountCodes.set(mockCode.id, mockCode);
      return mockCode;
    }
  }

  /**
   * Validate a discount code for a given order amount
   */
  async validateDiscountCode(
    code: string,
    amount: number
  ): Promise<DiscountValidation> {
    const upperCode = code.toUpperCase();

    // Find the discount code
    const discountCode = Array.from(this.discountCodes.values()).find(
      d => d.code === upperCode
    );

    // Build validation result
    const buildValidation = (dc: DiscountCode | undefined): DiscountValidation => {
      if (!dc) {
        return {
          valid: false,
          code: upperCode,
          discountType: 'percentage',
          discountValue: 0,
          calculatedDiscount: 0,
          message: 'Discount code not found',
        };
      }

      if (!dc.enabled) {
        return {
          valid: false,
          code: upperCode,
          discountType: dc.type,
          discountValue: dc.value,
          calculatedDiscount: 0,
          message: 'This discount code has been disabled',
        };
      }

      const now = new Date();
      const validFrom = new Date(dc.validFrom);
      const validUntil = new Date(dc.validUntil);

      if (now < validFrom) {
        return {
          valid: false,
          code: upperCode,
          discountType: dc.type,
          discountValue: dc.value,
          calculatedDiscount: 0,
          message: `This code is not valid until ${validFrom.toLocaleDateString()}`,
          expiresAt: dc.validUntil,
        };
      }

      if (now > validUntil) {
        return {
          valid: false,
          code: upperCode,
          discountType: dc.type,
          discountValue: dc.value,
          calculatedDiscount: 0,
          message: 'This discount code has expired',
          expiresAt: dc.validUntil,
        };
      }

      if (dc.usageLimit && dc.usageCount >= dc.usageLimit) {
        return {
          valid: false,
          code: upperCode,
          discountType: dc.type,
          discountValue: dc.value,
          calculatedDiscount: 0,
          message: 'This discount code has reached its usage limit',
          expiresAt: dc.validUntil,
        };
      }

      if (dc.minOrderAmount && amount < dc.minOrderAmount) {
        return {
          valid: false,
          code: upperCode,
          discountType: dc.type,
          discountValue: dc.value,
          calculatedDiscount: 0,
          message: `Minimum order amount is $${dc.minOrderAmount.toFixed(2)}`,
          expiresAt: dc.validUntil,
        };
      }

      // Calculate discount
      let calculatedDiscount = 0;
      switch (dc.type) {
        case 'percentage':
          calculatedDiscount = (amount * dc.value) / 100;
          if (dc.maxDiscountAmount) {
            calculatedDiscount = Math.min(calculatedDiscount, dc.maxDiscountAmount);
          }
          break;
        case 'fixed':
          calculatedDiscount = dc.value;
          break;
        case 'bogo':
        case 'free_item':
          calculatedDiscount = amount;
          break;
      }

      return {
        valid: true,
        code: upperCode,
        discountType: dc.type,
        discountValue: dc.value,
        calculatedDiscount,
        message: `Discount applied! You save $${calculatedDiscount.toFixed(2)}`,
        expiresAt: dc.validUntil,
      };
    };

    const apiOperation = async (): Promise<DiscountValidation> => {
      const response = await this.http.post<ApiResponse<DiscountValidation>>(
        '/discount-codes/validate',
        { code: upperCode, amount }
      );
      return response.data;
    };

    if (this.useMockData) {
      this.setLoading(false);
      return buildValidation(discountCode);
    }

    try {
      return await this.execute(apiOperation);
    } catch {
      return buildValidation(discountCode);
    }
  }

  // ==========================================================================
  // ANALYTICS
  // ==========================================================================

  /**
   * Get analytics for a specific offer within a date range
   */
  async getOfferAnalytics(
    offerId: string,
    dateRange: DateRange
  ): Promise<OfferAnalytics> {
    const mockResult = mockOfferAnalytics[offerId] || {
      offerId,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      averageOrderValue: 0,
      conversionRate: 0,
      totalDiscountGiven: 0,
      roi: 0,
      topSegments: [],
      timeline: [],
    };

    const apiOperation = async (): Promise<OfferAnalytics> => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const response = await this.http.get<ApiResponse<OfferAnalytics>>(
        `/offers/${offerId}/analytics?${params}`
      );
      return response.data;
    };

    if (this.useMockData) {
      this.setLoading(false);
      return mockResult;
    }

    try {
      return await this.execute(apiOperation, mockResult);
    } catch {
      return mockResult;
    }
  }

  /**
   * Get analytics for a specific campaign
   */
  async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    const mockResult = mockCampaignAnalytics[campaignId] || {
      campaignId,
      status: 'draft' as const,
      reach: 0,
      engagement: { total: 0, rate: 0 },
      conversion: { total: 0, rate: 0, revenue: 0 },
      cost: { total: 0, perConversion: 0 },
      roi: 0,
      timeline: [],
      channelBreakdown: [],
    };

    const apiOperation = async (): Promise<CampaignAnalytics> => {
      const response = await this.http.get<ApiResponse<CampaignAnalytics>>(
        `/campaigns/${campaignId}/analytics`
      );
      return response.data;
    };

    if (this.useMockData) {
      this.setLoading(false);
      return mockResult;
    }

    try {
      return await this.execute(apiOperation, mockResult);
    } catch {
      return mockResult;
    }
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Clear all cached/mock data
   */
  clearCache(): void {
    this.offers.clear();
    this.campaigns.clear();
    this.discountCodes.clear();
  }

  /**
   * Reset service state
   */
  reset(): void {
    this.setLoading(false);
    this.setError(null);
  }

  /**
   * Generate a unique discount code
   * FIX (security): Replaced Math.random() with crypto.getRandomValues() for secure code generation
   */
  generateDiscountCode(prefix: string = 'CODE'): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = prefix.toUpperCase();

    // Use crypto for secure random code generation
    if (
      typeof globalThis !== 'undefined' &&
      typeof globalThis.crypto !== 'undefined' &&
      typeof globalThis.crypto.getRandomValues === 'function'
    ) {
      const array = new Uint8Array(6);
      globalThis.crypto.getRandomValues(array);
      code += Array.from(array, b => chars[b % chars.length]).join('');
    } else {
      // Node.js fallback
      try {
        const { randomBytes } = require('crypto');
        const bytes = randomBytes(6);
        code += Array.from(bytes, b => chars[b % chars.length]).join('');
      } catch {
        // Legacy fallback (only for environments without crypto)
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      }
    }
    return code;
  }

  /**
   * Calculate discount amount based on type and value
   */
  calculateDiscount(
    type: 'percentage' | 'fixed' | 'bogo' | 'free_item',
    value: number,
    amount: number,
    maxDiscount?: number
  ): number {
    switch (type) {
      case 'percentage':
        let discount = (amount * value) / 100;
        if (maxDiscount) {
          discount = Math.min(discount, maxDiscount);
        }
        return Math.round(discount * 100) / 100;
      case 'fixed':
        return Math.min(value, amount);
      case 'bogo':
      case 'free_item':
        return amount;
      default:
        return 0;
    }
  }

  /**
   * Check if an offer is currently active
   */
  isOfferActive(offer: Offer): boolean {
    if (!offer.enabled) return false;
    const now = new Date();
    const startDate = new Date(offer.startDate);
    const endDate = new Date(offer.endDate);
    return now >= startDate && now <= endDate;
  }

  /**
   * Get active offers for a merchant
   */
  async getActiveOffers(merchantId: string): Promise<Offer[]> {
    const offers = await this.getOffers(merchantId);
    return offers.filter(offer => this.isOfferActive(offer));
  }

  /**
   * Bulk enable/disable offers
   */
  async bulkToggleOffers(
    offerIds: string[],
    enabled: boolean
  ): Promise<Offer[]> {
    const results: Offer[] = [];
    for (const id of offerIds) {
      try {
        const offer = await this.toggleOffer(id, enabled);
        results.push(offer);
      } catch (error) {
        console.error(`Failed to toggle offer ${id}:`, error);
      }
    }
    return results;
  }

  /**
   * Duplicate an existing offer
   */
  async duplicateOffer(id: string): Promise<Offer> {
    const original = await this.getOfferById(id);
    return this.createOffer({
      title: `${original.title} (Copy)`,
      description: original.description,
      type: original.type,
      value: original.value,
      minOrderAmount: original.minOrderAmount,
      maxDiscountAmount: original.maxDiscountAmount,
      targetAudience: original.targetAudience,
      applicableItems: original.applicableItems,
      startDate: new Date().toISOString(),
      endDate: original.endDate,
      usageLimit: original.usageLimit,
      imageUrl: original.imageUrl,
      terms: original.terms,
    });
  }

  /**
   * Get offer statistics summary
   */
  async getOffersStats(merchantId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    totalUsage: number;
  }> {
    const offers = await this.getOffers(merchantId);
    const now = new Date();

    let active = 0;
    let expired = 0;
    let totalUsage = 0;

    for (const offer of offers) {
      totalUsage += offer.usageCount;
      if (this.isOfferActive(offer)) {
        active++;
      } else if (new Date(offer.endDate) < now) {
        expired++;
      }
    }

    return {
      total: offers.length,
      active,
      expired,
      totalUsage,
    };
  }

  /**
   * Get campaign performance comparison
   */
  async compareCampaigns(
    campaignIds: string[]
  ): Promise<Array<Campaign & { analytics: CampaignAnalytics }>> {
    const results: Array<Campaign & { analytics: CampaignAnalytics }> = [];

    for (const id of campaignIds) {
      try {
        const campaign = await this.getCampaignById(id);
        const analytics = await this.getCampaignAnalytics(id);
        results.push({ ...campaign, analytics });
      } catch (error) {
        console.error(`Failed to get campaign ${id}:`, error);
      }
    }

    return results;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let marketingServiceInstance: MarketingService | null = null;

export function getMarketingService(
  baseUrl?: string
): MarketingService {
  if (!marketingServiceInstance) {
    marketingServiceInstance = new MarketingService(baseUrl);
  }
  return marketingServiceInstance;
}

export function resetMarketingService(): void {
  if (marketingServiceInstance) {
    marketingServiceInstance.clearCache();
    marketingServiceInstance.reset();
  }
  marketingServiceInstance = null;
}

// Default export for convenience
export default MarketingService;
