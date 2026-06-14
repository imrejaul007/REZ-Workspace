import { apiClient } from './client';
import {
  PromotionalVideo,
  CreateVideoRequest,
  UpdateVideoRequest,
  VideoListResponse,
  VideoResponse,
  StoreVideoAnalytics,
  AnalyticsResponse,
  VideoFilters,
} from '../../types/promotionalVideo';
import { logger } from '../../utils/logger';

/**
 * Promotional Videos API Service
 *
 * Handles all API calls related to merchant promotional videos.
 * These videos appear in the UGC section on MainStorePage in the user app.
 */
class PromotionalVideosService {
  private basePath = 'merchant/videos';

  /**
   * Create a new promotional video
   *
   * @param data - Video creation data including title, videoUrl, products, etc.
   * @returns The created promotional video
   *
   * Requirements:
   * - Title: Required, max 200 chars
   * - Duration: Required, max 180 seconds (3 minutes)
   * - Products: Required, min 1 product must be tagged
   * - Video URL: Required, must be a valid Cloudinary URL
   */
  async createVideo(data: CreateVideoRequest): Promise<PromotionalVideo> {
    try {
      if (__DEV__) logger.log('[PROMO-VIDEO] Creating promotional video', { title: data.title });

      const response = await apiClient.post<{ video: PromotionalVideo }>(this.basePath, data);

      if (!response.success) {
        throw new Error(response.message || 'Failed to create video');
      }

      if (__DEV__)
        logger.info('[PROMO-VIDEO] Video created successfully:', response.data?.video._id);
      return response.data!.video;
    } catch (error) {
      if (__DEV__) logger.error('[PROMO-VIDEO] Create video failed', error);

      let errorMessage = 'Failed to create promotional video';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Get all promotional videos for a store
   *
   * @param storeId - The store ID to get videos for
   * @param options - Filter and pagination options
   * @returns List of videos with pagination info
   */
  async getStoreVideos(
    storeId: string,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: 'newest' | 'popular' | 'views';
    }
  ): Promise<VideoListResponse> {
    try {
      if (__DEV__) logger.log('[PROMO-VIDEO] Fetching videos for store', { storeId });

      const params = new URLSearchParams();
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.sortBy) params.append('sortBy', options.sortBy);

      const queryString = params.toString();
      const url = `${this.basePath}/store/${storeId}${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<
        VideoListResponse['videos'] & { pagination: VideoListResponse['pagination'] }
      >(url);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch videos');
      }

      if (__DEV__) logger.log('[PROMO-VIDEO] Fetched videos', { count: response.data?.length || 0 });

      // Handle response format
      const videos = Array.isArray(response.data)
        ? response.data
        : (response.data as unknown)?.videos || [];
      const pagination = (response.data as unknown)?.pagination || {
        page: options?.page || 1,
        limit: options?.limit || 20,
        total: videos.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      return { videos, pagination };
    } catch (error) {
      if (__DEV__) logger.error('[PROMO-VIDEO] Fetch videos failed', error);

      let errorMessage = 'Failed to fetch promotional videos';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Get a single promotional video by ID
   *
   * @param videoId - The video ID
   * @returns The video details
   */
  async getVideo(videoId: string): Promise<PromotionalVideo> {
    try {
      if (__DEV__) logger.log('[PROMO-VIDEO] Fetching video', { videoId });

      const response = await apiClient.get<{ video: PromotionalVideo }>(
        `${this.basePath}/${videoId}`
      );

      if (!response.success) {
        throw new Error(response.message || 'Video not found');
      }

      if (__DEV__) logger.log('[PROMO-VIDEO] Video fetched successfully');
      return response.data!.video;
    } catch (error) {
      if (__DEV__) logger.error('[PROMO-VIDEO] Fetch video failed', error);

      let errorMessage = 'Failed to fetch video';
      if (error.response?.status === 404) {
        errorMessage = 'Video not found';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Update a promotional video
   *
   * @param videoId - The video ID to update
   * @param data - Update data (title, description, products, tags)
   * @returns The updated video
   *
   * Note: At least 1 product must remain tagged to the video
   */
  async updateVideo(videoId: string, data: UpdateVideoRequest): Promise<PromotionalVideo> {
    try {
      if (__DEV__) logger.log('[PROMO-VIDEO] Updating video', { videoId });

      const response = await apiClient.put<{ video: PromotionalVideo }>(
        `${this.basePath}/${videoId}`,
        data
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to update video');
      }

      if (__DEV__) logger.log('[PROMO-VIDEO] Video updated successfully');
      return response.data!.video;
    } catch (error) {
      if (__DEV__) logger.error('[PROMO-VIDEO] Update video failed', error);

      let errorMessage = 'Failed to update video';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Delete a promotional video
   *
   * @param videoId - The video ID to delete
   *
   * This will also delete the video from Cloudinary using the publicId
   */
  async deleteVideo(videoId: string): Promise<void> {
    try {
      if (__DEV__) console.log('🎥 [PROMO-VIDEO] Deleting video:', videoId);

      const response = await apiClient.delete(`${this.basePath}/${videoId}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete video');
      }

      if (__DEV__) logger.info('✅ [PROMO-VIDEO] Video deleted successfully');
    } catch (error) {
      if (__DEV__) console.error('❌ [PROMO-VIDEO] Delete video failed:', error);

      let errorMessage = 'Failed to delete video';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Get video analytics for a store
   *
   * @param storeId - The store ID
   * @returns Analytics data including total views, likes, best performing video, etc.
   */
  async getStoreAnalytics(storeId: string): Promise<StoreVideoAnalytics> {
    try {
      if (__DEV__) console.log('📊 [PROMO-VIDEO] Fetching analytics for store:', storeId);

      const response = await apiClient.get<StoreVideoAnalytics>(
        `${this.basePath}/analytics/${storeId}`
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch analytics');
      }

      if (__DEV__) logger.info('✅ [PROMO-VIDEO] Analytics fetched successfully');
      return response.data!;
    } catch (error) {
      if (__DEV__) console.error('❌ [PROMO-VIDEO] Fetch analytics failed:', error);

      // Return default analytics on error
      return {
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
        totalComments: 0,
        avgEngagementRate: 0,
        bestPerforming: null,
        recentActivity: [],
        videoPerformance: [],
      };
    }
  }

  /**
   * Toggle video publish status
   *
   * @param videoId - The video ID
   * @param isPublished - Whether the video should be published
   * @returns The updated video
   */
  async togglePublish(videoId: string, isPublished: boolean): Promise<PromotionalVideo> {
    return this.updateVideo(videoId, { isPublished });
  }

  /**
   * Validate video data before creation
   *
   * @param data - Video creation data
   * @returns Validation result with errors if unknown
   */
  validateVideoData(data: Partial<CreateVideoRequest>): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    if (!data.title?.trim()) {
      errors.title = 'Title is required';
    } else if (data.title.length > 200) {
      errors.title = 'Title must be 200 characters or less';
    }

    if (!data.videoUrl) {
      errors.video = 'Video is required';
    }

    if (data.duration !== undefined) {
      if (data.duration < 1) {
        errors.duration = 'Video must be at least 1 second';
      } else if (data.duration > 180) {
        errors.duration = 'Video must be 3 minutes or less';
      }
    }

    if (!data.products?.length) {
      errors.products = 'At least one product must be tagged';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Format duration for display
   *
   * @param seconds - Duration in seconds
   * @returns Formatted duration string (e.g., "2:30")
   */
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format view count for display
   *
   * @param views - Number of views
   * @returns Formatted string (e.g., "1.2K", "500")
   */
  formatViewCount(views: number): string {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  }
}

export const promotionalVideosService = new PromotionalVideosService();
export default promotionalVideosService;
import { logger } from '../../utils/logger';
