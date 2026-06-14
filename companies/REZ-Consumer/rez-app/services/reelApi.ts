// @ts-nocheck
// Reel API Service
// Handles all reel/video related API calls using the video endpoints

import apiClient, { ApiResponse } from './apiClient';

// ============================================
// TYPES
// ============================================

export interface Reel {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  category: string;
  duration?: number;
  creator: {
    id: string;
    name: string;
    avatar?: string;
    isVerified?: boolean;
  };
  store?: {
    id: string;
    name: string;
    logo?: string;
  };
  products?: {
    id: string;
    name: string;
    price: number;
    image?: string;
  }[];
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  isLiked?: boolean;
  isBookmarked?: boolean;
  createdAt: string;
  tags?: string[];
}

export interface ReelComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  comment: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
}

// ============================================
// REEL API SERVICE
// ============================================

class ReelApiService {
  /**
   * Get all reels with optional filters
   */
  async getReels(params?: {
    category?: string;
    page?: number;
    limit?: number;
    sortBy?: 'newest' | 'popular' | 'trending';
  }): Promise<ApiResponse<{ reels: Reel[]; pagination: Record<string, unknown> }>> {
    try {
      const response = await apiClient.get<{ videos?: unknown[]; pagination?: Record<string, unknown> }>('/videos', params);

      if (response.success && response.data) {
        const data = response.data;
        const videoArray = Array.isArray(data) ? data : (data.videos || []);
        const reels = (videoArray as unknown[]).map((video) => this.transformVideoToReel(video as Record<string, unknown>));

        return {
          success: true,
          data: {
            reels,
            pagination: ((data as Record<string, unknown>).pagination || (response.meta as Record<string, unknown> | undefined)?.pagination || Object.assign({}, {})) as Record<string, unknown>,
          },
        };
      }

      return { success: response.success, error: response.error };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      return { success: false, error: err };
    }
  }

  /**
   * Get trending reels
   */
  async getTrendingReels(params?: {
    limit?: number;
    timeframe?: '1d' | '7d' | '30d';
  }): Promise<ApiResponse<Reel[]>> {
    try {
      const response = await apiClient.get<{ videos?: unknown[] }>('/videos/trending', params);

      if (response.success && response.data) {
        const data = response.data;
        const videoArray = Array.isArray(data) ? data : (data.videos || []);
        const reels = (videoArray as unknown[]).map((video) => this.transformVideoToReel(video as Record<string, unknown>));
        return { success: true, data: reels };
      }

      return { success: response.success, error: response.error };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      return { success: false, error: err };
    }
  }

  /**
   * Get reels by category
   */
  async getReelsByCategory(category: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: 'newest' | 'popular' | 'trending';
  }): Promise<ApiResponse<{ reels: Reel[]; pagination: Record<string, unknown> }>> {
    try {
      const response = await apiClient.get<{ videos?: unknown[]; pagination?: Record<string, unknown> }>(`/videos/category/${category}`, params);

      if (response.success && response.data) {
        const data = response.data;
        const videoArray = Array.isArray(data) ? data : (data.videos || []);
        const reels = (videoArray as unknown[]).map((video) => this.transformVideoToReel(video as Record<string, unknown>));

        return {
          success: true,
          data: {
            reels,
            pagination: ((data as Record<string, unknown>).pagination || Object.assign({}, {})) as Record<string, unknown>,
          },
        };
      }

      return { success: response.success, error: response.error };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      return { success: false, error: err };
    }
  }

  /**
   * Get single reel by ID
   */
  async getReelById(reelId: string): Promise<ApiResponse<Reel>> {
    try {
      const response = await apiClient.get<Record<string, unknown>>(`/videos/${reelId}`);

      if (response.success && response.data) {
        const data = response.data;
        const reel = this.transformVideoToReel((data.video || data) as Record<string, unknown>);
        return { success: true, data: reel };
      }

      return { success: response.success, error: response.error };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      return { success: false, error: err };
    }
  }

  /**
   * Get reels by creator
   */
  async getReelsByCreator(creatorId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ reels: Reel[]; pagination: Record<string, unknown> }>> {
    try {
      const response = await apiClient.get<{ videos?: unknown[]; pagination?: Record<string, unknown> }>(`/videos/creator/${creatorId}`, params);

      if (response.success && response.data) {
        const data = response.data;
        const videoArray = Array.isArray(data) ? data : (data.videos || []);
        const reels = (videoArray as unknown[]).map((video) => this.transformVideoToReel(video as Record<string, unknown>));

        return {
          success: true,
          data: {
            reels,
            pagination: ((data as Record<string, unknown>).pagination || Object.assign({}, {})) as Record<string, unknown>,
          },
        };
      }

      return { success: response.success, error: response.error };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      return { success: false, error: err };
    }
  }

  /**
   * Get reels by store
   */
  async getReelsByStore(storeId: string, params?: {
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Reel[]>> {
    try {
      const response = await apiClient.get<{ videos?: unknown[] }>(`/videos/store/${storeId}`, params);

      if (response.success && response.data) {
        const data = response.data;
        const videoArray = Array.isArray(data) ? data : (data.videos || []);
        const reels = (videoArray as unknown[]).map((video) => this.transformVideoToReel(video as Record<string, unknown>));
        return { success: true, data: reels };
      }

      return { success: response.success, error: response.error };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      return { success: false, error: err };
    }
  }

  /**
   * Search reels
   */
  async searchReels(query: string, params?: {
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ reels: Reel[]; pagination: Record<string, unknown> }>> {
    try {
      const response = await apiClient.get<{ videos?: unknown[]; pagination?: Record<string, unknown> }>('/videos/search', { q: query, ...params });

      if (response.success && response.data) {
        const data = response.data;
        const videoArray = Array.isArray(data) ? data : (data.videos || []);
        const reels = (videoArray as unknown[]).map((video) => this.transformVideoToReel(video as Record<string, unknown>));

        return {
          success: true,
          data: {
            reels,
            pagination: ((data as Record<string, unknown>).pagination || Object.assign({}, {})) as Record<string, unknown>,
          },
        };
      }

      return { success: response.success, error: response.error };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      return { success: false, error: err };
    }
  }

  /**
   * Like/Unlike a reel
   */
  async toggleLike(reelId: string): Promise<ApiResponse<{ liked: boolean; likesCount: number }>> {
    try {
      const response = await apiClient.post<{ liked: boolean; likesCount: number } & Record<string, unknown>>(`/videos/${reelId}/like`);

      if (response.success && response.data) {
        const data = response.data;
        return {
          success: true,
          data: {
            liked: data.liked ?? (data as Record<string, unknown>).isLiked ?? true,
            likesCount: data.likesCount ?? (data as Record<string, unknown>).likes ?? 0,
          },
        };
      }

      return { success: response.success, error: response.error };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      return { success: false, error: err };
    }
  }

  /**
   * Bookmark/Unbookmark a reel
   */
  async toggleBookmark(reelId: string): Promise<ApiResponse<{ bookmarked: boolean }>> {
    try {
      const response = await apiClient.post<{ bookmarked: boolean } & Record<string, unknown>>(`/videos/${reelId}/bookmark`);

      if (response.success && response.data) {
        const data = response.data;
        return {
          success: true,
          data: {
            bookmarked: data.bookmarked ?? (data as Record<string, unknown>).isBookmarked ?? true,
          },
        };
      }

      return { success: response.success, error: response.error };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      return { success: false, error: err };
    }
  }

  /**
   * Track reel view
   */
  async trackView(reelId: string): Promise<ApiResponse<{ viewsCount: number }>> {
    try {
      const response = await apiClient.post<{ viewsCount: number } & Record<string, unknown>>(`/videos/${reelId}/view`);

      if (response.success) {
        const data = response.data as Record<string, unknown> | null | undefined;
        return {
          success: true,
          data: {
            viewsCount: (data?.viewsCount as number | undefined) ?? (data?.views as number | undefined) ?? 0,
          },
        };
      }

      return { success: response.success, error: response.error };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      return { success: false, error: err };
    }
  }

  /**
   * Get reel comments
   */
  async getComments(reelId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ comments: ReelComment[]; pagination: Record<string, unknown> }>> {
    try {
      const response = await apiClient.get<{ comments?: unknown[]; pagination?: Record<string, unknown> }>(`/videos/${reelId}/comments`, params);

      if (response.success && response.data) {
        const data = response.data;
        const commentArray = Array.isArray(data) ? data : ((data as Record<string, unknown>).comments as unknown[] || []);
        const comments = commentArray.map((comment) => {
          const c = comment as Record<string, unknown>;
          return {
            id: (c._id || c.id) as string,
            userId: ((c.user as Record<string, unknown>)?._id || c.userId) as string,
            userName: ((c.user as Record<string, unknown>)?.name || c.userName || 'Anonymous') as string,
            userAvatar: ((c.user as Record<string, unknown>)?.avatar || c.userAvatar) as string | undefined,
            comment: (c.comment || c.text || c.content) as string,
            createdAt: c.createdAt as string,
            likes: (c.likes as number) || 0,
            isLiked: (c.isLiked as boolean) || false,
          };
        });

        return {
          success: true,
          data: {
            comments,
            pagination: ((data as Record<string, unknown>).pagination || Object.assign({}, {})) as Record<string, unknown>,
          },
        };
      }

      return { success: response.success, error: response.error };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      return { success: false, error: err };
    }
  }

  /**
   * Add a comment to a reel
   */
  async addComment(reelId: string, comment: string): Promise<ApiResponse<ReelComment>> {
    try {
      const response = await apiClient.post<Record<string, unknown>>(`/videos/${reelId}/comments`, { comment });

      if (response.success && response.data) {
        const data = response.data;
        const newComment = (data.comment || data) as Record<string, unknown>;
        return {
          success: true,
          data: {
            id: (newComment._id || newComment.id) as string,
            userId: ((newComment.user as Record<string, unknown>)?._id || newComment.userId) as string,
            userName: ((newComment.user as Record<string, unknown>)?.name || newComment.userName) as string,
            userAvatar: ((newComment.user as Record<string, unknown>)?.avatar || newComment.userAvatar) as string | undefined,
            comment: (newComment.comment || newComment.text) as string,
            createdAt: newComment.createdAt as string,
            likes: 0,
            isLiked: false,
          },
        };
      }

      return { success: response.success, error: response.error };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      return { success: false, error: err };
    }
  }

  /**
   * Share a reel (tracks share event on backend)
   */
  async shareReel(reelId: string): Promise<ApiResponse<{ shares: number }>> {
    try {
      const response = await apiClient.post<{ shares: number }>(`/videos/${reelId}/share`);

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            shares: response.data.shares ?? 0,
          },
        };
      }

      return { success: response.success, error: response.error };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      return { success: false, error: err };
    }
  }

  /**
   * Like/Unlike a comment
   */
  async toggleCommentLike(reelId: string, commentId: string): Promise<ApiResponse<{ isLiked: boolean; likesCount: number }>> {
    try {
      const response = await apiClient.post<{ isLiked: boolean; likesCount: number }>(`/videos/${reelId}/comments/${commentId}/like`);

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            isLiked: response.data.isLiked ?? true,
            likesCount: response.data.likesCount ?? 0,
          },
        };
      }

      return { success: response.success, error: response.error };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      return { success: false, error: err };
    }
  }

  /**
   * Report a reel
   */
  async reportReel(reelId: string, reason: string, details?: string): Promise<ApiResponse<{ reported: boolean }>> {
    try {
      const response = await apiClient.post<{ reported: boolean }>(`/videos/${reelId}/report`, { reason, details });

      if (response.success) {
        return { success: true, data: { reported: true } };
      }

      return { success: response.success, error: response.error };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      return { success: false, error: err };
    }
  }

  /**
   * Transform backend video object to frontend Reel format
   */
  private transformVideoToReel(video): Reel {
    // Extract creator name from nested profile object
    let creatorName = 'Creator';
    if (video.creator?.profile?.firstName) {
      creatorName = `${video.creator.profile.firstName} ${video.creator.profile.lastName || ''}`.trim();
    } else if (video.creator?.name) {
      creatorName = video.creator.name;
    } else if (video.creator?.username) {
      creatorName = video.creator.username;
    }

    // Extract avatar from profile
    const creatorAvatar = video.creator?.profile?.avatar
      || video.creator?.avatar
      || video.creator?.profileImage;

    // Normalize stats from whichever backend format is present.
    // The backend may return video stats under `stats`, `metrics`, `engagement`, or `analytics`.
    // We pick one canonical source in priority order and extract all four fields from it,
    // falling back field-by-field only when the primary source is missing a value.
    const src = video.stats || video.metrics || video.engagement || video.analytics || {};

    const extractCount = (field: string, altField?: string): number => {
      const val = src[field] ?? src[altField ?? ''];
      if (Array.isArray(val)) return val.length; // likes may be an array of user IDs
      return typeof val === 'number' ? val : 0;
    };

    const stats = {
      likes: extractCount('likes'),
      comments: extractCount('comments'),
      views: extractCount('views', 'totalViews'),
      shares: extractCount('shares'),
    };

    return {
      id: video._id || video.id,
      title: video.title || '',
      description: video.description,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnail || video.thumbnailUrl,
      category: video.category || 'general',
      duration: video.duration || video.metadata?.duration,
      creator: {
        id: video.creator?._id || video.creator?.id || video.creatorId,
        name: creatorName,
        avatar: creatorAvatar,
        isVerified: video.creator?.isVerified || false,
      },
      store: video.products?.[0]?.store ? {
        id: video.products[0].store._id || video.products[0].store.id,
        name: video.products[0].store.name,
        logo: video.products[0].store.logo,
      } : undefined,
      products: video.products?.map((p) => ({
        id: p._id || p.id,
        name: p.name,
        price: p.pricing?.selling || p.pricing?.salePrice || p.price || 0,
        image: p.images?.[0] || p.image,
      })),
      stats,
      isLiked: video.isLiked || false,
      isBookmarked: video.isBookmarked || false,
      createdAt: video.createdAt,
      tags: video.tags || [],
    };
  }
}

// Create singleton instance
const reelApi = new ReelApiService();

export default reelApi;
export { reelApi };
