/**
 * REZ Loyalty/ Karma Service Integration for Merchant App
 *
 * Connects merchant app to karma/loyalty system at:
 * https://rez-karma-service.onrender.com
 *
 * Endpoints:
 * - GET    /loyalty/:merchantId           - Get loyalty settings
 * - PATCH  /loyalty/:id                  - Update loyalty settings
 * - GET    /loyalty/members/:merchantId  - Get loyalty members
 * - GET    /loyalty/members/detail/:id   - Get member by ID
 * - POST   /loyalty/members              - Create member
 * - PATCH  /loyalty/members/:id          - Update member
 * - POST   /loyalty/redeem               - Redeem points
 * - GET    /loyalty/punch-cards/:merchantId - Get punch cards
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

// Karma service base URL
const KARMA_SERVICE_BASE_URL =
  process.env.EXPO_PUBLIC_KARMA_SERVICE_URL || 'https://rez-karma-service.onrender.com';

// ============== Types ==============

// Legacy types for tier management (kept for backward compatibility)
export interface LoyaltyTier {
  id: string;
  name: string;
  minSpend: number;
  coinMultiplier: number;
  perks: string[];
  color: string;
  benefits: string[];
  icon?: string;
}

export interface LoyaltyProgram {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  tiers: LoyaltyTier[];
  createdAt: string;
  updatedAt: string;
  settings: {
    pointsPerRupee: number;
    pointsToRupeeRatio: number;
    joiningBonus: number;
    birthdayBonus: number;
    referralBonus: number;
    maxPointsPerTransaction?: number;
    pointsExpiryMonths?: number;
    minimumRedemptionPoints: number;
  };
}

export interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  tierDistribution: {
    tier: string;
    tierId?: string;
    percentage: number;
    count: number;
    color: string;
  }[];
  averagePoints: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  averageVisits: number;
}

export interface LoyaltySettings {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  pointsPerRupee: number;
  pointsToRupeeRatio: number;
  joiningBonus: number;
  birthdayBonus: number;
  referralBonus: number;
  maxPointsPerTransaction?: number;
  pointsExpiryMonths?: number;
  minimumRedemptionPoints: number;
  bonusCategories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyMember {
  id: string;
  merchantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  email?: string;
  currentTier: string;
  totalPoints: number;
  lifetimePoints: number;
  visits: number;
  lastVisit: string;
  joinedAt: string;
  streak: StreakData;
  badges: Badge[];
  referralCode?: string;
  referredBy?: string;
}

export interface PunchCard {
  id: string;
  name: string;
  description?: string;
  totalStamps: number;
  currentStamps: number;
  isCompleted: boolean;
  rewardDescription: string;
  isActive: boolean;
  activeCount?: number;
  completedCount?: number;
  expiresAt?: string;
  createdAt: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakActive: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  category: 'visit' | 'spending' | 'referral' | 'special';
}

export interface RedeemRequest {
  memberId: string;
  merchantId: string;
  points: number;
  orderId?: string;
  orderAmount?: number;
}

export interface RedeemResponse {
  success: boolean;
  pointsRedeemed: number;
  cashbackAmount: number;
  remainingPoints: number;
  newTier?: string;
  stampsEarned?: number;
  message: string;
}

export interface CreateMemberData {
  merchantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  email?: string;
}

export interface UpdateMemberData {
  customerName?: string;
  customerPhone?: string;
  email?: string;
}

export interface MemberListResponse {
  members: LoyaltyMember[];
  total: number;
  page: number;
  limit: number;
}

// ============== Service Implementation ==============

class LoyaltyService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = KARMA_SERVICE_BASE_URL;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Set auth token for requests
   */
  setToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Health check for karma service
   */
  async healthCheck(): Promise<{ status: string; uptime: number }> {
    try {
      const response = await this.client.get<{ status: string; uptime: number }>('/health');
      return response.data;
    } catch (error) {
      logger.warn('[LoyaltyService] Health check failed:', error);
      throw error;
    }
  }

  // ============== Program Management (Legacy) ==============

  /**
   * Get loyalty program for a merchant (legacy endpoint)
   * GET /api/loyalty/:merchantId
   */
  async getProgram(merchantId: string): Promise<LoyaltyProgram | null> {
    try {
      const response = await this.client.get<{ success: boolean; data: LoyaltyProgram }>(
        `/api/loyalty/${merchantId}`
      );
      return response.data.data || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      logger.warn('[LoyaltyService] getProgram failed:', error);
      return null;
    }
  }

  /**
   * Create a new loyalty program (legacy endpoint)
   * POST /api/loyalty/programs
   */
  async createProgram(merchantId: string, programData: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> {
    const response = await this.client.post<{ success: boolean; data: LoyaltyProgram }>(
      '/api/loyalty/programs',
      { merchantId, ...programData }
    );
    return response.data.data;
  }

  /**
   * Update loyalty program (legacy endpoint)
   * PATCH /api/loyalty/programs/:programId
   */
  async updateProgram(programId: string, updates: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> {
    const response = await this.client.patch<{ success: boolean; data: LoyaltyProgram }>(
      `/api/loyalty/programs/${programId}`,
      updates
    );
    return response.data.data;
  }

  // ============== Tier Management (Legacy) ==============

  /**
   * Add a new tier to program (legacy endpoint)
   * POST /api/loyalty/:merchantId/tiers
   */
  async addTier(merchantId: string, tier: Partial<LoyaltyTier>): Promise<LoyaltyTier> {
    const response = await this.client.post<{ success: boolean; data: LoyaltyTier }>(
      `/api/loyalty/${merchantId}/tiers`,
      tier
    );
    return response.data.data;
  }

  /**
   * Update a tier (legacy endpoint)
   * PATCH /api/loyalty/:merchantId/tiers/:tierId
   */
  async updateTier(merchantId: string, tierId: string, updates: Partial<LoyaltyTier>): Promise<LoyaltyTier> {
    const response = await this.client.patch<{ success: boolean; data: LoyaltyTier }>(
      `/api/loyalty/${merchantId}/tiers/${tierId}`,
      updates
    );
    return response.data.data;
  }

  /**
   * Delete a tier (legacy endpoint)
   * DELETE /api/loyalty/:merchantId/tiers/:tierId
   */
  async deleteTier(merchantId: string, tierId: string): Promise<void> {
    await this.client.delete(`/api/loyalty/${merchantId}/tiers/${tierId}`);
  }

  // ============== Loyalty Settings ==============

  /**
   * Get loyalty settings for a merchant
   * GET /loyalty/:merchantId
   */
  async getLoyaltySettings(merchantId: string): Promise<LoyaltySettings | null> {
    try {
      const response = await this.client.get<{ success: boolean; data: LoyaltySettings }>(
        `/loyalty/${merchantId}`
      );
      return response.data.data || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      logger.warn('[LoyaltyService] getLoyaltySettings failed:', error);
      return null;
    }
  }

  /**
   * Update loyalty settings
   * PATCH /loyalty/:id
   */
  async updateLoyaltySettings(
    id: string,
    data: Partial<LoyaltySettings>
  ): Promise<LoyaltySettings> {
    const response = await this.client.patch<{ success: boolean; data: LoyaltySettings }>(
      `/loyalty/${id}`,
      data
    );
    return response.data.data;
  }

  /**
   * Create loyalty settings for a merchant
   * POST /loyalty
   */
  async createLoyaltySettings(
    merchantId: string,
    data: Partial<LoyaltySettings>
  ): Promise<LoyaltySettings> {
    const response = await this.client.post<{ success: boolean; data: LoyaltySettings }>(
      '/loyalty',
      { merchantId, ...data }
    );
    return response.data.data;
  }

  // ============== Members ==============

  /**
   * Get all loyalty members for a merchant
   * GET /loyalty/members/:merchantId
   */
  async getLoyaltyMembers(
    merchantId: string,
    options?: { page?: number; limit?: number; tier?: string; search?: string }
  ): Promise<MemberListResponse> {
    const params: Record<string, string> = {};
    if (options?.page) params.page = options.page.toString();
    if (options?.limit) params.limit = options.limit.toString();
    if (options?.tier) params.tier = options.tier;
    if (options?.search) params.search = options.search;

    const response = await this.client.get<{ success: boolean; data: MemberListResponse }>(
      `/loyalty/members/${merchantId}`,
      { params }
    );
    return response.data.data;
  }

  /**
   * Get member by ID
   * GET /loyalty/members/detail/:id
   */
  async getMemberById(id: string): Promise<LoyaltyMember | null> {
    try {
      const response = await this.client.get<{ success: boolean; data: LoyaltyMember }>(
        `/loyalty/members/detail/${id}`
      );
      return response.data.data || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      logger.warn('[LoyaltyService] getMemberById failed:', error);
      return null;
    }
  }

  /**
   * Get member by phone
   * GET /loyalty/members/:merchantId/phone/:phone
   */
  async getMemberByPhone(merchantId: string, phone: string): Promise<LoyaltyMember | null> {
    try {
      const response = await this.client.get<{ success: boolean; data: LoyaltyMember }>(
        `/loyalty/members/${merchantId}/phone/${phone}`
      );
      return response.data.data || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      logger.warn('[LoyaltyService] getMemberByPhone failed:', error);
      return null;
    }
  }

  /**
   * Create a new loyalty member
   * POST /loyalty/members
   */
  async createMember(data: CreateMemberData): Promise<LoyaltyMember> {
    const response = await this.client.post<{ success: boolean; data: LoyaltyMember }>(
      '/loyalty/members',
      data
    );
    return response.data.data;
  }

  /**
   * Update a loyalty member
   * PATCH /loyalty/members/:id
   */
  async updateMember(id: string, data: UpdateMemberData): Promise<LoyaltyMember> {
    const response = await this.client.patch<{ success: boolean; data: LoyaltyMember }>(
      `/loyalty/members/${id}`,
      data
    );
    return response.data.data;
  }

  /**
   * Delete a loyalty member
   * DELETE /loyalty/members/:id
   */
  async deleteMember(id: string): Promise<void> {
    await this.client.delete(`/loyalty/members/${id}`);
  }

  // ============== Points Redemption ==============

  /**
   * Redeem points for a member
   * POST /loyalty/redeem
   */
  async redeemPoints(request: RedeemRequest): Promise<RedeemResponse> {
    const response = await this.client.post<{ success: boolean; data: RedeemResponse }>(
      '/loyalty/redeem',
      request
    );
    return response.data.data;
  }

  /**
   * Earn points for a transaction
   * POST /loyalty/earn
   */
  async earnPoints(request: {
    merchantId: string;
    customerId: string;
    amount: number;
    orderId: string;
    type: 'purchase' | 'visit' | 'review' | 'referral' | 'birthday' | 'signup';
  }): Promise<{ success: boolean; pointsEarned: number; message: string }> {
    const response = await this.client.post<{
      success: boolean;
      pointsEarned: number;
      message: string;
    }>('/loyalty/earn', request);
    return response.data;
  }

  // ============== Punch Cards ==============

  /**
   * Get punch cards for a merchant
   * GET /loyalty/punch-cards/:merchantId
   */
  async getPunchCards(merchantId: string): Promise<PunchCard[]> {
    try {
      const response = await this.client.get<{ success: boolean; data: PunchCard[] }>(
        `/loyalty/punch-cards/${merchantId}`
      );
      return response.data.data || [];
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      logger.warn('[LoyaltyService] getPunchCards failed:', error);
      return [];
    }
  }

  /**
   * Create a punch card
   * POST /loyalty/punch-cards
   */
  async createPunchCard(
    merchantId: string,
    data: {
      name: string;
      description?: string;
      totalStamps: number;
      rewardDescription: string;
      expiresInDays?: number;
    }
  ): Promise<PunchCard> {
    const response = await this.client.post<{ success: boolean; data: PunchCard }>(
      '/loyalty/punch-cards',
      { merchantId, ...data }
    );
    return response.data.data;
  }

  /**
   * Update a punch card
   * PATCH /loyalty/punch-cards/:id
   */
  async updatePunchCard(id: string, data: Partial<PunchCard>): Promise<PunchCard> {
    const response = await this.client.patch<{ success: boolean; data: PunchCard }>(
      `/loyalty/punch-cards/${id}`,
      data
    );
    return response.data.data;
  }

  /**
   * Delete a punch card
   * DELETE /loyalty/punch-cards/:id
   */
  async deletePunchCard(id: string): Promise<void> {
    await this.client.delete(`/loyalty/punch-cards/${id}`);
  }

  /**
   * Issue a stamp on a punch card
   * POST /loyalty/punch-cards/:id/stamp
   */
  async issueStamp(
    punchCardId: string,
    customerId: string
  ): Promise<{ success: boolean; currentStamps: number; isCompleted: boolean; reward?: string }> {
    const response = await this.client.post<{
      success: boolean;
      currentStamps: number;
      isCompleted: boolean;
      reward?: string;
    }>(`/loyalty/punch-cards/${punchCardId}/stamp`, { customerId });
    return response.data;
  }

  // ============== Member Stats ==============

  /**
   * Get member stats for a merchant
   * GET /loyalty/members/:merchantId/stats
   */
  async getMemberStats(merchantId: string): Promise<{
    totalMembers: number;
    activeMembers: number;
    averagePoints: number;
    tierDistribution: { tier: string; count: number; percentage: number }[];
  }> {
    const response = await this.client.get<{
      success: boolean;
      data: {
        totalMembers: number;
        activeMembers: number;
        averagePoints: number;
        tierDistribution: { tier: string; count: number; percentage: number }[];
      };
    }>(`/loyalty/members/${merchantId}/stats`);
    return response.data.data;
  }
}

// Export singleton instance
export const loyaltyService = new LoyaltyService();
export default loyaltyService;

// ============== React Hooks ==============

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for loyalty settings
 */
export function useLoyaltySettings(merchantId: string) {
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!merchantId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await loyaltyService.getLoyaltySettings(merchantId);
      setSettings(data);
    } catch (err) {
      setError(err.message);
      logger.error('[useLoyaltySettings] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback(
    async (id: string, data: Partial<LoyaltySettings>) => {
      try {
        const updated = await loyaltyService.updateLoyaltySettings(id, data);
        setSettings(updated);
        return updated;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  return { settings, loading, error, refetch: loadSettings, updateSettings };
}

/**
 * Hook for loyalty members
 */
export function useLoyaltyMembers(
  merchantId: string,
  options?: { page?: number; limit?: number; tier?: string; search?: string }
) {
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!merchantId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await loyaltyService.getLoyaltyMembers(merchantId, options);
      setMembers(data.members);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [merchantId, options?.page, options?.limit, options?.tier, options?.search]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  return { members, total, loading, error, refetch: loadMembers };
}

/**
 * Hook for punch cards
 */
export function usePunchCards(merchantId: string) {
  const [punchCards, setPunchCards] = useState<PunchCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPunchCards = useCallback(async () => {
    if (!merchantId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await loyaltyService.getPunchCards(merchantId);
      setPunchCards(data);
    } catch (err) {
      setError(err.message);
      logger.error('[usePunchCards] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    loadPunchCards();
  }, [loadPunchCards]);

  const createPunchCard = useCallback(
    async (cardData: Parameters<typeof loyaltyService.createPunchCard>[1]) => {
      const result = await loyaltyService.createPunchCard(merchantId, cardData);
      await loadPunchCards();
      return result;
    },
    [merchantId, loadPunchCards]
  );

  const deletePunchCard = useCallback(
    async (id: string) => {
      await loyaltyService.deletePunchCard(id);
      await loadPunchCards();
    },
    [loadPunchCards]
  );

  const updatePunchCard = useCallback(
    async (id: string, data: Partial<PunchCard>) => {
      const result = await loyaltyService.updatePunchCard(id, data);
      await loadPunchCards();
      return result;
    },
    [loadPunchCards]
  );

  return {
    punchCards,
    loading,
    error,
    refetch: loadPunchCards,
    createPunchCard,
    deletePunchCard,
    updatePunchCard,
  };
}

/**
 * Hook for member stats
 */
export function useMemberStats(merchantId: string) {
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!merchantId) return;
    try {
      const data = await loyaltyService.getMemberStats(merchantId);
      setStats(data);
    } catch (err) {
      logger.error('[useMemberStats] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, loading, refetch: loadStats };
}

/**
 * Hook for loyalty program (legacy)
 */
export function useLoyaltyProgram(merchantId: string) {
  const [program, setProgram] = useState<LoyaltyProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProgram = useCallback(async () => {
    if (!merchantId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await loyaltyService.getProgram(merchantId);
      setProgram(data);
    } catch (err) {
      setError(err.message);
      logger.error('[useLoyaltyProgram] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    loadProgram();
  }, [loadProgram]);

  const updateProgram = useCallback(
    async (updates: Partial<LoyaltyProgram>) => {
      if (!program) return;
      try {
        const updated = await loyaltyService.updateProgram(program.id, updates);
        setProgram(updated);
        return updated;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [program]
  );

  return { program, loading, error, refetch: loadProgram, updateProgram };
}

/**
 * Hook for tier management (legacy)
 */
export function useTierManagement(merchantId: string) {
  const { program, loading, error, refetch, updateProgram } = useLoyaltyProgram(merchantId);

  const addTier = useCallback(
    async (tier: Partial<LoyaltyTier>) => {
      const newTier = await loyaltyService.addTier(merchantId, tier);
      await refetch();
      return newTier;
    },
    [merchantId, refetch]
  );

  const updateTier = useCallback(
    async (tierId: string, updates: Partial<LoyaltyTier>) => {
      const updatedTier = await loyaltyService.updateTier(merchantId, tierId, updates);
      await refetch();
      return updatedTier;
    },
    [merchantId, refetch]
  );

  const deleteTier = useCallback(
    async (tierId: string) => {
      await loyaltyService.deleteTier(merchantId, tierId);
      await refetch();
    },
    [merchantId, refetch]
  );

  return {
    tiers: program?.tiers || [],
    loading,
    error,
    addTier,
    updateTier,
    deleteTier,
    refetch,
    updateProgram,
  };
}
