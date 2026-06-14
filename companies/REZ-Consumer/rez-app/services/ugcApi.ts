// @ts-nocheck
// User Generated Content (UGC) API Service
// Handles user photos, videos, and content sharing

import apiClient, { ApiResponse } from './apiClient';

export interface UGCMedia {
  _id: string;
  userId: string;
  user: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  type: 'photo' | 'video';
  url: string;
  thumbnail?: string;
  caption?: string;
  tags: string[];
  relatedProduct?: {
    _id: string;
    name: string;
    image: string;
  };
  relatedStore?: {
    _id: string;
    name: string;
    logo: string;
  };
  likes: number;
  comments: number;
  shares: number;
  views: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UGCComment {
  _id: string;
  userId: string;
  user: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  comment: string;
  likes: number;
  isLiked: boolean;
  replies: UGCComment[];
  createdAt: string;
}

export interface CreateUGCRequest {
  type: 'photo' | 'video';
  caption?: string;
  tags?: string[];
  relatedProductId?: string;
  relatedStoreId?: string;
}

export interface UGCFilters {
  type?: 'photo' | 'video';
  userId?: string;
  productId?: string;
  storeId?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

// ── Reel-specific types ──────────────────────────
export interface UgcReel {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: number;
  creator?: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
  store?: {
    id: string;
    name: string;
    logo?: string;
  } | null;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  isPublished: boolean;
  likes: number;
  comments: number;
  views: number;
  shares: number;
  tags: string[];
  createdAt: string;
}

export interface CreateReelRequest {
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  tags?: string[];
  taggedProducts?: string[];
  taggedStores?: string[];
  storeId?: string;
  category?: string;
}

export interface CreateReelResponse {
  id: string;
  title: string;
  moderationStatus: string;
  coinReward?: {
    coinsAwarded: number;
    status: string;
    message: string;
  } | null;
}

export interface UgcPagination {
  current: number;
  pages: number;
  total: number;
  hasMore: boolean;
}

// Response payload types
type UGCFeedResponse = { content: UGCMedia[]; total: number; hasMore: boolean };
type UGCContentResponse = { content: UGCMedia; message?: string };
type UGCListResponse = { content: UGCMedia[]; total: number };
type UGCLikeResponse = { isLiked: boolean; likes: number };
type UGCBookmarkResponse = { isBookmarked: boolean };
type UGCShareResponse = { shares: number };
type UGCCommentsResponse = { comments: UGCComment[]; total: number; hasMore: boolean };
type UGCCommentResponse = { comment: UGCComment };
type CommentLikeResponse = { isLiked: boolean; likes: number };
type MessageResponse = { message: string };
type ReelListResponse = { reels: UgcReel[]; pagination: UgcPagination };
type ReelCreateResponse = { id: string; title: string; moderationStatus: string; coinReward?: { coinsAwarded: number; status: string; message: string } | null };
type PostCreateResponse = {
  id?: string;
  type?: string;
  caption?: string;
  tags?: string[];
  imageUrls?: string[];
  [key: string]: unknown;
};

class UGCApiService {
  private baseUrl = '/ugc';

  /**
   * Get UGC feed
   */
  async getFeed(filters?: UGCFilters): Promise<ApiResponse<UGCFeedResponse>> {
    return apiClient.get<UGCFeedResponse>(this.baseUrl, filters as unknown as Record<string, string | number | boolean | null | undefined>);
  }

  /**
   * Get UGC by ID
   */
  async getById(id: string): Promise<ApiResponse<{ content: UGCMedia }>> {
    return apiClient.get<{ content: UGCMedia }>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create new UGC (upload)
   */
  async create(data: CreateUGCRequest, file: FormData): Promise<ApiResponse<UGCContentResponse>> {
    // Add metadata to FormData
    for (const key in data) {
      if (data[key as keyof CreateUGCRequest] !== undefined) {
        file.append(key, String(data[key as keyof CreateUGCRequest]));
      }
    }

    return apiClient.uploadFile(this.baseUrl, file);
  }

  /**
   * Update UGC
   */
  async update(id: string, data: {
    caption?: string;
    tags?: string[];
  }): Promise<ApiResponse<{ content: UGCMedia }>> {
    return apiClient.put<{ content: UGCMedia }>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Delete UGC
   */
  async delete(id: string): Promise<ApiResponse<MessageResponse>> {
    return apiClient.delete<MessageResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Like UGC content
   */
  async likeContent(id: string): Promise<ApiResponse<UGCLikeResponse>> {
    return apiClient.post<UGCLikeResponse>(`${this.baseUrl}/${id}/like`);
  }

  /**
   * Unlike UGC content
   */
  async unlikeContent(id: string): Promise<ApiResponse<UGCLikeResponse>> {
    return apiClient.delete<UGCLikeResponse>(`${this.baseUrl}/${id}/like`);
  }

  /**
   * Like/Unlike UGC (toggle)
   */
  async toggleLike(id: string): Promise<ApiResponse<UGCLikeResponse>> {
    return apiClient.post<UGCLikeResponse>(`${this.baseUrl}/${id}/like`);
  }

  /**
   * Bookmark UGC content
   */
  async bookmarkContent(id: string): Promise<ApiResponse<UGCBookmarkResponse>> {
    return apiClient.post<UGCBookmarkResponse>(`${this.baseUrl}/${id}/bookmark`);
  }

  /**
   * Remove bookmark from UGC content
   */
  async removeBookmark(id: string): Promise<ApiResponse<UGCBookmarkResponse>> {
    return apiClient.delete<UGCBookmarkResponse>(`${this.baseUrl}/${id}/bookmark`);
  }

  /**
   * Bookmark/Unbookmark UGC (toggle)
   */
  async toggleBookmark(id: string): Promise<ApiResponse<UGCBookmarkResponse>> {
    return apiClient.post<UGCBookmarkResponse>(`${this.baseUrl}/${id}/bookmark`);
  }

  /**
   * Check if user liked content
   */
  async checkLikeStatus(id: string): Promise<ApiResponse<{ isLiked: boolean }>> {
    return apiClient.get<{ isLiked: boolean }>(`${this.baseUrl}/${id}/like/status`);
  }

  /**
   * Check if user bookmarked content
   */
  async checkBookmarkStatus(id: string): Promise<ApiResponse<{ isBookmarked: boolean }>> {
    return apiClient.get<{ isBookmarked: boolean }>(`${this.baseUrl}/${id}/bookmark/status`);
  }

  /**
   * Share UGC
   */
  async share(id: string): Promise<ApiResponse<UGCShareResponse>> {
    return apiClient.post<UGCShareResponse>(`${this.baseUrl}/${id}/share`);
  }

  /**
   * Get comments for UGC
   */
  async getComments(id: string, limit = 20, offset = 0): Promise<ApiResponse<UGCCommentsResponse>> {
    return apiClient.get<UGCCommentsResponse>(`${this.baseUrl}/${id}/comments`, { limit, offset });
  }

  /**
   * Add comment to UGC
   */
  async addComment(id: string, comment: string, parentId?: string): Promise<ApiResponse<UGCCommentResponse>> {
    return apiClient.post<UGCCommentResponse>(`${this.baseUrl}/${id}/comments`, { comment, parentId });
  }

  /**
   * Like/Unlike comment
   */
  async toggleCommentLike(ugcId: string, commentId: string): Promise<ApiResponse<CommentLikeResponse>> {
    return apiClient.post<CommentLikeResponse>(`${this.baseUrl}/${ugcId}/comments/${commentId}/like`);
  }

  /**
   * Delete comment
   */
  async deleteComment(ugcId: string, commentId: string): Promise<ApiResponse<MessageResponse>> {
    return apiClient.delete<MessageResponse>(`${this.baseUrl}/${ugcId}/comments/${commentId}`);
  }

  /**
   * Report comment
   */
  async reportComment(ugcId: string, commentId: string, reason: string, description?: string): Promise<ApiResponse<MessageResponse>> {
    return apiClient.post<MessageResponse>(`${this.baseUrl}/${ugcId}/comments/${commentId}/report`, { reason, description });
  }

  /**
   * Get user's UGC
   */
  async getUserContent(userId?: string, type?: 'photo' | 'video'): Promise<ApiResponse<UGCListResponse>> {
    return apiClient.get<UGCListResponse>(`${this.baseUrl}/user/${userId || 'me'}`, type ? { type } : undefined);
  }

  /**
   * Get UGC for product
   */
  async getProductContent(productId: string): Promise<ApiResponse<UGCListResponse>> {
    return apiClient.get<UGCListResponse>(`${this.baseUrl}/product/${productId}`);
  }

  /**
   * Get UGC for store
   */
  async getStoreContent(storeId: string, params?: {
    type?: 'photo' | 'video';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<UGCListResponse>> {
    try {
      // First, try to get videos from the videos endpoint
      const videosResponse = await apiClient.get<UGCFeedResponse>(`/videos/store/${storeId}`, {
        limit: params?.limit || 20,
        offset: params?.offset || 0,
      });

      let allContent: UGCMedia[] = [];

      // Process videos if available
      if (videosResponse.success && videosResponse.data?.content) {
        allContent = [...videosResponse.data.content];
      }

      // Then try to get UGC content
      const ugcResponse = await apiClient.get<UGCFeedResponse>(`${this.baseUrl}/store/${storeId}`, params);

      // Add UGC content if available (deduplicate by _id)
      if (ugcResponse.success && ugcResponse.data?.content) {
        // Get existing IDs to avoid duplicates
        const existingIds = new Set(allContent.map(item => item._id));
        const uniqueUGC = ugcResponse.data.content.filter((item) => !existingIds.has(item._id));

        allContent = [...allContent, ...uniqueUGC];
      }

      // Return combined content (NO MOCK DATA)
      return {
        success: true,
        data: {
          content: allContent,
          total: allContent.length,
        },
      };
    } catch (error) {
      // Return empty array on error (NO MOCK DATA)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch content',
        data: {
          content: [],
          total: 0,
        },
      };
    }
  }

  // ── Reel-specific methods ─────────────────────────

  /**
   * Create a new UGC reel
   */
  async createReel(data: CreateReelRequest): Promise<{ success: boolean; data?: CreateReelResponse; message?: string; error?: string }> {
    try {
      const response = await apiClient.post<ReelCreateResponse>('/ugc/create', data as unknown as Record<string, unknown>);
      if (response.success && response.data) {
        return { success: true, data: response.data as CreateReelResponse, message: response.message };
      }
      return { success: false, error: response.message || 'Failed to create reel' };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to create reel' };
    }
  }

  /**
   * Create a new UGC post or story (photo-based content)
   */
  async createPost(data: {
    type: 'post' | 'story';
    imageUrls: string[];
    caption?: string;
    tags?: string[];
    taggedProducts?: string[];
    taggedStores?: string[];
    storeId?: string;
  }): Promise<{ success: boolean; data?: PostCreateResponse; message?: string; error?: string }> {
    try {
      const response = await apiClient.post<PostCreateResponse>('/ugc/create-post', data);
      if (response.success && response.data) {
        return { success: true, data: response.data, message: response.message };
      }
      return { success: false, error: response.message || 'Failed to create post' };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to create post' };
    }
  }

  /**
   * Get user's UGC reels with moderation status
   */
  async getMyReels(
    page: number = 1,
    limit: number = 20
  ): Promise<{ success: boolean; data?: ReelListResponse; error?: string }> {
    try {
      const response = await apiClient.get<ReelListResponse>(`/ugc/my-reels?page=${page}&limit=${limit}`);
      if (response.success && response.data) {
        return { success: true, data: response.data as ReelListResponse };
      }
      return { success: false, error: response.message || 'Failed to fetch reels' };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to fetch reels' };
    }
  }

  /**
   * Get public UGC reel feed (approved reels only)
   */
  async getReelFeed(
    page: number = 1,
    limit: number = 20
  ): Promise<{ success: boolean; data?: ReelListResponse; error?: string }> {
    try {
      const response = await apiClient.get<ReelListResponse>(`/ugc/feed?page=${page}&limit=${limit}`);
      if (response.success && response.data) {
        return { success: true, data: response.data as ReelListResponse };
      }
      return { success: false, error: response.message || 'Failed to fetch UGC feed' };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to fetch UGC feed' };
    }
  }

  /**
   * Get bookmarked UGC
   */
  async getBookmarked(type?: 'photo' | 'video'): Promise<ApiResponse<UGCListResponse>> {
    return apiClient.get<UGCListResponse>(`${this.baseUrl}/bookmarked`, type ? { type } : undefined);
  }

  /**
   * Report UGC
   */
  async report(id: string, reason: string, description?: string): Promise<ApiResponse<MessageResponse>> {
    return apiClient.post<MessageResponse>(`${this.baseUrl}/${id}/report`, { reason, description });
  }
}

// Export singleton instance
const ugcApi = new UGCApiService();
export default ugcApi;
