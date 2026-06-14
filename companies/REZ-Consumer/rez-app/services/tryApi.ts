// @ts-nocheck
// ReZ TRY API Service
// Handles all trial/experience discovery and booking endpoints

// FR-001 FIX: apiClient is a default export from './apiClient'. The named export
// { apiClient } does not exist, so all apiClient.request() calls below would throw
// "apiClient is undefined" at runtime. Additionally, ApiClient has no .request()
// method — the correct helpers are .get() / .post(). Both issues are fixed here.
import { logger } from '@/utils/logger';
import apiClient from './apiClient';

// Mock data fallback — imported lazily so it tree-shakes in production.
// When the backend is unreachable during development, we return this seed data
// so the full UI design is visible. Set EXPO_PUBLIC_USE_MOCK_TRY=true to force
// mock mode even when the server is reachable (useful for UI-only demos).
import {
  MOCK_TRIALS,
  MOCK_HISTORY,
  MOCK_COINS,
  MOCK_SCORE,
  MOCK_MISSIONS,
  MOCK_BADGES,
  MOCK_SURPRISE,
  MOCK_BUNDLES,
  MOCK_MY_BUNDLES,
  MOCK_CAMPAIGNS,
  MOCK_LEADERBOARD,
} from '@/utils/mocks/tryMockData';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_TRY === 'true' || __DEV__;

/**
 * Wrap unknown TRY API call with an automatic mock fallback.
 * In __DEV__, if the backend is unreachable (network error or server error),
 * the fallback value is returned silently instead of throwing.
 * In production the error propagates normally.
 */
async function withMockFallback<T>(
  apiFn: () => Promise<T>,
  fallback: T,
  label = '',
): Promise<T> {
  if (process.env.EXPO_PUBLIC_USE_MOCK_TRY === 'true') {
    // Force mock mode — skip the network call entirely
    return fallback;
  }
  try {
    return await apiFn();
  } catch (err) {
    if (__DEV__) {
      logger.debug(`[TRY MOCK] ${label} — API unreachable, using mock data.`, err?.message);
      return fallback;
    }
    throw err;
  }
}

interface TrialCard {
  id: string;
  title: string;
  category: string;
  categoryEmoji?: string;
  merchant: {
    id: string;
    name: string;
    image?: string;
  };
  image: string;
  images?: string[];
  description?: string;
  coinPrice: number;
  commitmentFee: number;
  originalPrice: number;
  distance: number;
  distanceUnit: string;
  slotsRemaining: number;
  slotsTotal: number;
  rating?: number;
  ratingCount?: number;
  expiresAt?: string;
  validDuration?: string;
  rewards?: {
    coinsEarned: number;
    brandedCoinsEarned: number;
  };
}

interface TrialFeedResponse {
  success: boolean;
  data: TrialCard[];
  meta?: {
    location?: {
      lat: number;
      lng: number;
      city?: string;
    };
  };
}

interface BookingRequest {
  trialId: string;
  commitmentFeePaymentId: string;
  userGeo: {
    lat: number;
    lng: number;
  };
}

interface BookingResponse {
  success: boolean;
  data: {
    bookingId: string;
    qrToken: string;
    qrExpiresAt: string;
    validUntil: string;
    trial: {
      id: string;
      title: string;
      merchant: string;
    };
  };
  message?: string;
}

interface HistoryItem {
  bookingId: string;
  trialId: string;
  title: string;
  merchant: string;
  merchantImage?: string;
  image: string;
  coinsPaid: number;
  commitmentFeePaid: number;
  bookingDate: string;
  status: 'active' | 'completed' | 'expired';
  qrToken?: string;
  qrExpiresAt?: string;
  validUntil?: string;
  rating?: number;
  reviewText?: string;
  completedDate?: string;
  expiredDate?: string;
}

interface CoinsData {
  totalBalance: number;
  buckets: {
    amount: number;
    expiresAt: string;
    source: 'subscription' | 'pack' | 'earned';
  }[];
  recentTransactions: Array<{
    id: string;
    type: 'earn' | 'spend' | 'expire';
    amount: number;
    description: string;
    date: string;
  }>;
}

interface ScoreData {
  score: number;
  tier: 'curious' | 'explorer' | 'adventurer' | 'pioneer';
  nextTierPoints: number;
  nextTierName: string;
  stats: {
    categoriesTried: number;
    merchantsDiscovered: number;
    currentStreak: number;
    reviewsGiven: number;
  };
  recentEvents: Array<{
    id: string;
    description: string;
    points: number;
    date: string;
    emoji?: string;
  }>;
  leaderboardPercentile?: number;
  leaderboardCity?: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  category?: string;
  categoryEmoji?: string;
  target: number;
  completed: number;
  reward: {
    rezCoins: number;
    trialCoins: number;
  };
  endsAt: string;
  isCompleted: boolean;
  isExpired: boolean;
}

interface CategoryBadge {
  category: string;
  categoryEmoji?: string;
  level: 'Newcomer' | 'Regular' | 'Expert' | 'Master';
  trialCount: number;
  nextLevelThreshold: number;
}

interface BadgesData {
  earned: CategoryBadge[];
  undiscovered: Array<{ category: string; categoryEmoji?: string }>;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  trialCount: number;
  isCurrentUser?: boolean;
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  userRank: number;
  userScore: number;
}

interface SurpriseData {
  category: string;
  categoryEmoji?: string;
  distance: string;
  expiresAt: string;
  merchant?: {
    id: string;
    name: string;
    image?: string;
  };
  trial?: {
    id: string;
    title: string;
    image?: string;
    coinPrice: number;
    originalPrice: number;
  };
  isBooked?: boolean;
}

interface Bundle {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  trialCount: number;
  trialCoinsIncluded: number;
  rezCoinsBonus: number;
  validDays: number;
  category?: string;
  isFeatured?: boolean;
}

interface ActiveBundle {
  id: string;
  name: string;
  slotsTotal: number;
  slotsUsed: number;
  expiresAt: string;
}

interface Campaign {
  id: string;
  title: string;
  description?: string;
  type: 'MISSION_SPRINT' | 'FESTIVAL' | 'CATEGORY_PUSH';
  goal: string;
  reward: string;
  endsAt: string;
  image?: string;
  isJoined: boolean;
  isCompleted: boolean;
  progress?: {
    completed: number;
    target: number;
  };
}

class TryApi {
  /**
   * Get personalized trial feed for current location
   * FR-001 FIX: replaced apiClient.request() (non-existent method) with apiClient.get<unknown>()
   */
  async getFeed(lat: number, lng: number): Promise<TrialCard[]> {
    return withMockFallback(
      async () => {
        const response = await apiClient.get<TrialFeedResponse>('/try/feed', { lat, lng });
        const payload = response.data as unknown;
        return (Array.isArray(payload) ? payload : payload?.data) || [];
      },
      MOCK_TRIALS,
      'getFeed',
    );
  }

  /**
   * Get detailed information about a specific trial
   * FR-001 FIX: replaced apiClient.request() with apiClient.get<unknown>()
   */
  async getTrialDetails(trialId: string): Promise<TrialCard | null> {
    const response = await apiClient.get<{ data: TrialCard }>(`/try/${trialId}`);
    const payload = response.data as unknown;
    return (payload?.data ?? payload) || null;
  }

  /**
   * Get detailed information about a booking
   * FR-001 FIX: replaced apiClient.request() with apiClient.get<unknown>()
   */
  async getBookingDetails(bookingId: string): Promise<unknown> {
    const response = await apiClient.get<{ data: unknown }>(`/try/bookings/${bookingId}`);
    const payload = response.data as unknown;
    return (payload?.data ?? payload) || null;
  }

  /**
   * Book a trial with commitment fee payment
   * FR-001 FIX: replaced apiClient.request() with apiClient.post<unknown>().
   * Returns the full ApiResponse wrapper so the caller can distinguish
   * success from failure (check response.success and response.data).
   *
   * The backend handler returns:
   *   { success: true, data as unknown: { bookingId, qrToken, ... }, message }
   * apiClient.post unwraps one level via (responseData.data || responseData), so
   * response.data IS the BookingResponse.data payload: { bookingId, qrToken, ... }
   * Callers should read: response.data?.bookingId (NOT response.data?.data?.bookingId)
   */
  async bookTrial(request: BookingRequest): Promise<BookingResponse & { _apiResponse: true }> {
    // Return ApiResponse shape so caller can check .success and .data.bookingId
    const response = await apiClient.post<BookingResponse['data']>('/try/book', request as unknown);
    // Construct a BookingResponse-compatible shape the existing callers expect.
    return {
      success: response.success,
      data: response.data || ({} as BookingResponse['data']),
      message: response.message,
      _apiResponse: true,
    } as unknown;
  }

  /**
   * Get user's trial history
   * FR-001 FIX: replaced apiClient.request() with apiClient.get<unknown>()
   */
  async getHistory(): Promise<HistoryItem[]> {
    return withMockFallback(
      async () => {
        const response = await apiClient.get<{ data: HistoryItem[] }>('/try/history');
        const payload = response.data as unknown;
        return (Array.isArray(payload) ? payload : payload?.data) || [];
      },
      MOCK_HISTORY,
      'getHistory',
    );
  }

  /**
   * Get trial coin wallet balance and buckets
   * FR-001 FIX: replaced apiClient.request() with apiClient.get<unknown>()
   */
  async getCoins(): Promise<CoinsData> {
    return withMockFallback(
      async () => {
        const response = await apiClient.get<{ data: CoinsData }>('/try/coins');
        const payload = response.data as unknown;
        return (payload?.data ?? payload) || { totalBalance: 0, buckets: [], recentTransactions: [] };
      },
      MOCK_COINS,
      'getCoins',
    );
  }

  /**
   * Purchase trial coins pack
   * FR-001 FIX: replaced apiClient.request() with apiClient.post<unknown>()
   * Returns ApiResponse; caller should check response.success and response.data.coinsAdded
   */
  async purchaseCoins(packIndex: number, paymentId: string): Promise<{ success: boolean; coinsAdded: number }> {
    const response = await apiClient.post<{ coinsAdded: number }>('/try/coins/purchase', { packIndex, paymentId });
    return { success: response.success, coinsAdded: (response.data as unknown)?.coinsAdded ?? 0 };
  }

  /**
   * Get explorer score and tier
   * FR-001 FIX: replaced apiClient.request() with apiClient.get<unknown>()
   */
  async getScore(): Promise<ScoreData> {
    return withMockFallback(
      async () => {
        const response = await apiClient.get<{ data: ScoreData }>('/try/score');
        const payload = response.data as unknown;
        return (payload?.data ?? payload) || {
          score: 0,
          tier: 'curious',
          nextTierPoints: 100,
          nextTierName: 'explorer',
          stats: { categoriesTried: 0, merchantsDiscovered: 0, currentStreak: 0, reviewsGiven: 0 },
          recentEvents: [],
        };
      },
      MOCK_SCORE,
      'getScore',
    );
  }

  /**
   * Get active weekly missions
   * FR-001 FIX: replaced apiClient.request() with apiClient.get<unknown>()
   */
  async getMissions(): Promise<Mission[]> {
    return withMockFallback(
      async () => {
        const response = await apiClient.get<{ data: Mission[] }>('/try/missions');
        const payload = response.data as unknown;
        return (Array.isArray(payload) ? payload : payload?.data) || [];
      },
      MOCK_MISSIONS,
      'getMissions',
    );
  }

  /**
   * Get user's category badges
   * FR-001 FIX: replaced apiClient.request() with apiClient.get<unknown>()
   */
  async getBadges(): Promise<BadgesData> {
    return withMockFallback(
      async () => {
        const response = await apiClient.get<{ data: BadgesData }>('/try/badges');
        const payload = response.data as unknown;
        return (payload?.data ?? payload) || { earned: [], undiscovered: [] };
      },
      MOCK_BADGES,
      'getBadges',
    );
  }

  /**
   * Get leaderboard for a city and period
   * FR-001 FIX: replaced apiClient.request() with apiClient.get<unknown>()
   */
  async getLeaderboard(city: string, period: 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardData> {
    return withMockFallback(
      async () => {
        const response = await apiClient.get<{ data: LeaderboardData }>('/try/leaderboard', { city, period });
        const payload = response.data as unknown;
        return (payload?.data ?? payload) || { entries: [], userRank: 0, userScore: 0 };
      },
      MOCK_LEADERBOARD,
      'getLeaderboard',
    );
  }

  /**
   * Get this week's surprise trial (category only, merchant hidden)
   * FR-001 FIX: replaced apiClient.request() with apiClient.get<unknown>()
   */
  async getSurpriseTrial(): Promise<SurpriseData> {
    return withMockFallback(
      async () => {
        const response = await apiClient.get<{ data: SurpriseData }>('/try/surprise');
        const payload = response.data as unknown;
        return (payload?.data ?? payload) || { category: 'Mystery', distance: 'Unknown', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };
      },
      MOCK_SURPRISE,
      'getSurpriseTrial',
    );
  }

  /**
   * Reveal the surprise trial merchant
   * FR-001 FIX: replaced apiClient.request() with apiClient.post<unknown>()
   */
  async revealSurpriseTrial(): Promise<SurpriseData> {
    const response = await apiClient.post<{ data: SurpriseData }>('/try/surprise/reveal', {});
    const payload = response.data as unknown;
    return (payload?.data ?? payload) || { category: 'Mystery', distance: 'Unknown', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };
  }

  /**
   * Get trial bundles and passes
   * FR-001 FIX: replaced apiClient.request() with apiClient.get<unknown>()
   */
  async getBundles(category?: string): Promise<Bundle[]> {
    return withMockFallback(
      async () => {
        const response = await apiClient.get<{ data: Bundle[] }>('/try/bundles', category ? { category } : undefined);
        const payload = response.data as unknown;
        return (Array.isArray(payload) ? payload : payload?.data) || [];
      },
      MOCK_BUNDLES,
      'getBundles',
    );
  }

  /**
   * Purchase a bundle
   * FR-001 FIX: replaced apiClient.request() with apiClient.post<unknown>()
   */
  async purchaseBundle(bundleId: string, paymentId: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post<unknown>('/try/bundles/purchase', { bundleId, paymentId });
    return { success: response.success, message: response.message };
  }

  /**
   * Get user's active bundles
   * FR-001 FIX: replaced apiClient.request() with apiClient.get<unknown>()
   */
  async getMyBundles(): Promise<ActiveBundle[]> {
    return withMockFallback(
      async () => {
        const response = await apiClient.get<{ data: ActiveBundle[] }>('/try/bundles/mine');
        const payload = response.data as unknown;
        return (Array.isArray(payload) ? payload : payload?.data) || [];
      },
      MOCK_MY_BUNDLES,
      'getMyBundles',
    );
  }

  /**
   * Get active discovery campaigns
   * FR-001 FIX: replaced apiClient.request() with apiClient.get<unknown>()
   */
  async getCampaigns(city: string): Promise<Campaign[]> {
    return withMockFallback(
      async () => {
        const response = await apiClient.get<{ data: Campaign[] }>('/try/campaigns', { city });
        const payload = response.data as unknown;
        return (Array.isArray(payload) ? payload : payload?.data) || [];
      },
      MOCK_CAMPAIGNS,
      'getCampaigns',
    );
  }

  /**
   * Join a campaign
   * FR-001 FIX: replaced apiClient.request() with apiClient.post<unknown>()
   */
  async joinCampaign(campaignId: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post<unknown>(`/try/campaigns/${campaignId}/join`, {});
    return { success: response.success, message: response.message };
  }

  /**
   * Create a Razorpay payment order for commitment fee or pack purchase.
   * Calls POST /api/razorpay/create-order which returns
   *   { razorpayOrderId, amount (paise), currency, receipt }
   * The `notes` field carries context (source, trialId, packIndex, etc.)
   * so the verify-payment webhook can reconcile the transaction.
   */
  async createPaymentOrder(params: {
    amount: number;          // INR (rupees, not paise) — controller multiplies ×100
    trialId?: string;
    bundleId?: string;
    packIndex?: number;
    source?: 'trial_commitment' | 'trial_coins' | 'trial_bundle';
  }): Promise<{ razorpayOrderId: string; amount: number; currency: string }> {
    const { amount, trialId, bundleId, packIndex, source } = params;
    const response = await apiClient.post<{
      razorpayOrderId: string;
      amount: number;
      currency: string;
    }>('/razorpay/create-order', {
      amount,
      notes: {
        source: source || 'trial_commitment',
        ...(trialId ? { trialId } : {}),
        ...(bundleId ? { bundleId } : {}),
        ...(packIndex !== undefined ? { packIndex } : {}),
      },
    });
    const payload = (response.data as unknown) || {};
    return {
      razorpayOrderId: payload.razorpayOrderId || '',
      amount: payload.amount || amount * 100,
      currency: payload.currency || 'INR',
    };
  }

  /**
   * Submit a review for a completed trial booking.
   * POST /api/try/bookings/:bookingId/review
   * Body: { rating (1-5), reviewText }
   * Returns: { success, coinsEarned } — the backend may award ReZ coins for review.
   */
  async submitReview(
    bookingId: string,
    rating: number,
    reviewText: string,
  ): Promise<{ success: boolean; coinsEarned?: number; message?: string }> {
    const response = await apiClient.post<{ coinsEarned?: number }>(
      `/try/bookings/${bookingId}/review`,
      { rating, reviewText },
    );
    const payload = (response.data as unknown) || {};
    return {
      success: response.success,
      coinsEarned: payload.coinsEarned,
      message: response.message,
    };
  }
}

export const tryApi = new TryApi();
export default tryApi;

// Export types
export type {
  TrialCard,
  HistoryItem,
  CoinsData,
  ScoreData,
  BookingRequest,
  BookingResponse,
  Mission,
  CategoryBadge,
  BadgesData,
  LeaderboardEntry,
  LeaderboardData,
  SurpriseData,
  Bundle,
  ActiveBundle,
  Campaign,
};
