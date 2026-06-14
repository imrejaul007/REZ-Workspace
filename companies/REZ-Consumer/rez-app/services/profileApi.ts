// @ts-nocheck
// Profile API Service
// Handles user profile data and completion status

import apiClient, { ApiResponse } from './apiClient';
import { withRetry, createErrorResponse } from '@/utils/apiUtils';

/**
 * Profile Data Interface
 */
export interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  profilePicture?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Profile Completion Status
 */
export interface ProfileCompletionStatus {
  completionPercentage: number;
  missingFields: string[];
  suggestions: string[];
}

/**
 * Unified Profile Summary (cross-vertical LTV tracking)
 */
export interface UnifiedProfileSummary {
  userId: string;
  phone: string;
  totalLifetimeSpend: number;
  totalTransactions: number;
  averageOrderValue: number;
  lifetimeValue: number;
  engagementScore: number;
  lastActivity: string | null;
  daysActive: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  verticals: {
    hotel: { totalSpend: number; transactionCount: number; averageOrderValue: number };
    restaurant: { totalSpend: number; transactionCount: number; averageOrderValue: number };
    fashion: { totalSpend: number; transactionCount: number; averageOrderValue: number };
    pharmacy: { totalSpend: number; transactionCount: number; averageOrderValue: number };
    retail: { totalSpend: number; transactionCount: number; averageOrderValue: number };
    d2c: { totalSpend: number; transactionCount: number; averageOrderValue: number };
  };
  favoriteCategories: string[];
  favoriteMerchants: string[];
}

/**
 * Tier Info
 */
export interface TierInfo {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lifetimeValue: number;
  nextTierAt: number | null;
}

/**
 * Profile API Service Class
 */
class ProfileService {
  /**
   * Get user profile data
   */
  async getProfile(): Promise<ApiResponse<ProfileData>> {
    try {
      return await withRetry(
        () => apiClient.get<ProfileData>('/user/profile'),
        { maxRetries: 3 }
      );
    } catch (error) {
      return createErrorResponse(error, 'Failed to load profile. Please try again.') as unknown;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<ProfileData>): Promise<ApiResponse<ProfileData>> {
    try {
      return await withRetry(
        () => apiClient.patch<ProfileData>('/user/auth/profile', updates),
        { maxRetries: 3 }
      );
    } catch (error) {
      return createErrorResponse(error, 'Failed to update profile. Please try again.') as unknown;
    }
  }

  /**
   * Get profile completion status
   */
  async getProfileCompletion(): Promise<ApiResponse<ProfileCompletionStatus>> {
    try {
      return await withRetry(
        () => apiClient.get<ProfileCompletionStatus>('/user/profile/completion'),
        { maxRetries: 3 }
      );
    } catch (error) {
      return createErrorResponse(error, 'Failed to load profile completion status. Please try again.') as unknown;
    }
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(imageUri: string): Promise<ApiResponse<{ profilePicture: string }>> {
    try {
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile-picture.jpg',
      } as unknown);

      // Fixed CA-AUT-023: Explicitly set Content-Type to multipart/form-data
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      return await withRetry(
        () => apiClient.post<{ profilePicture: string }>('/user/profile/picture', formData, config),
        { maxRetries: 3 }
      );
    } catch (error) {
      return createErrorResponse(error, 'Failed to upload profile picture. Please try again.') as unknown;
    }
  }

  /**
   * Delete profile picture
   */
  async deleteProfilePicture(): Promise<ApiResponse<{ success: boolean }>> {
    try {
      return await withRetry(
        () => apiClient.delete<{ success: boolean }>('/user/profile/picture'),
        { maxRetries: 3 }
      );
    } catch (error) {
      return createErrorResponse(error, 'Failed to delete profile picture. Please try again.') as unknown;
    }
  }

  /**
   * Verify profile
   */
  async verifyProfile(verificationData: {
    documentType: 'id' | 'passport' | 'license';
    documentNumber: string;
    documentImage: string;
  }): Promise<ApiResponse<{ verificationStatus: 'pending' | 'approved' | 'rejected' }>> {
    try {
      return await withRetry(
        () => apiClient.post<{ verificationStatus: 'pending' | 'approved' | 'rejected' }>('/user/profile/verify', verificationData),
        { maxRetries: 3 }
      );
    } catch (error) {
      return createErrorResponse(error, 'Failed to submit verification. Please try again.') as unknown;
    }
  }

  /**
   * Get unified profile summary with LTV and cross-vertical stats
   */
  async getUnifiedProfile(): Promise<ApiResponse<UnifiedProfileSummary>> {
    try {
      return await withRetry(
        () => apiClient.get<UnifiedProfileSummary>('/api/profile/summary'),
        { maxRetries: 2 }
      );
    } catch (error) {
      return createErrorResponse(error, 'Failed to load profile. Please try again.') as unknown;
    }
  }

  /**
   * Get tier info
   */
  async getTierInfo(): Promise<ApiResponse<TierInfo>> {
    try {
      return await withRetry(
        () => apiClient.get<TierInfo>('/api/profile/tier'),
        { maxRetries: 2 }
      );
    } catch (error) {
      return createErrorResponse(error, 'Failed to load tier info. Please try again.') as unknown;
    }
  }
}

// Export singleton instance
const profileService = new ProfileService();
export default profileService;
