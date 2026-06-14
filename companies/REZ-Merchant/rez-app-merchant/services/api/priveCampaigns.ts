import { apiClient } from './client';

// ============================================
// TYPES
// ============================================

export interface Campaign {
  _id: string;
  storeId: string;
  title: string;
  hashtag: string;
  status: 'active' | 'draft' | 'paused' | 'ended';
  submissionsCount: number;
  approvalRate: number;
  coinsIssued: number;
  platform: string[];
  deadline: string;
  coinsPerApproval: number;
  rewardType: 'rez' | 'promo';
  maxSubmissions: number;
  minFollowers: number;
  priveTierRequired: 'none' | 'entry' | 'signature' | 'elite';
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignPayload {
  title: string;
  hashtag: string;
  platforms: {
    instagram: boolean;
    twitter: boolean;
    youtube: boolean;
  };
  deadline: string;
  coinsPerApproval: number;
  rewardType: 'rez' | 'promo';
  maxSubmissions: number;
  minFollowers: number;
  priveTierRequired: 'none' | 'entry' | 'signature' | 'elite';
  isDraft: boolean;
}

export interface Submission {
  _id: string;
  campaignId: string;
  userHandle: string;
  platform: 'Instagram' | 'Twitter' | 'YouTube';
  postUrl: string;
  thumbnailUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface ApproveSubmissionPayload {
  reason?: string;
}

export interface RejectSubmissionPayload {
  reason: string;
}

export interface BulkApprovePayload {
  submissionIds: string[];
}

// ============================================
// SERVICE
// ============================================

class PriveCampaignsService {
  /**
   * Get campaigns for a store
   * GET /api/merchant/prive/campaigns?storeId={storeId}
   */
  async getCampaigns(storeId: string): Promise<Campaign[]> {
    try {
      const response = await apiClient.get<unknown>(`merchant/prive/campaigns?storeId=${storeId}`);

      if (response.data?.campaigns && Array.isArray(response.data.campaigns)) {
        return response.data.campaigns;
      }

      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      if (__DEV__) console.error('[PriveCampaigns] Failed to fetch campaigns:', error.message);
      throw error;
    }
  }

  /**
   * Create a new campaign
   * POST /api/merchant/prive/campaigns
   */
  async createCampaign(storeId: string, payload: CreateCampaignPayload): Promise<Campaign> {
    try {
      const response = await apiClient.post<Campaign>('merchant/prive/campaigns', {
        storeId,
        ...payload,
      });

      if (!response.data) {
        throw new Error('No campaign data returned');
      }

      return response.data;
    } catch (error) {
      if (__DEV__) console.error('[PriveCampaigns] Failed to create campaign:', error.message);
      throw error;
    }
  }

  /**
   * Get submissions for a campaign
   * GET /api/merchant/prive/campaigns/{campaignId}/submissions
   */
  async getSubmissions(campaignId: string): Promise<Submission[]> {
    try {
      const response = await apiClient.get<unknown>(
        `merchant/prive/campaigns/${campaignId}/submissions`
      );

      if (response.data?.submissions && Array.isArray(response.data.submissions)) {
        return response.data.submissions;
      }

      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      if (__DEV__) console.error('[PriveCampaigns] Failed to fetch submissions:', error.message);
      throw error;
    }
  }

  /**
   * Approve a submission
   * POST /api/merchant/prive/campaigns/{campaignId}/submissions/{submissionId}/approve
   */
  async approveSubmission(
    campaignId: string,
    submissionId: string,
    payload?: ApproveSubmissionPayload
  ): Promise<Submission> {
    try {
      const response = await apiClient.post<Submission>(
        `merchant/prive/campaigns/${campaignId}/submissions/${submissionId}/approve`,
        payload || {}
      );

      if (!response.data) {
        throw new Error('No submission data returned');
      }

      return response.data;
    } catch (error) {
      if (__DEV__) console.error('[PriveCampaigns] Failed to approve submission:', error.message);
      throw error;
    }
  }

  /**
   * Reject a submission
   * POST /api/merchant/prive/campaigns/{campaignId}/submissions/{submissionId}/reject
   */
  async rejectSubmission(
    campaignId: string,
    submissionId: string,
    payload: RejectSubmissionPayload
  ): Promise<Submission> {
    try {
      const response = await apiClient.post<Submission>(
        `merchant/prive/campaigns/${campaignId}/submissions/${submissionId}/reject`,
        payload
      );

      if (!response.data) {
        throw new Error('No submission data returned');
      }

      return response.data;
    } catch (error) {
      if (__DEV__) console.error('[PriveCampaigns] Failed to reject submission:', error.message);
      throw error;
    }
  }

  /**
   * Bulk approve submissions
   * POST /api/merchant/prive/campaigns/{campaignId}/bulk-approve
   */
  async bulkApproveSubmissions(
    campaignId: string,
    payload: BulkApprovePayload
  ): Promise<{ approvedCount: number }> {
    try {
      const response = await apiClient.post<unknown>(
        `merchant/prive/campaigns/${campaignId}/bulk-approve`,
        payload
      );

      return {
        approvedCount: response.data?.approvedCount || 0,
      };
    } catch (error) {
      if (__DEV__) console.error('[PriveCampaigns] Failed to bulk approve:', error.message);
      throw error;
    }
  }
}

export const priveCampaignsService = new PriveCampaignsService();
export default priveCampaignsService;
