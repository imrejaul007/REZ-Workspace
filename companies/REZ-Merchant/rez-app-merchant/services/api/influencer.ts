/**
 * Influencer Marketing API Service
 * Handles all API calls for influencer marketplace and campaign management
 */

import { apiClient } from './client';
import type {
  Influencer,
  InfluencerFilters,
  InfluencerListResponse,
  Campaign,
  CampaignFilters,
  CampaignListResponse,
  CreateCampaignPayload,
  UpdateCampaignPayload,
  ApplicationDecisionPayload,
  CampaignMetrics,
  InfluencerAnalytics,
  CampaignApplication,
} from '@/types/influencer';

// Re-export API response types
export type { InfluencerListResponse, CampaignListResponse };

// ─── Influencer Endpoints ─────────────────────────────────────────────────────

export const influencerService = {
  /**
   * List all available influencers with filters
   */
  async listInfluencers(
    filters?: InfluencerFilters
  ): Promise<InfluencerListResponse> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.niche?.length) params.append('niche', filters.niche.join(','));
      if (filters.platform?.length) params.append('platform', filters.platform.join(','));
      if (filters.minFollowers) params.append('minFollowers', filters.minFollowers.toString());
      if (filters.maxFollowers) params.append('maxFollowers', filters.maxFollowers.toString());
      if (filters.minEngagementRate) params.append('minEngagementRate', filters.minEngagementRate.toString());
      if (filters.location) params.append('location', filters.location);
      if (filters.language?.length) params.append('language', filters.language.join(','));
      if (filters.verified !== undefined) params.append('verified', String(filters.verified));
      if (filters.available !== undefined) params.append('available', String(filters.available));
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
    }

    const queryString = params.toString();
    const url = `/influencer/listings${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<InfluencerListResponse>(url);
  },

  /**
   * Get influencer details by ID
   */
  async getInfluencer(id: string): Promise<Influencer> {
    const response = await apiClient.get<Influencer>(`/influencer/${id}`);
    return response.data!;
  },

  /**
   * Get recommended influencers for a campaign
   */
  async getRecommendedInfluencers(
    campaignId: string,
    limit: number = 10
  ): Promise<Influencer[]> {
    const response = await apiClient.get<Influencer[]>(
      `/influencer/recommendations/${campaignId}?limit=${limit}`
    );
    return response.data || [];
  },

  /**
   * Search influencers by name or username
   */
  async searchInfluencers(query: string, limit: number = 20): Promise<Influencer[]> {
    const response = await apiClient.get<Influencer[]>(
      `/influencer/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.data || [];
  },

  /**
   * Get influencer analytics
   */
  async getInfluencerAnalytics(influencerId?: string): Promise<InfluencerAnalytics> {
    const url = influencerId
      ? `/influencer/${influencerId}/analytics`
      : '/influencer/analytics';
    const response = await apiClient.get<InfluencerAnalytics>(url);
    return response.data!;
  },
};

// ─── Campaign Endpoints ────────────────────────────────────────────────────────

export const campaignService = {
  /**
   * List all campaigns for the merchant
   */
  async listCampaigns(filters?: CampaignFilters): Promise<CampaignListResponse> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.status?.length) params.append('status', filters.status.join(','));
      if (filters.niche?.length) params.append('niche', filters.niche.join(','));
      if (filters.platform?.length) params.append('platform', filters.platform.join(','));
      if (filters.minBudget) params.append('minBudget', filters.minBudget.toString());
      if (filters.maxBudget) params.append('maxBudget', filters.maxBudget.toString());
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
    }

    const queryString = params.toString();
    const url = `/influencer/campaigns${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<CampaignListResponse>(url);
  },

  /**
   * Get campaign details by ID
   */
  async getCampaign(id: string): Promise<Campaign> {
    const response = await apiClient.get<Campaign>(`/influencer/campaigns/${id}`);
    return response.data!;
  },

  /**
   * Create a new campaign
   */
  async createCampaign(data: CreateCampaignPayload): Promise<Campaign> {
    const response = await apiClient.post<Campaign>('/influencer/campaigns', data);
    return response.data!;
  },

  /**
   * Update campaign details
   */
  async updateCampaign(id: string, data: UpdateCampaignPayload): Promise<Campaign> {
    const response = await apiClient.patch<Campaign>(`/influencer/campaigns/${id}`, data);
    return response.data!;
  },

  /**
   * Delete a campaign (only draft campaigns)
   */
  async deleteCampaign(id: string): Promise<void> {
    await apiClient.delete(`/influencer/campaigns/${id}`);
  },

  /**
   * Publish a campaign (change status from draft to active)
   */
  async publishCampaign(id: string): Promise<Campaign> {
    const response = await apiClient.post<Campaign>(`/influencer/campaigns/${id}/publish`);
    return response.data!;
  },

  /**
   * Pause an active campaign
   */
  async pauseCampaign(id: string): Promise<Campaign> {
    const response = await apiClient.post<Campaign>(`/influencer/campaigns/${id}/pause`);
    return response.data!;
  },

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(id: string): Promise<Campaign> {
    const response = await apiClient.post<Campaign>(`/influencer/campaigns/${id}/resume`);
    return response.data!;
  },

  /**
   * Complete a campaign
   */
  async completeCampaign(id: string): Promise<Campaign> {
    const response = await apiClient.post<Campaign>(`/influencer/campaigns/${id}/complete`);
    return response.data!;
  },

  /**
   * Cancel a campaign
   */
  async cancelCampaign(id: string, reason?: string): Promise<Campaign> {
    const response = await apiClient.post<Campaign>(`/influencer/campaigns/${id}/cancel`, {
      reason,
    });
    return response.data!;
  },

  /**
   * Get campaign metrics
   */
  async getCampaignMetrics(id: string): Promise<CampaignMetrics> {
    const response = await apiClient.get<CampaignMetrics>(
      `/influencer/campaigns/${id}/metrics`
    );
    return response.data!;
  },

  /**
   * Invite specific influencers to a campaign
   */
  async inviteInfluencers(
    campaignId: string,
    influencerIds: string[]
  ): Promise<void> {
    await apiClient.post(`/influencer/campaigns/${campaignId}/invite`, {
      influencerIds,
    });
  },
};

// ─── Application Endpoints ────────────────────────────────────────────────────

export const applicationService = {
  /**
   * Get all applications for a campaign
   */
  async getCampaignApplications(
    campaignId: string,
    status?: string
  ): Promise<CampaignApplication[]> {
    const url = status
      ? `/influencer/campaigns/${campaignId}/applications?status=${status}`
      : `/influencer/campaigns/${campaignId}/applications`;

    const response = await apiClient.get<CampaignApplication[]>(url);
    return response.data || [];
  },

  /**
   * Get application details
   */
  async getApplication(
    campaignId: string,
    applicationId: string
  ): Promise<CampaignApplication> {
    const response = await apiClient.get<CampaignApplication>(
      `/influencer/campaigns/${campaignId}/applications/${applicationId}`
    );
    return response.data!;
  },

  /**
   * Accept or reject an application
   */
  async decideApplication(
    campaignId: string,
    applicationId: string,
    decision: ApplicationDecisionPayload
  ): Promise<CampaignApplication> {
    const response = await apiClient.post<CampaignApplication>(
      `/influencer/campaigns/${campaignId}/applications/${applicationId}/decision`,
      decision
    );
    return response.data!;
  },

  /**
   * Bulk accept applications
   */
  async bulkAcceptApplications(
    campaignId: string,
    applicationIds: string[]
  ): Promise<void> {
    await apiClient.post(`/influencer/campaigns/${campaignId}/applications/bulk-accept`, {
      applicationIds,
    });
  },

  /**
   * Bulk reject applications
   */
  async bulkRejectApplications(
    campaignId: string,
    applicationIds: string[],
    reason?: string
  ): Promise<void> {
    await apiClient.post(`/influencer/campaigns/${campaignId}/applications/bulk-reject`, {
      applicationIds,
      reason,
    });
  },

  /**
   * Send message to influencer regarding their application
   */
  async sendApplicationMessage(
    campaignId: string,
    applicationId: string,
    message: string
  ): Promise<void> {
    await apiClient.post(
      `/influencer/campaigns/${campaignId}/applications/${applicationId}/message`,
      { message }
    );
  },

  /**
   * Withdraw own application (for influencers)
   */
  async withdrawApplication(campaignId: string, applicationId: string): Promise<void> {
    await apiClient.post(
      `/influencer/campaigns/${campaignId}/applications/${applicationId}/withdraw`
    );
  },
};

// ─── Outreach Endpoints ───────────────────────────────────────────────────────

export const outreachService = {
  /**
   * Send outreach message to influencer
   */
  async sendOutreach(
    influencerId: string,
    campaignId: string,
    message: string
  ): Promise<void> {
    await apiClient.post('/influencer/outreach', {
      influencerId,
      campaignId,
      message,
    });
  },

  /**
   * Get outreach history
   */
  async getOutreachHistory(influencerId: string): Promise<Array<{
    id: string;
    campaignId: string;
    campaignName: string;
    message: string;
    sentAt: string;
    responded: boolean;
    respondedAt?: string;
  }>> {
    const response = await apiClient.get<Array<{
      id: string;
      campaignId: string;
      campaignName: string;
      message: string;
      sentAt: string;
      responded: boolean;
      respondedAt?: string;
    }>>(`/influencer/outreach/history/${influencerId}`);
    return response.data || [];
  },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

export const influencerHelpers = {
  /**
   * Format follower count for display (e.g., 1.2M, 500K)
   */
  formatFollowerCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  },

  /**
   * Format engagement rate for display
   */
  formatEngagementRate(rate: number): string {
    return `${rate.toFixed(2)}%`;
  },

  /**
   * Format price for display
   */
  formatPrice(price: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  },

  /**
   * Get niche display name
   */
  getNicheDisplayName(niche: string): string {
    return niche
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  /**
   * Get platform display name
   */
  getPlatformDisplayName(platform: string): string {
    const names: Record<string, string> = {
      instagram: 'Instagram',
      youtube: 'YouTube',
      tiktok: 'TikTok',
      twitter: 'Twitter',
      facebook: 'Facebook',
      linkedin: 'LinkedIn',
      pinterest: 'Pinterest',
      snapchat: 'Snapchat',
    };
    return names[platform] || platform;
  },

  /**
   * Get platform icon name
   */
  getPlatformIcon(platform: string): string {
    const icons: Record<string, string> = {
      instagram: 'logo-instagram',
      youtube: 'logo-youtube',
      tiktok: 'logo-tiktok',
      twitter: 'logo-twitter',
      facebook: 'logo-facebook',
      linkedin: 'logo-linkedin',
      pinterest: 'logo-pinterest',
      snapchat: 'chatbox-ellipses',
    };
    return icons[platform] || 'globe';
  },

  /**
   * Get campaign status color
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: '#9CA3AF',
      pending_approval: '#F59E0B',
      active: '#10B981',
      paused: '#6366F1',
      completed: '#3B82F6',
      cancelled: '#EF4444',
      rejected: '#EF4444',
    };
    return colors[status] || '#9CA3AF';
  },

  /**
   * Get application status color
   */
  getApplicationStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: '#F59E0B',
      under_review: '#6366F1',
      accepted: '#10B981',
      rejected: '#EF4444',
      negotiating: '#8B5CF6',
      withdrawn: '#9CA3AF',
      expired: '#6B7280',
    };
    return colors[status] || '#9CA3AF';
  },
};

export default {
  influencerService,
  campaignService,
  applicationService,
  outreachService,
  helpers: influencerHelpers,
};
