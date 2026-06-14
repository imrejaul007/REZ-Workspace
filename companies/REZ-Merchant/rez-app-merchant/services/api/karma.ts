/**
 * Karma Campaigns API Service
 * Handles all API calls for karma-based social impact campaigns
 */

import { apiClient } from './client';

// ============ TYPES ============

export type KarmaCampaignType = 'blood-donation' | 'food-distribution' | 'ngo-support' | 'other';

export type KarmaCampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface KarmaReward {
  coins: number;
  bonusCoins?: number;
}

export interface KarmaCampaign {
  _id: string;
  name: string;
  description: string;
  type: KarmaCampaignType;
  status: KarmaCampaignStatus;
  image?: string;
  location?: {
    address: string;
    city?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  startDate?: string;
  endDate?: string;
  rewards: KarmaReward;
  capacity?: {
    goal: number;
    enrolled: number;
    completed: number;
  };
  requirements?: Array<{
    text: string;
    isMandatory: boolean;
  }>;
  benefits?: string[];
  verificationMethods: ('manual' | 'qr' | 'geo')[];
  geoFenceRadius?: number;
  stats?: {
    totalParticipants: number;
    completedCount: number;
    coinsAwarded: number;
    avgCompletionRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignData {
  name: string;
  description: string;
  type: KarmaCampaignType;
  image?: string;
  location?: {
    address: string;
    city?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  startDate?: string;
  endDate?: string;
  rewards: KarmaReward;
  capacity?: {
    goal: number;
  };
  requirements?: Array<{
    text: string;
    isMandatory: boolean;
  }>;
  benefits?: string[];
  verificationMethods?: ('manual' | 'qr' | 'geo')[];
  geoFenceRadius?: number;
}

export interface UpdateCampaignData extends Partial<CreateCampaignData> {
  status?: KarmaCampaignStatus;
}

export interface KarmaParticipant {
  _id: string;
  campaignId: string;
  user: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    profile?: {
      avatar?: string;
    };
  };
  status: 'registered' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
  registeredAt: string;
  checkedInAt?: string;
  completedAt?: string;
  coinsAwarded?: number;
  bonusCoinsAwarded?: number;
  verificationData?: {
    method: 'manual' | 'qr' | 'geo';
    verifiedAt: string;
    verifiedBy?: string;
  };
}

export interface CampaignFilters {
  status?: KarmaCampaignStatus;
  type?: KarmaCampaignType;
  page?: number;
  limit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============ HELPERS ============

function mapParticipant(raw): KarmaParticipant {
  const user = raw.user || {};
  const fullName =
    user.fullName ||
    [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ') ||
    user.name ||
    'Unknown';
  return {
    _id: raw._id,
    campaignId: raw.campaignId || raw.campaign?._id,
    user: {
      _id: user._id || '',
      name: fullName,
      email: user.email,
      phone: user.phone || user.phoneNumber,
      profile: user.profile,
    },
    status: raw.status,
    registeredAt: raw.registeredAt,
    checkedInAt: raw.checkedInAt,
    completedAt: raw.completedAt,
    coinsAwarded: raw.coinsAwarded,
    bonusCoinsAwarded: raw.bonusCoinsAwarded,
    verificationData: raw.verificationData,
  };
}

// ============ API SERVICE ============

class KarmaCampaignService {
  // ======== CAMPAIGN MANAGEMENT ========

  /**
   * Get all karma campaigns
   */
  async getCampaigns(filters: CampaignFilters = {}): Promise<{
    campaigns: KarmaCampaign[];
    pagination?: Pagination;
  }> {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const url = queryString
        ? `merchant/programs/karma?${queryString}`
        : 'merchant/programs/karma';

      const response = await apiClient.get<unknown>(url);

      return {
        campaigns: response.data?.campaigns || response.data || [],
        pagination: response.data?.pagination,
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get campaigns');
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(campaignId: string): Promise<KarmaCampaign> {
    try {
      const response = await apiClient.get<unknown>(`merchant/programs/karma/${campaignId}`);
      if (!response.data) {
        throw new Error('Campaign not found');
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get campaign');
    }
  }

  /**
   * Create a new karma campaign
   */
  async createCampaign(data: CreateCampaignData): Promise<KarmaCampaign> {
    try {
      const response = await apiClient.post<unknown>('merchant/programs/karma', data);
      if (!response.data) {
        throw new Error('Failed to create campaign');
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to create campaign');
    }
  }

  /**
   * Update a campaign
   */
  async updateCampaign(campaignId: string, data: UpdateCampaignData): Promise<KarmaCampaign> {
    try {
      const response = await apiClient.put<unknown>(`merchant/programs/karma/${campaignId}`, data);
      if (!response.data) {
        throw new Error('Failed to update campaign');
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to update campaign');
    }
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: string): Promise<void> {
    try {
      await apiClient.delete(`merchant/programs/karma/${campaignId}`);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete campaign');
    }
  }

  // ======== PARTICIPANT MANAGEMENT ========

  /**
   * Get campaign participants
   */
  async getParticipants(
    campaignId: string,
    params?: { status?: string; page?: number; limit?: number }
  ): Promise<{ participants: KarmaParticipant[]; pagination?: Pagination }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const url = queryString
        ? `merchant/programs/karma/${campaignId}/participants?${queryString}`
        : `merchant/programs/karma/${campaignId}/participants`;

      const response = await apiClient.get<unknown>(url);

      const rawList = Array.isArray(response.data) ? response.data : response.data?.participants || [];
      const participants: KarmaParticipant[] = rawList.map(mapParticipant);

      return {
        participants,
        pagination: response.data?.pagination,
      };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to get participants'
      );
    }
  }

  /**
   * Check in a participant
   */
  async checkInParticipant(campaignId: string, userId: string): Promise<KarmaParticipant> {
    try {
      const response = await apiClient.post<unknown>(
        `merchant/programs/karma/${campaignId}/check-in`,
        { userId }
      );
      return mapParticipant(response.data);
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to check in participant'
      );
    }
  }

  /**
   * Approve/complete a participant's karma action
   */
  async approveParticipant(
    campaignId: string,
    userId: string,
    data?: { awardBonus?: boolean }
  ): Promise<KarmaParticipant> {
    try {
      const response = await apiClient.post<unknown>(
        `merchant/programs/karma/${campaignId}/approve`,
        { userId, ...data }
      );
      return mapParticipant(response.data);
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to approve participant'
      );
    }
  }

  /**
   * Bulk approve participants
   */
  async bulkApproveParticipants(
    campaignId: string,
    userIds: string[]
  ): Promise<{ success: number; failed: number; errors: unknown[] }> {
    try {
      const response = await apiClient.post<unknown>(
        `merchant/programs/karma/${campaignId}/bulk-approve`,
        { userIds }
      );
      return response.data || { success: 0, failed: 0, errors: [] };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to bulk approve participants'
      );
    }
  }

  /**
   * Cancel participant
   */
  async cancelParticipant(campaignId: string, userId: string): Promise<KarmaParticipant> {
    try {
      const response = await apiClient.post<unknown>(
        `merchant/programs/karma/${campaignId}/cancel`,
        { userId }
      );
      return mapParticipant(response.data);
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to cancel participant'
      );
    }
  }

  // ======== ANALYTICS ========

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string): Promise<{
    totalParticipants: number;
    completedCount: number;
    pendingApprovals: number;
    coinsAwarded: number;
    completionRate: number;
    dailyStats: Array<{
      date: string;
      participants: number;
      completions: number;
    }>;
  }> {
    try {
      const response = await apiClient.get<unknown>(
        `merchant/programs/karma/${campaignId}/analytics`
      );
      return response.data || {
        totalParticipants: 0,
        completedCount: 0,
        pendingApprovals: 0,
        coinsAwarded: 0,
        completionRate: 0,
        dailyStats: [],
      };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to get analytics'
      );
    }
  }

  // ======== UTILITY METHODS ========

  /**
   * Get campaign type options
   */
  getCampaignTypes(): { value: KarmaCampaignType; label: string; emoji: string }[] {
    return [
      { value: 'blood-donation', label: 'Blood Donation', emoji: '🩸' },
      { value: 'food-distribution', label: 'Food Distribution', emoji: '🍱' },
      { value: 'ngo-support', label: 'NGO Support', emoji: '🤝' },
      { value: 'other', label: 'Other', emoji: '✨' },
    ];
  }

  /**
   * Get campaign status options
   */
  getCampaignStatuses(): { value: KarmaCampaignStatus; label: string; color: string }[] {
    return [
      { value: 'draft', label: 'Draft', color: '#9CA3AF' },
      { value: 'active', label: 'Active', color: '#10B981' },
      { value: 'paused', label: 'Paused', color: '#F59E0B' },
      { value: 'completed', label: 'Completed', color: '#6B7280' },
      { value: 'cancelled', label: 'Cancelled', color: '#EF4444' },
    ];
  }

  /**
   * Get participant status options
   */
  getParticipantStatuses(): { value: string; label: string; color: string }[] {
    return [
      { value: 'registered', label: 'Registered', color: '#3B82F6' },
      { value: 'checked_in', label: 'Checked In', color: '#F59E0B' },
      { value: 'completed', label: 'Completed', color: '#10B981' },
      { value: 'cancelled', label: 'Cancelled', color: '#EF4444' },
      { value: 'no_show', label: 'No Show', color: '#6B7280' },
    ];
  }

  /**
   * Format campaign date
   */
  formatDate(dateString?: string): string {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}

export const karmaCampaignService = new KarmaCampaignService();
export default karmaCampaignService;
