import logger from './utils/logger';

// Merchant Service - Core business metrics and analytics
// Provides merchant stats, tier management, and QR code functionality
// Enhanced with error handling, retry logic, and loading states

import {
  withRetry,
  withErrorHandling,
  showToast,
  showNetworkErrorToast,
  LoadingState,
  AppError,
  NetworkError,
  ServerError,
  ValidationError,
  NotFoundError,
} from './errors';

export interface MerchantStats {
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  qrScans: number;
  activeOffers: number;
  customerRetention: number;
  growthRate: number;
}

export interface MerchantTier {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  benefits: string[];
  nextTier: string;
  revenueToNextTier: number;
  currentRevenue: number;
  requiredRevenue: number;
  perks: TierPerks;
}

export interface TierPerks {
  maxQRCodes: number;
  maxOffers: number;
  cashbackPercentage: number;
  analyticsLevel: 'basic' | 'advanced' | 'premium';
  supportPriority: 'standard' | 'priority' | 'dedicated';
  featuredListing: boolean;
  apiAccess: boolean;
}

export interface QRCode {
  id: string;
  merchantId: string;
  name: string;
  type: 'table' | 'product' | 'promotional' | 'feedback' | 'loyalty';
  targetUrl: string;
  shortCode: string;
  scanCount: number;
  uniqueScans: number;
  lastScannedAt?: string;
  createdAt: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface QRCodeStats {
  totalScans: number;
  uniqueUsers: number;
  averageScanTime: number;
  conversionRate: number;
  peakHours: Array<{ hour: number; count: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
}

export interface Offer {
  id: string;
  merchantId: string;
  title: string;
  description: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'bundle' | 'loyalty';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  redemptions: number;
  targetAudience?: 'all' | 'new' | 'returning' | 'vip';
  applicableProducts?: string[];
  applicableCategories?: string[];
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferStats {
  totalOffers: number;
  activeOffers: number;
  totalRedemptions: number;
  totalSavings: number;
  averageOfferValue: number;
  topPerformingOffers: Offer[];
}

export interface MerchantHealthScore {
  overall: number;
  components: {
    revenue: { score: number; weight: number; trend: 'up' | 'down' | 'stable' };
    orders: { score: number; weight: number; trend: 'up' | 'down' | 'stable' };
    customerSatisfaction: { score: number; weight: number; trend: 'up' | 'down' | 'stable' };
    engagement: { score: number; weight: number; trend: 'up' | 'down' | 'stable' };
    offerPerformance: { score: number; weight: number; trend: 'up' | 'down' | 'stable' };
  };
  lastUpdated: string;
  insights: HealthInsight[];
}

export interface HealthInsight {
  type: 'positive' | 'warning' | 'critical';
  title: string;
  description: string;
  action?: string;
}

export interface RevenueChartData {
  period: string;
  revenue: number;
  orders: number;
  customers: number;
}

export interface RevenueBreakdown {
  byPaymentMethod: Array<{ method: string; amount: number; percentage: number }>;
  byCategory: Array<{ category: string; amount: number; percentage: number }>;
  byTimeOfDay: Array<{ hour: number; amount: number }>;
}

// Order stats from rez-order-service
export interface OrderStats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  growthRateToday: number;
  growthRateWeek: number;
  growthRateMonth: number;
}

// Revenue stats from rez-finance-service
export interface RevenueStats {
  merchantId: string;
  currentPeriod: {
    revenue: number;
    transactionCount: number;
    avgTransactionValue: number;
  };
  previousPeriod: {
    revenue: number;
  };
  growthRate: number;
  dailyRevenue: number;
}

// Review stats from rez-merchant-service
export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  recentReviews: number;
  ratingDistribution: Record<string, number>;
  positiveReviewCount: number;
  negativeReviewCount: number;
  responseRate: number;
  sentimentScore: number;
}

// Service URLs
const ORDER_SERVICE_URL =
  process.env.EXPO_PUBLIC_ORDER_SERVICE_URL || 'https://rez-order-service.onrender.com';
const FINANCE_SERVICE_URL =
  process.env.EXPO_PUBLIC_FINANCE_SERVICE_URL || 'https://rez-finance-service.onrender.com';

// Loading state types for each service method
export interface MerchantServiceState {
  stats: LoadingState<MerchantStats>;
  tier: LoadingState<MerchantTier>;
  qrCodes: LoadingState<QRCode[]>;
  qrCodeStats: LoadingState<QRCodeStats>;
  offers: LoadingState<Offer[]>;
  offerStats: LoadingState<OfferStats>;
  healthScore: LoadingState<MerchantHealthScore>;
  revenueChart: LoadingState<RevenueChartData[]>;
  revenueBreakdown: LoadingState<RevenueBreakdown>;
}

// Mock data for development
const MOCK_STATS: MerchantStats = {
  dailyRevenue: 1250.5,
  weeklyRevenue: 8750.0,
  monthlyRevenue: 35000.0,
  totalOrders: 142,
  avgOrderValue: 87.5,
  qrScans: 89,
  activeOffers: 3,
  customerRetention: 68.5,
  growthRate: 12.3,
};

const MOCK_TIER: MerchantTier = {
  tier: 'silver',
  benefits: [
    'Up to 50 QR codes',
    'Advanced analytics dashboard',
    'Priority support',
    'Up to 10 active offers',
  ],
  nextTier: 'gold',
  revenueToNextTier: 15000.0,
  currentRevenue: 35000.0,
  requiredRevenue: 50000.0,
  perks: {
    maxQRCodes: 50,
    maxOffers: 10,
    cashbackPercentage: 5,
    analyticsLevel: 'advanced',
    supportPriority: 'priority',
    featuredListing: false,
    apiAccess: false,
  },
};

// API base URL
const MERCHANT_SERVICE_URL =
  process.env.EXPO_PUBLIC_MERCHANT_SERVICE_URL || 'https://rez-merchant-service.onrender.com';

// Internal service token for service-to-service calls
const getInternalHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
});

/**
 * Fetch order statistics from rez-order-service
 */
export async function fetchOrderStats(merchantId: string): Promise<OrderStats | null> {
  try {
    const response = await fetch(`${ORDER_SERVICE_URL}/orders/stats/${merchantId}`, {
      headers: getInternalHeaders(),
    });
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.warn('[MerchantService] Failed to fetch order stats from service:', error);
  }
  return null;
}

/**
 * Fetch revenue statistics from rez-finance-service
 */
export async function fetchRevenueStats(merchantId: string): Promise<RevenueStats | null> {
  try {
    const response = await fetch(
      `${FINANCE_SERVICE_URL}/internal/finance/merchants/${merchantId}/revenue`,
      { headers: getInternalHeaders() }
    );
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.warn('[MerchantService] Failed to fetch revenue stats from finance service:', error);
  }
  return null;
}

/**
 * Fetch review statistics from rez-merchant-service
 */
export async function fetchReviewStats(merchantId: string): Promise<ReviewStats | null> {
  try {
    const response = await fetch(
      `${MERCHANT_SERVICE_URL}/internal/merchants/${merchantId}/reviews/stats`,
      { headers: getInternalHeaders() }
    );
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.warn('[MerchantService] Failed to fetch review stats from merchant service:', error);
  }
  return null;
}

// Retry configuration
const RETRY_CONFIG = {
  retries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
};

/**
 * Fetch with error handling and retry
 */
async function fetchWithRetry<T>(
  url: string,
  fallbackData: T,
  options: { method?: string; body?: unknown; useMockOnError?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, useMockOnError = true } = options;

  try {
    const result = await withRetry(async () => {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new NotFoundError('Resource');
        }
        if (response.status >= 500) {
          throw new ServerError(`Server error: ${response.status}`, response.status);
        }
        throw new AppError(
          `Request failed: ${response.statusText}`,
          'HTTP_ERROR',
          response.status
        );
      }

      return await response.json() as T;
    }, RETRY_CONFIG);

    return result;
  } catch (error) {
    if (error instanceof NetworkError) {
      showNetworkErrorToast();
    }

    if (useMockOnError) {
      logger.warn(`API call failed, using mock data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return fallbackData;
    }

    throw error;
  }
}

// ============================================
// Service Methods with Error Handling
// ============================================

/**
 * Get merchant statistics
 */
export async function getMerchantStats(merchantId: string): Promise<MerchantStats> {
  return fetchWithRetry(
    `${MERCHANT_SERVICE_URL}/api/merchants/${merchantId}/stats`,
    { ...MOCK_STATS },
    { useMockOnError: true }
  );
}

/**
 * Get merchant statistics with loading state
 */
export async function getMerchantStatsWithState(
  merchantId: string,
  setState?: (state: Partial<MerchantServiceState>) => void
): Promise<MerchantStats> {
  if (setState) {
    setState({ stats: { data: null, loading: true, error: null, refetch: () => getMerchantStatsWithState(merchantId, setState) } });
  }

  try {
    const data = await getMerchantStats(merchantId);
    if (setState) {
      setState({ stats: { data, loading: false, error: null, refetch: () => getMerchantStatsWithState(merchantId, setState) } });
    }
    return data;
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('Failed to load stats');
    if (setState) {
      setState({ stats: { data: null, loading: false, error: appError, refetch: () => getMerchantStatsWithState(merchantId, setState) } });
    }
    throw appError;
  }
}

/**
 * Get merchant tier information
 */
export async function getMerchantTier(merchantId: string): Promise<MerchantTier> {
  return fetchWithRetry(
    `${MERCHANT_SERVICE_URL}/api/merchants/${merchantId}/tier`,
    { ...MOCK_TIER },
    { useMockOnError: true }
  );
}

/**
 * Get merchant tier with loading state
 */
export async function getMerchantTierWithState(
  merchantId: string,
  setState?: (state: Partial<MerchantServiceState>) => void
): Promise<MerchantTier> {
  if (setState) {
    setState({ tier: { data: null, loading: true, error: null, refetch: () => getMerchantTierWithState(merchantId, setState) } });
  }

  try {
    const data = await getMerchantTier(merchantId);
    if (setState) {
      setState({ tier: { data, loading: false, error: null, refetch: () => getMerchantTierWithState(merchantId, setState) } });
    }
    return data;
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('Failed to load tier');
    if (setState) {
      setState({ tier: { data: null, loading: false, error: appError, refetch: () => getMerchantTierWithState(merchantId, setState) } });
    }
    throw appError;
  }
}

/**
 * Get QR codes for a merchant
 */
export async function getQRCodes(merchantId: string): Promise<QRCode[]> {
  return fetchWithRetry(
    `${MERCHANT_SERVICE_URL}/api/merchants/${merchantId}/qrcodes`,
    generateMockQRCodes(merchantId),
    { useMockOnError: true }
  );
}

/**
 * Get QR codes with loading state
 */
export async function getQRCodesWithState(
  merchantId: string,
  setState?: (state: Partial<MerchantServiceState>) => void
): Promise<QRCode[]> {
  if (setState) {
    setState({ qrCodes: { data: null, loading: true, error: null, refetch: () => getQRCodesWithState(merchantId, setState) } });
  }

  try {
    const data = await getQRCodes(merchantId);
    if (setState) {
      setState({ qrCodes: { data, loading: false, error: null, refetch: () => getQRCodesWithState(merchantId, setState) } });
    }
    return data;
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('Failed to load QR codes');
    if (setState) {
      setState({ qrCodes: { data: null, loading: false, error: appError, refetch: () => getQRCodesWithState(merchantId, setState) } });
    }
    throw appError;
  }
}

/**
 * Create a new QR code
 */
export async function createQRCode(merchantId: string, qrData: Partial<QRCode>): Promise<QRCode> {
  const newQR: QRCode = {
    id: `qr_${Date.now()}`,
    merchantId,
    name: qrData.name || 'New QR Code',
    type: qrData.type || 'table',
    targetUrl: qrData.targetUrl || `https://rez.app/merchant/${merchantId}`,
    shortCode: generateShortCode(),
    scanCount: 0,
    uniqueScans: 0,
    createdAt: new Date().toISOString(),
    isActive: true,
    metadata: qrData.metadata,
  };
  return newQR;
}

/**
 * Create QR code with error handling
 */
export async function createQRCodeWithError(
  merchantId: string,
  qrData: Partial<QRCode>,
  options: { showToast?: boolean } = {}
): Promise<QRCode> {
  try {
    // Validate input
    if (!qrData.name || qrData.name.trim().length === 0) {
      throw new ValidationError('QR code name is required', 'name');
    }
    if (!qrData.type) {
      throw new ValidationError('QR code type is required', 'type');
    }

    const result = await withRetry(async () => {
      const response = await fetch(`${MERCHANT_SERVICE_URL}/api/merchants/${merchantId}/qrcodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qrData),
      });

      if (!response.ok) {
        throw new AppError(`Failed to create QR code: ${response.statusText}`, 'CREATE_ERROR', response.status);
      }

      return await response.json() as QRCode;
    }, RETRY_CONFIG);

    if (options.showToast !== false) {
      showToast('success', 'QR Code Created', 'Your new QR code has been created successfully');
    }

    return result;
  } catch (error) {
    if (error instanceof AppError) {
      if (options.showToast !== false) {
        showToast('error', 'Failed to Create QR Code', error.message);
      }
      throw error;
    }
    const appError = new AppError('Failed to create QR code', 'UNKNOWN_ERROR');
    if (options.showToast !== false) {
      showToast('error', 'Failed to Create QR Code');
    }
    throw appError;
  }
}

/**
 * Get QR code statistics
 */
export async function getQRCodeStats(qrId: string): Promise<QRCodeStats> {
  return fetchWithRetry(
    `${MERCHANT_SERVICE_URL}/api/qrcodes/${qrId}/stats`,
    {
      totalScans: 156,
      uniqueUsers: 89,
      averageScanTime: 45,
      conversionRate: 23.5,
      peakHours: [
        { hour: 12, count: 45 },
        { hour: 19, count: 38 },
        { hour: 13, count: 25 },
      ],
      deviceBreakdown: [
        { device: 'iOS', count: 89 },
        { device: 'Android', count: 67 },
      ],
    },
    { useMockOnError: true }
  );
}

/**
 * Get QR code stats with loading state
 */
export async function getQRCodeStatsWithState(
  qrId: string,
  setState?: (state: Partial<MerchantServiceState>) => void
): Promise<QRCodeStats> {
  if (setState) {
    setState({ qrCodeStats: { data: null, loading: true, error: null, refetch: () => getQRCodeStatsWithState(qrId, setState) } });
  }

  try {
    const data = await getQRCodeStats(qrId);
    if (setState) {
      setState({ qrCodeStats: { data, loading: false, error: null, refetch: () => getQRCodeStatsWithState(qrId, setState) } });
    }
    return data;
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('Failed to load QR stats');
    if (setState) {
      setState({ qrCodeStats: { data: null, loading: false, error: appError, refetch: () => getQRCodeStatsWithState(qrId, setState) } });
    }
    throw appError;
  }
}

/**
 * Get offers for a merchant
 */
export async function getOffers(merchantId: string): Promise<Offer[]> {
  return fetchWithRetry(
    `${MERCHANT_SERVICE_URL}/api/merchants/${merchantId}/offers`,
    generateMockOffers(merchantId),
    { useMockOnError: true }
  );
}

/**
 * Get offers with loading state
 */
export async function getOffersWithState(
  merchantId: string,
  setState?: (state: Partial<MerchantServiceState>) => void
): Promise<Offer[]> {
  if (setState) {
    setState({ offers: { data: null, loading: true, error: null, refetch: () => getOffersWithState(merchantId, setState) } });
  }

  try {
    const data = await getOffers(merchantId);
    if (setState) {
      setState({ offers: { data, loading: false, error: null, refetch: () => getOffersWithState(merchantId, setState) } });
    }
    return data;
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('Failed to load offers');
    if (setState) {
      setState({ offers: { data: null, loading: false, error: appError, refetch: () => getOffersWithState(merchantId, setState) } });
    }
    throw appError;
  }
}

/**
 * Create a new offer
 */
export async function createOffer(merchantId: string, offerData: Partial<Offer>): Promise<Offer> {
  const newOffer: Offer = {
    id: `offer_${Date.now()}`,
    merchantId,
    title: offerData.title || 'New Offer',
    description: offerData.description || '',
    type: offerData.type || 'percentage',
    value: offerData.value || 10,
    minPurchase: offerData.minPurchase,
    maxDiscount: offerData.maxDiscount,
    startDate: offerData.startDate || new Date().toISOString(),
    endDate: offerData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    usageLimit: offerData.usageLimit,
    usageCount: 0,
    redemptions: 0,
    targetAudience: offerData.targetAudience || 'all',
    applicableProducts: offerData.applicableProducts,
    applicableCategories: offerData.applicableCategories,
    terms: offerData.terms,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return newOffer;
}

/**
 * Create offer with error handling
 */
export async function createOfferWithError(
  merchantId: string,
  offerData: Partial<Offer>,
  options: { showToast?: boolean } = {}
): Promise<Offer> {
  try {
    // Validate input
    if (!offerData.title || offerData.title.trim().length === 0) {
      throw new ValidationError('Offer title is required', 'title');
    }
    if (offerData.value === undefined || offerData.value <= 0) {
      throw new ValidationError('Offer value must be greater than 0', 'value');
    }

    const result = await withRetry(async () => {
      const response = await fetch(`${MERCHANT_SERVICE_URL}/api/merchants/${merchantId}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offerData),
      });

      if (!response.ok) {
        throw new AppError(`Failed to create offer: ${response.statusText}`, 'CREATE_ERROR', response.status);
      }

      return await response.json() as Offer;
    }, RETRY_CONFIG);

    if (options.showToast !== false) {
      showToast('success', 'Offer Created', 'Your new offer has been created successfully');
    }

    return result;
  } catch (error) {
    if (error instanceof AppError) {
      if (options.showToast !== false) {
        showToast('error', 'Failed to Create Offer', error.message);
      }
      throw error;
    }
    const appError = new AppError('Failed to create offer', 'UNKNOWN_ERROR');
    if (options.showToast !== false) {
      showToast('error', 'Failed to Create Offer');
    }
    throw appError;
  }
}

/**
 * Update an offer
 */
export async function updateOffer(offerId: string, updates: Partial<Offer>): Promise<Offer> {
  return withRetry(async () => {
    const response = await fetch(`${MERCHANT_SERVICE_URL}/api/offers/${offerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new NotFoundError('Offer');
      }
      throw new AppError(`Failed to update offer: ${response.statusText}`, 'UPDATE_ERROR', response.status);
    }

    return await response.json() as Offer;
  }, RETRY_CONFIG);
}

/**
 * Update offer with error handling
 */
export async function updateOfferWithError(
  offerId: string,
  updates: Partial<Offer>,
  options: { showToast?: boolean } = {}
): Promise<Offer> {
  try {
    const result = await updateOffer(offerId, updates);
    if (options.showToast !== false) {
      showToast('success', 'Offer Updated', 'Your offer has been updated successfully');
    }
    return result;
  } catch (error) {
    if (error instanceof AppError) {
      if (options.showToast !== false) {
        showToast('error', 'Failed to Update Offer', error.message);
      }
      throw error;
    }
    const appError = new AppError('Failed to update offer', 'UNKNOWN_ERROR');
    if (options.showToast !== false) {
      showToast('error', 'Failed to Update Offer');
    }
    throw appError;
  }
}

/**
 * Get offer statistics
 */
export async function getOfferStats(merchantId: string): Promise<OfferStats> {
  try {
    const offers = await getOffers(merchantId);
    const activeOffers = offers.filter((o) => o.isActive);
    const topOffers = offers.sort((a, b) => b.redemptions - a.redemptions).slice(0, 5);

    return {
      totalOffers: offers.length,
      activeOffers: activeOffers.length,
      totalRedemptions: offers.reduce((sum, o) => sum + o.redemptions, 0),
      totalSavings: offers.reduce((sum, o) => sum + o.redemptions * (o.value / 100) * 50, 0),
      averageOfferValue:
        offers.length > 0 ? offers.reduce((sum, o) => sum + o.value, 0) / offers.length : 0,
      topPerformingOffers: topOffers,
    };
  } catch (error) {
    if (error instanceof NetworkError) {
      showNetworkErrorToast();
    }
    throw error;
  }
}

/**
 * Get offer stats with loading state
 */
export async function getOfferStatsWithState(
  merchantId: string,
  setState?: (state: Partial<MerchantServiceState>) => void
): Promise<OfferStats> {
  if (setState) {
    setState({ offerStats: { data: null, loading: true, error: null, refetch: () => getOfferStatsWithState(merchantId, setState) } });
  }

  try {
    const data = await getOfferStats(merchantId);
    if (setState) {
      setState({ offerStats: { data, loading: false, error: null, refetch: () => getOfferStatsWithState(merchantId, setState) } });
    }
    return data;
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('Failed to load offer stats');
    if (setState) {
      setState({ offerStats: { data: null, loading: false, error: appError, refetch: () => getOfferStatsWithState(merchantId, setState) } });
    }
    throw appError;
  }
}

/**
 * Calculate merchant health score from REAL data
 */
export async function getMerchantHealthScore(merchantId: string): Promise<MerchantHealthScore> {
  try {
    // Fetch all real data in parallel
    const [orderStats, revenueStats, reviewStats, qrCodes] = await Promise.all([
      fetchOrderStats(merchantId),
      fetchRevenueStats(merchantId),
      fetchReviewStats(merchantId),
      getQRCodes(merchantId).catch(() => []),
    ]);

    // If we have real data, calculate health score
    if (orderStats || revenueStats) {
      const healthScore = calculateHealthScoreFromRealData(
        orderStats,
        revenueStats,
        reviewStats,
        qrCodes
      );

      // Generate insights from real data
      healthScore.insights = generateHealthInsightsFromRealData(
        healthScore,
        orderStats,
        revenueStats,
        reviewStats
      );

      return healthScore;
    }

    // Fall back to API or mock
    return fetchWithRetry(
      `${MERCHANT_SERVICE_URL}/api/merchants/${merchantId}/health`,
      calculateMockHealthScore(),
      { useMockOnError: true }
    );
  } catch {
    // Final fallback
    return calculateMockHealthScore();
  }
}

/**
 * Calculate health score from real data
 */
function calculateHealthScoreFromRealData(
  orderStats: OrderStats | null,
  revenueStats: RevenueStats | null,
  reviewStats: ReviewStats | null,
  qrCodes: QRCode[]
): MerchantHealthScore {
  // Revenue component (30% weight)
  const revenueScore = calculateRevenueScore(revenueStats, orderStats);

  // Orders component (25% weight)
  const ordersScore = calculateOrdersScore(orderStats);

  // Customer Satisfaction component (20% weight)
  const satisfactionScore = calculateSatisfactionScore(reviewStats);

  // Engagement component (15% weight)
  const engagementScore = calculateEngagementScore(qrCodes);

  // Offer Performance component (10% weight)
  const offerScore = calculateOfferPerformanceScore(qrCodes);

  // Calculate weighted overall score
  const overall = Math.round(
    revenueScore * 0.30 +
    ordersScore * 0.25 +
    satisfactionScore * 0.20 +
    engagementScore * 0.15 +
    offerScore * 0.10
  );

  // Determine trends (comparing current vs previous)
  const revenueTrend = determineTrend(revenueStats?.growthRate ?? 0, 0);
  const ordersTrend = determineTrend(
    (orderStats?.growthRateWeek ?? 0),
    0
  );
  const satisfactionTrend = determineTrend(
    (reviewStats?.sentimentScore ?? 50),
    50
  );
  const engagementTrend = 'stable' as const;
  const offerTrend = 'stable' as const;

  return {
    overall,
    components: {
      revenue: { score: revenueScore, weight: 30, trend: revenueTrend },
      orders: { score: ordersScore, weight: 25, trend: ordersTrend },
      customerSatisfaction: { score: satisfactionScore, weight: 20, trend: satisfactionTrend },
      engagement: { score: engagementScore, weight: 15, trend: engagementTrend },
      offerPerformance: { score: offerScore, weight: 10, trend: offerTrend },
    },
    lastUpdated: new Date().toISOString(),
    insights: [],
  };
}

/**
 * Calculate revenue score based on thresholds
 */
function calculateRevenueScore(
  revenueStats: RevenueStats | null,
  orderStats: OrderStats | null
): number {
  // Use daily revenue as primary metric
  const dailyRevenue = revenueStats?.dailyRevenue ?? orderStats?.revenueToday ?? 0;
  const growthRate = revenueStats?.growthRate ?? orderStats?.growthRateToday ?? 0;

  // Score based on daily revenue thresholds
  let revenueScore: number;
  if (dailyRevenue >= 5000) revenueScore = 100;
  else if (dailyRevenue >= 2000) revenueScore = 80;
  else if (dailyRevenue >= 1000) revenueScore = 60;
  else if (dailyRevenue >= 500) revenueScore = 40;
  else if (dailyRevenue > 0) revenueScore = 20;
  else revenueScore = 0;

  // Growth bonus/penalty
  let growthModifier = 0;
  if (growthRate > 20) growthModifier = 10;
  else if (growthRate > 10) growthModifier = 5;
  else if (growthRate > 0) growthModifier = 2;
  else if (growthRate < -10) growthModifier = -10;
  else if (growthRate < 0) growthModifier = -5;

  return Math.min(100, Math.max(0, revenueScore + growthModifier));
}

/**
 * Calculate orders score
 */
function calculateOrdersScore(orderStats: OrderStats | null): number {
  const totalOrders = orderStats?.completedOrders ?? 0;
  const avgOrderValue = orderStats?.avgOrderValue ?? 0;

  // Score based on order volume
  let volumeScore: number;
  if (totalOrders >= 100) volumeScore = 100;
  else if (totalOrders >= 50) volumeScore = 80;
  else if (totalOrders >= 20) volumeScore = 60;
  else if (totalOrders >= 10) volumeScore = 40;
  else if (totalOrders > 0) volumeScore = 20;
  else volumeScore = 0;

  // Score based on avg order value
  let valueScore: number;
  if (avgOrderValue >= 500) valueScore = 100;
  else if (avgOrderValue >= 200) valueScore = 80;
  else if (avgOrderValue >= 100) valueScore = 60;
  else if (avgOrderValue >= 50) valueScore = 40;
  else if (avgOrderValue > 0) valueScore = 20;
  else valueScore = 0;

  return Math.round((volumeScore * 0.6 + valueScore * 0.4));
}

/**
 * Calculate customer satisfaction score
 */
function calculateSatisfactionScore(reviewStats: ReviewStats | null): number {
  const avgRating = reviewStats?.averageRating ?? 0;
  const sentimentScore = reviewStats?.sentimentScore ?? 50;
  const totalReviews = reviewStats?.totalReviews ?? 0;

  // Rating score (out of 5 stars)
  let ratingScore: number;
  if (avgRating >= 4.5) ratingScore = 100;
  else if (avgRating >= 4.0) ratingScore = 80;
  else if (avgRating >= 3.5) ratingScore = 60;
  else if (avgRating >= 3.0) ratingScore = 40;
  else if (avgRating > 0) ratingScore = 20;
  else ratingScore = 50; // Neutral if no reviews

  // Sentiment score adjustment
  let sentimentAdjustment = 0;
  if (sentimentScore >= 80) sentimentAdjustment = 5;
  else if (sentimentScore >= 60) sentimentAdjustment = 0;
  else if (sentimentScore >= 40) sentimentAdjustment = -10;
  else sentimentAdjustment = -20;

  // Volume bonus for having reviews
  let volumeBonus = 0;
  if (totalReviews >= 50) volumeBonus = 5;
  else if (totalReviews >= 20) volumeBonus = 3;
  else if (totalReviews >= 5) volumeBonus = 1;

  return Math.min(100, Math.max(0, ratingScore + sentimentAdjustment + volumeBonus));
}

/**
 * Calculate engagement score based on QR scans
 */
function calculateEngagementScore(qrCodes: QRCode[]): number {
  const totalScans = qrCodes.reduce((sum, qr) => sum + (qr.scanCount || 0), 0);
  const activeCodes = qrCodes.filter(qr => qr.isActive).length;

  // Score based on total scans
  let scanScore: number;
  if (totalScans >= 500) scanScore = 100;
  else if (totalScans >= 200) scanScore = 80;
  else if (totalScans >= 100) scanScore = 60;
  else if (totalScans >= 50) scanScore = 40;
  else if (totalScans > 0) scanScore = 20;
  else scanScore = 0;

  // Active codes bonus
  let activeBonus = 0;
  if (activeCodes >= 10) activeBonus = 10;
  else if (activeCodes >= 5) activeBonus = 5;
  else if (activeCodes >= 2) activeBonus = 2;

  return Math.min(100, scanScore + activeBonus);
}

/**
 * Calculate offer performance score
 */
function calculateOfferPerformanceScore(qrCodes: QRCode[]): number {
  const promotionalCodes = qrCodes.filter(qr =>
    qr.type === 'promotional' && qr.isActive
  );

  // Score based on promotional codes
  let score: number;
  if (promotionalCodes.length >= 5) score = 100;
  else if (promotionalCodes.length >= 3) score = 80;
  else if (promotionalCodes.length >= 2) score = 60;
  else if (promotionalCodes.length >= 1) score = 40;
  else score = 20; // Need at least one promo

  return score;
}

/**
 * Determine trend from percentage change
 */
function determineTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  const diff = current - previous;
  if (diff > 5) return 'up';
  if (diff < -5) return 'down';
  return 'stable';
}

/**
 * Generate health insights from real data
 */
function generateHealthInsightsFromRealData(
  healthScore: MerchantHealthScore,
  orderStats: OrderStats | null,
  revenueStats: RevenueStats | null,
  reviewStats: ReviewStats | null
): HealthInsight[] {
  const insights: HealthInsight[] = [];

  // Overall score insight
  if (healthScore.overall >= 80) {
    insights.push({
      type: 'positive',
      title: 'Excellent Performance',
      description: `Your merchant health score is ${healthScore.overall}. Keep up the great work!`,
    });
  } else if (healthScore.overall < 50) {
    insights.push({
      type: 'critical',
      title: 'Health Score Alert',
      description: `Your health score is ${healthScore.overall}. Review your performance metrics.`,
      action: 'Focus on improving revenue and order volume.',
    });
  }

  // Revenue insight
  const dailyRevenue = revenueStats?.dailyRevenue ?? orderStats?.revenueToday ?? 0;
  const growthRate = revenueStats?.growthRate ?? orderStats?.growthRateMonth ?? 0;
  if (dailyRevenue > 0 && growthRate > 0) {
    insights.push({
      type: 'positive',
      title: 'Revenue Growth',
      description: `Your revenue has increased by ${growthRate.toFixed(1)}% compared to last period.`,
    });
  } else if (dailyRevenue > 0 && growthRate < 0) {
    insights.push({
      type: 'warning',
      title: 'Revenue Decline',
      description: `Your revenue has decreased by ${Math.abs(growthRate).toFixed(1)}%. Consider promotional strategies.`,
      action: 'Create a special offer to boost sales.',
    });
  }

  // Order volume insight
  const totalOrders = orderStats?.completedOrders ?? 0;
  if (totalOrders >= 50) {
    insights.push({
      type: 'positive',
      title: 'Strong Order Volume',
      description: `You've completed ${totalOrders} orders. Great job!`,
    });
  } else if (totalOrders < 10) {
    insights.push({
      type: 'warning',
      title: 'Low Order Volume',
      description: `Only ${totalOrders} orders completed. Consider marketing campaigns.`,
      action: 'Run a promotional offer to attract customers.',
    });
  }

  // Customer satisfaction insight
  const avgRating = reviewStats?.averageRating ?? 0;
  if (avgRating >= 4.5) {
    insights.push({
      type: 'positive',
      title: 'Excellent Ratings',
      description: `Your average rating is ${avgRating.toFixed(1)} stars. Customers love you!`,
    });
  } else if (avgRating > 0 && avgRating < 3.5) {
    insights.push({
      type: 'warning',
      title: 'Rating Improvement Needed',
      description: `Your rating is ${avgRating.toFixed(1)} stars. Focus on customer experience.`,
      action: 'Address common customer complaints.',
    });
  }

  // Sort by type priority
  const typeOrder = { critical: 0, warning: 1, positive: 2 };
  insights.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

  return insights.slice(0, 5);
}

/**
 * Get health score with loading state
 */
export async function getMerchantHealthScoreWithState(
  merchantId: string,
  setState?: (state: Partial<MerchantServiceState>) => void
): Promise<MerchantHealthScore> {
  if (setState) {
    setState({ healthScore: { data: null, loading: true, error: null, refetch: () => getMerchantHealthScoreWithState(merchantId, setState) } });
  }

  try {
    const data = await getMerchantHealthScore(merchantId);
    if (setState) {
      setState({ healthScore: { data, loading: false, error: null, refetch: () => getMerchantHealthScoreWithState(merchantId, setState) } });
    }
    return data;
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('Failed to load health score');
    if (setState) {
      setState({ healthScore: { data: null, loading: false, error: appError, refetch: () => getMerchantHealthScoreWithState(merchantId, setState) } });
    }
    throw appError;
  }
}

/**
 * Get revenue chart data
 */
export async function getRevenueChartData(
  merchantId: string,
  period: 'day' | 'week' | 'month' | 'year' = 'week'
): Promise<RevenueChartData[]> {
  return fetchWithRetry(
    `${MERCHANT_SERVICE_URL}/api/merchants/${merchantId}/revenue?period=${period}`,
    generateMockRevenueData(period),
    { useMockOnError: true }
  );
}

/**
 * Get revenue chart data with loading state
 */
export async function getRevenueChartDataWithState(
  merchantId: string,
  period: 'day' | 'week' | 'month' | 'year' = 'week',
  setState?: (state: Partial<MerchantServiceState>) => void
): Promise<RevenueChartData[]> {
  if (setState) {
    setState({ revenueChart: { data: null, loading: true, error: null, refetch: () => getRevenueChartDataWithState(merchantId, period, setState) } });
  }

  try {
    const data = await getRevenueChartData(merchantId, period);
    if (setState) {
      setState({ revenueChart: { data, loading: false, error: null, refetch: () => getRevenueChartDataWithState(merchantId, period, setState) } });
    }
    return data;
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('Failed to load revenue data');
    if (setState) {
      setState({ revenueChart: { data: null, loading: false, error: appError, refetch: () => getRevenueChartDataWithState(merchantId, period, setState) } });
    }
    throw appError;
  }
}

/**
 * Get revenue breakdown
 */
export async function getRevenueBreakdown(merchantId: string): Promise<RevenueBreakdown> {
  return fetchWithRetry(
    `${MERCHANT_SERVICE_URL}/api/merchants/${merchantId}/revenue/breakdown`,
    {
      byPaymentMethod: [
        { method: 'UPI', amount: 15000, percentage: 42.8 },
        { method: 'Card', amount: 10000, percentage: 28.6 },
        { method: 'Wallet', amount: 7000, percentage: 20.0 },
        { method: 'Cash', amount: 3000, percentage: 8.6 },
      ],
      byCategory: [
        { category: 'Food', amount: 20000, percentage: 57.1 },
        { category: 'Beverages', amount: 10000, percentage: 28.6 },
        { category: 'Desserts', amount: 5000, percentage: 14.3 },
      ],
      byTimeOfDay: [
        { hour: 8, amount: 500 },
        { hour: 12, amount: 5000 },
        { hour: 18, amount: 8000 },
        { hour: 21, amount: 3000 },
      ],
    },
    { useMockOnError: true }
  );
}

/**
 * Get revenue breakdown with loading state
 */
export async function getRevenueBreakdownWithState(
  merchantId: string,
  setState?: (state: Partial<MerchantServiceState>) => void
): Promise<RevenueBreakdown> {
  if (setState) {
    setState({ revenueBreakdown: { data: null, loading: true, error: null, refetch: () => getRevenueBreakdownWithState(merchantId, setState) } });
  }

  try {
    const data = await getRevenueBreakdown(merchantId);
    if (setState) {
      setState({ revenueBreakdown: { data, loading: false, error: null, refetch: () => getRevenueBreakdownWithState(merchantId, setState) } });
    }
    return data;
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('Failed to load revenue breakdown');
    if (setState) {
      setState({ revenueBreakdown: { data: null, loading: false, error: appError, refetch: () => getRevenueBreakdownWithState(merchantId, setState) } });
    }
    throw appError;
  }
}

// ============================================
// Pull to Refresh Support
// ============================================

export interface RefreshableMerchantData {
  stats: MerchantStats | null;
  tier: MerchantTier | null;
  qrCodes: QRCode[];
  offers: Offer[];
  healthScore: MerchantHealthScore | null;
  revenueChart: RevenueChartData[];
  revenueBreakdown: RevenueBreakdown | null;
}

export interface RefreshState {
  refreshing: boolean;
  lastRefresh: Date | null;
}

export async function refreshAllMerchantData(
  merchantId: string,
  onProgress: (update: Partial<RefreshableMerchantData>) => void,
  onRefreshState: (state: RefreshState) => void
): Promise<RefreshableMerchantData> {
  onRefreshState({ refreshing: true, lastRefresh: null });

  const results: RefreshableMerchantData = {
    stats: null,
    tier: null,
    qrCodes: [],
    offers: [],
    healthScore: null,
    revenueChart: [],
    revenueBreakdown: null,
  };

  try {
    // Fetch all data in parallel with error handling
    const promises = [
      getMerchantStats(merchantId).then((data) => {
        results.stats = data;
        onProgress({ stats: data });
      }),
      getMerchantTier(merchantId).then((data) => {
        results.tier = data;
        onProgress({ tier: data });
      }),
      getQRCodes(merchantId).then((data) => {
        results.qrCodes = data;
        onProgress({ qrCodes: data });
      }),
      getOffers(merchantId).then((data) => {
        results.offers = data;
        onProgress({ offers: data });
      }),
      getMerchantHealthScore(merchantId).then((data) => {
        results.healthScore = data;
        onProgress({ healthScore: data });
      }),
      getRevenueChartData(merchantId).then((data) => {
        results.revenueChart = data;
        onProgress({ revenueChart: data });
      }),
      getRevenueBreakdown(merchantId).then((data) => {
        results.revenueBreakdown = data;
        onProgress({ revenueBreakdown: data });
      }),
    ];

    await Promise.allSettled(promises);

    onRefreshState({ refreshing: false, lastRefresh: new Date() });
    showToast('success', 'Data Refreshed', 'All data has been updated');

    return results;
  } catch (error) {
    onRefreshState({ refreshing: false, lastRefresh: new Date() });
    showToast('error', 'Refresh Failed', 'Some data could not be refreshed');
    return results;
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * FIX (security): Generate secure short code using crypto
 */
function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  // FIX (security): Use crypto for secure random code generation
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    const array = new Uint8Array(6);
    globalThis.crypto.getRandomValues(array);
    return Array.from(array, b => chars[b % chars.length]).join('');
  }
  // Node.js fallback
  try {
    const { randomBytes } = require('crypto');
    const bytes = randomBytes(6);
    return Array.from(bytes, b => chars[b % chars.length]).join('');
  } catch {
    // Legacy fallback (only for environments without crypto)
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

function generateMockQRCodes(merchantId: string): QRCode[] {
  return [
    {
      id: 'qr_001',
      merchantId,
      name: 'Table 1',
      type: 'table',
      targetUrl: `https://rez.app/m/${merchantId}/table/1`,
      shortCode: 'TBL001',
      scanCount: 145,
      uniqueScans: 89,
      lastScannedAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
    },
    {
      id: 'qr_002',
      merchantId,
      name: 'Happy Hour Promo',
      type: 'promotional',
      targetUrl: `https://rez.app/m/${merchantId}/promo/happy-hour`,
      shortCode: 'HH2024',
      scanCount: 78,
      uniqueScans: 65,
      lastScannedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
    },
    {
      id: 'qr_003',
      merchantId,
      name: 'Feedback Survey',
      type: 'feedback',
      targetUrl: `https://rez.app/m/${merchantId}/feedback`,
      shortCode: 'FBK001',
      scanCount: 234,
      uniqueScans: 198,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
    },
  ];
}

function generateMockOffers(merchantId: string): Offer[] {
  return [
    {
      id: 'offer_001',
      merchantId,
      title: '20% Off on All Items',
      description: 'Get 20% off on your entire order. Valid for dine-in only.',
      type: 'percentage',
      value: 20,
      minPurchase: 100,
      maxDiscount: 500,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      usageLimit: 100,
      usageCount: 45,
      redemptions: 42,
      targetAudience: 'all',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'offer_002',
      merchantId,
      title: 'Buy 1 Get 1 Free',
      description: 'Buy unknown main course and get a dessert free!',
      type: 'bogo',
      value: 100,
      minPurchase: 300,
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      redemptions: 28,
      targetAudience: 'all',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'offer_003',
      merchantId,
      title: 'Weekend Special - Rs. 100 Off',
      description: 'Flat Rs. 100 off on orders above Rs. 500 on weekends.',
      type: 'fixed',
      value: 100,
      minPurchase: 500,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      redemptions: 15,
      targetAudience: 'returning',
      terms: 'Valid only on Saturday and Sunday',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function calculateMockHealthScore(): MerchantHealthScore {
  return {
    overall: 78,
    components: {
      revenue: { score: 82, weight: 30, trend: 'up' },
      orders: { score: 75, weight: 25, trend: 'stable' },
      customerSatisfaction: { score: 85, weight: 20, trend: 'up' },
      engagement: { score: 70, weight: 15, trend: 'up' },
      offerPerformance: { score: 72, weight: 10, trend: 'stable' },
    },
    lastUpdated: new Date().toISOString(),
    insights: [
      {
        type: 'positive',
        title: 'Revenue Growth',
        description: 'Your revenue has increased by 12% compared to last month.',
      },
      {
        type: 'warning',
        title: 'Engagement Opportunity',
        description:
          'QR code scans have decreased by 5%. Consider adding more promotional QR codes.',
        action: 'Add 2 new promotional QR codes to increase customer engagement.',
      },
      {
        type: 'positive',
        title: 'Customer Satisfaction',
        description: 'Your rating has improved from 4.2 to 4.5 stars.',
      },
    ],
  };
}

function generateMockRevenueData(period: 'day' | 'week' | 'month' | 'year'): RevenueChartData[] {
  const data: RevenueChartData[] = [];
  const now = new Date();

  switch (period) {
    case 'day':
      for (let hour = 8; hour <= 22; hour++) {
        const baseRevenue = hour >= 12 && hour <= 14 ? 150 : hour >= 18 && hour <= 21 ? 200 : 50;
        data.push({
          period: `${hour}:00`,
          revenue: baseRevenue + Math.random() * 100,
          orders: Math.floor(Math.random() * 10) + 2,
          customers: Math.floor(Math.random() * 8) + 1,
        });
      }
      break;
    case 'week':
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      days.forEach((day) => {
        const baseRevenue = day === 'Sat' || day === 'Sun' ? 2000 : 1200;
        data.push({
          period: day,
          revenue: baseRevenue + Math.random() * 500,
          orders: Math.floor(Math.random() * 30) + 15,
          customers: Math.floor(Math.random() * 25) + 10,
        });
      });
      break;
    case 'month':
      for (let day = 1; day <= 30; day++) {
        data.push({
          period: `Day ${day}`,
          revenue: 1000 + Math.random() * 500,
          orders: Math.floor(Math.random() * 25) + 10,
          customers: Math.floor(Math.random() * 20) + 8,
        });
      }
      break;
    case 'year':
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      months.forEach((month) => {
        data.push({
          period: month,
          revenue: 25000 + Math.random() * 15000,
          orders: Math.floor(Math.random() * 400) + 200,
          customers: Math.floor(Math.random() * 300) + 150,
        });
      });
      break;
  }

  return data;
}

// ============================================
// Export default service object with all methods
// ============================================

export const merchantService = {
  // Basic methods
  getStats: getMerchantStats,
  getTier: getMerchantTier,
  getQRCodes,
  createQRCode,
  getQRCodeStats,
  getOffers,
  createOffer,
  updateOffer,
  getOfferStats,
  getHealthScore: getMerchantHealthScore,
  getRevenueChartData,
  getRevenueBreakdown,

  // Methods with loading state
  getStatsWithState: getMerchantStatsWithState,
  getTierWithState: getMerchantTierWithState,
  getQRCodesWithState: getQRCodesWithState,
  createQRCodeWithError,
  getQRCodeStatsWithState,
  getOffersWithState,
  createOfferWithError,
  updateOfferWithError,
  getOfferStatsWithState,
  getHealthScoreWithState: getMerchantHealthScoreWithState,
  getRevenueChartDataWithState,
  getRevenueBreakdownWithState,

  // Pull to refresh
  refreshAll: refreshAllMerchantData,

  // Real data fetchers for health score
  fetchOrderStats,
  fetchRevenueStats,
  fetchReviewStats,
};

export default merchantService;
