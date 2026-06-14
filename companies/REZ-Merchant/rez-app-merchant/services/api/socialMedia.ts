// Social Media Verification API Service
// For merchant verification of user Instagram posts

import { apiClient } from './client';

export interface SocialMediaUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
}

export interface SocialMediaOrder {
  _id: string;
  orderNumber: string;
  totals?: {
    total: number;
  };
  createdAt: string;
}

export interface SocialMediaStore {
  _id: string;
  name: string;
  logo?: string;
}

export interface SocialMediaPost {
  _id: string;
  user: SocialMediaUser;
  order: SocialMediaOrder;
  store: SocialMediaStore;
  platform: 'instagram' | 'facebook' | 'twitter' | 'tiktok';
  postUrl: string;
  status: 'pending' | 'approved' | 'rejected' | 'credited';
  cashbackAmount: number;
  cashbackPercentage: number;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  approvalNotes?: string;
  metadata?: {
    orderNumber?: string;
    postId?: string;
  };
}

export interface SocialMediaStats {
  total: number;
  totalCashbackAmount: number;
  pending: number;
  pendingAmount: number;
  approved: number;
  approvedAmount: number;
  credited: number;
  creditedAmount: number;
  rejected: number;
  approvalRate: number;
}

export interface SocialMediaListResponse {
  posts: SocialMediaPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SocialMediaFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'credited' | 'all';
  page?: number;
  limit?: number;
  storeId?: string;
}

class SocialMediaService {
  async getSocialMediaPosts(filters?: SocialMediaFilters): Promise<SocialMediaListResponse> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.status && filters.status !== 'all') params.append('status', filters.status);
        if (filters.storeId) params.append('storeId', filters.storeId);
      }

      const response = await apiClient.get<SocialMediaListResponse>(
        `merchant/social-media-posts?${params}`
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to get social media posts');
    } catch (error) {
      if (__DEV__) console.error('Get social media posts error:', error);
      throw new Error(error.message || 'Failed to get social media posts');
    }
  }

  async getSocialMediaPost(postId: string): Promise<SocialMediaPost> {
    try {
      const response = await apiClient.get<{ post: SocialMediaPost }>(
        `merchant/social-media-posts/${postId}`
      );
      if (response.success && response.data) {
        return response.data.post;
      }
      throw new Error(response.error || 'Failed to get social media post');
    } catch (error) {
      if (__DEV__) console.error('Get social media post error:', error);
      throw new Error(error.message || 'Failed to get social media post');
    }
  }

  async approveSocialMediaPost(
    postId: string,
    notes?: string
  ): Promise<{ post; walletUpdate: unknown }> {
    try {
      const response = await apiClient.put<{ post; walletUpdate: unknown }>(
        `merchant/social-media-posts/${postId}/approve`,
        { notes }
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to approve social media post');
    } catch (error) {
      if (__DEV__) console.error('Approve social media post error:', error);
      throw new Error(error.message || 'Failed to approve social media post');
    }
  }

  async rejectSocialMediaPost(postId: string, reason: string): Promise<{ post: unknown }> {
    try {
      const response = await apiClient.put<{ post: unknown }>(
        `merchant/social-media-posts/${postId}/reject`,
        { reason }
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to reject social media post');
    } catch (error) {
      if (__DEV__) console.error('Reject social media post error:', error);
      throw new Error(error.message || 'Failed to reject social media post');
    }
  }

  async getSocialMediaStats(): Promise<SocialMediaStats> {
    try {
      const response = await apiClient.get<{ stats: SocialMediaStats }>(
        'merchant/social-media-posts/stats'
      );
      if (response.success && response.data) {
        return response.data.stats;
      }
      throw new Error(response.error || 'Failed to get social media stats');
    } catch (error) {
      if (__DEV__) console.error('Get social media stats error:', error);
      return {
        total: 0,
        totalCashbackAmount: 0,
        pending: 0,
        pendingAmount: 0,
        approved: 0,
        approvedAmount: 0,
        credited: 0,
        creditedAmount: 0,
        rejected: 0,
        approvalRate: 0,
      };
    }
  }

  getStatusOptions(): Array<{ label: string; value: string; color: string }> {
    return [
      { label: 'All', value: 'all', color: '#6b7280' },
      { label: 'Pending', value: 'pending', color: '#f59e0b' },
      { label: 'Approved', value: 'approved', color: '#10b981' },
      { label: 'Credited', value: 'credited', color: '#6366f1' },
      { label: 'Rejected', value: 'rejected', color: '#ef4444' },
    ];
  }

  getPlatformInfo(platform: string): { name: string; icon: string; color: string } {
    const platforms: { [key: string]: { name: string; icon: string; color: string } } = {
      instagram: { name: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
      facebook: { name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
      twitter: { name: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
      tiktok: { name: 'TikTok', icon: 'musical-notes', color: '#000000' },
    };
    return platforms[platform] || { name: platform, icon: 'globe', color: '#6b7280' };
  }
}

export const socialMediaService = new SocialMediaService();
export default socialMediaService;
