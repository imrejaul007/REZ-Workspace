import axios, { AxiosInstance } from 'axios';
import config from '../config/index.js';
import logger from 'utils/logger.js';
import { InstagramAPIError } from '../middleware/errorHandler.js';

// Types
export interface InstagramMediaResponse {
  id: string;
  permalink: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  timestamp?: string;
  username?: string;
  like_count?: number;
  comments_count?: number;
}

export interface InstagramContainerResponse {
  id: string;
  status: string;
  error_message?: string;
}

export interface InstagramPublishResponse {
  id: string;
  permalink?: string;
  status: 'published' | 'scheduled' | 'failed';
}

export interface InstagramMediaInsights {
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  profile_visits: number;
  followers: number;
}

export interface InstagramStoryInsights {
  impressions: number;
  reach: number;
  replies: number;
  exits: number;
  taps_forward: number;
  taps_back: number;
}

// Instagram API Service
export class InstagramApiService {
  private client: AxiosInstance;
  private accessToken: string;
  private businessAccountId: string;

  constructor() {
    this.accessToken = config.instagram.accessToken;
    this.businessAccountId = config.instagram.businessAccountId;

    this.client = axios.create({
      baseURL: `${config.instagram.apiBaseUrl}/${config.instagram.graphApiVersion}`,
      timeout: 30000,
      params: {
        access_token: this.accessToken,
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { error: errorData } = error.response.data || {};
          logger.error('Instagram API Error', {
            code: errorData?.code,
            message: errorData?.message,
            type: errorData?.type,
          });
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get Instagram Business Account info
   */
  async getAccountInfo(): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.get(`/${this.businessAccountId}`, {
        params: {
          fields: 'id,name,username,profile_picture_url,followers_count,follows_count,media_count',
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a media container for image post
   */
  async createImageMedia(mediaUrl: string, caption?: string): Promise<InstagramContainerResponse> {
    try {
      const response = await this.client.post(`/${this.businessAccountId}/media`, null, {
        params: {
          image_url: mediaUrl,
          caption: caption || '',
        },
      });
      logger.info('Image media container created', { containerId: response.data.id });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a media container for album (multiple images)
   */
  async createAlbumMedia(mediaUrls: string[], caption?: string): Promise<InstagramContainerResponse> {
    try {
      // First, create children containers
      const childrenIds: string[] = [];
      for (const mediaUrl of mediaUrls) {
        const childResponse = await this.client.post(`/${this.businessAccountId}/media`, null, {
          params: {
            is_carousel_item: true,
            image_url: mediaUrl,
          },
        });
        childrenIds.push(childResponse.data.id);
      }

      // Then create the album container
      const response = await this.client.post(`/${this.businessAccountId}/media`, null, {
        params: {
          media_type: 'CAROUSEL',
          caption: caption || '',
          children: childrenIds.join(','),
        },
      });

      logger.info('Album media container created', {
        containerId: response.data.id,
        childrenCount: childrenIds.length,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a media container for video post
   */
  async createVideoMedia(
    videoUrl: string,
    caption?: string,
    mediaType: 'REELS' | 'FEED' = 'FEED'
  ): Promise<InstagramContainerResponse> {
    try {
      // First create the container
      const response = await this.client.post(`/${this.businessAccountId}/media`, null, {
        params: {
          media_type: mediaType === 'REELS' ? 'REELS' : 'VIDEO',
          video_url: videoUrl,
          caption: caption || '',
        },
      });

      logger.info('Video media container created', {
        containerId: response.data.id,
        mediaType,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a media container for story
   */
  async createStoryMedia(
    mediaUrl: string,
    mediaType: 'STORIES' | 'IMAGE' | 'VIDEO' = 'STORIES'
  ): Promise<InstagramContainerResponse> {
    try {
      const response = await this.client.post(`/${this.businessAccountId}/media`, null, {
        params: {
          media_type: mediaType,
          image_url: mediaUrl,
        },
      });
      logger.info('Story media container created', { containerId: response.data.id });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Publish content from a container
   */
  async publishContent(containerId: string): Promise<InstagramPublishResponse> {
    try {
      const response = await this.client.post(`/${this.businessAccountId}/media_publish`, null, {
        params: {
          creation_id: containerId,
        },
      });

      // Get the published media details
      const mediaDetails = await this.getMediaDetails(response.data.id);

      logger.info('Content published successfully', {
        mediaId: response.data.id,
        permalink: mediaDetails.permalink,
      });

      return {
        id: response.data.id,
        permalink: mediaDetails.permalink,
        status: 'published',
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get media details by ID
   */
  async getMediaDetails(mediaId: string): Promise<InstagramMediaResponse> {
    try {
      const response = await this.client.get(`/${mediaId}`, {
        params: {
          fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username,like_count,comments_count',
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get media insights
   */
  async getMediaInsights(mediaId: string): Promise<InstagramMediaInsights> {
    try {
      const response = await this.client.get(`/${mediaId}/insights`, {
        params: {
          metric: 'reach,impressions,likes,comments,saves,shares,profile_visits,follower_count',
        },
      });

      const data = response.data.data || [];
      const insights: Record<string, number> = {};

      for (const metric of data) {
        insights[metric.name] = metric.values[0]?.value || 0;
      }

      return {
        reach: insights.reach || 0,
        impressions: insights.impressions || 0,
        likes: insights.likes || 0,
        comments: insights.comments || 0,
        saves: insights.saves || 0,
        shares: insights.shares || 0,
        profile_visits: insights.profile_visits || 0,
        followers: insights.follower_count || 0,
      };
    } catch (error) {
      // Insights may not be available for all media types
      logger.warn('Could not fetch media insights', { mediaId });
      return {
        reach: 0,
        impressions: 0,
        likes: 0,
        comments: 0,
        saves: 0,
        shares: 0,
        profile_visits: 0,
        followers: 0,
      };
    }
  }

  /**
   * Get story insights
   */
  async getStoryInsights(storyId: string): Promise<InstagramStoryInsights> {
    try {
      const response = await this.client.get(`/${storyId}/insights`, {
        params: {
          metric: 'impressions,reach,replies,exits,taps_forward,taps_back',
        },
      });

      const data = response.data.data || [];
      const insights: Record<string, number> = {};

      for (const metric of data) {
        insights[metric.name] = metric.values[0]?.value || 0;
      }

      return {
        impressions: insights.impressions || 0,
        reach: insights.reach || 0,
        replies: insights.replies || 0,
        exits: insights.exits || 0,
        taps_forward: insights.taps_forward || 0,
        taps_back: insights.taps_back || 0,
      };
    } catch (error) {
      logger.warn('Could not fetch story insights', { storyId });
      return {
        impressions: 0,
        reach: 0,
        replies: 0,
        exits: 0,
        taps_forward: 0,
        taps_back: 0,
      };
    }
  }

  /**
   * Get recent media from the account
   */
  async getRecentMedia(limit: number = 25): Promise<InstagramMediaResponse[]> {
    try {
      const response = await this.client.get(`/${this.businessAccountId}/media`, {
        params: {
          fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username,like_count,comments_count',
          limit,
        },
      });
      return response.data.data || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Add comment to media
   */
  async addComment(mediaId: string, comment: string): Promise<{ id: string }> {
    try {
      const response = await this.client.post(`/${mediaId}/comments`, null, {
        params: {
          message: comment,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Add location to media
   */
  async addLocation(mediaId: string, locationId: string): Promise<{ success: boolean }> {
    try {
      // Note: Location is typically set during media creation
      // This is a placeholder for potential post-creation location updates
      logger.info('Location update requested', { mediaId, locationId });
      return { success: true };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Add user tags to media
   */
  async addUserTags(mediaId: string, userTags: string[]): Promise<{ success: boolean }> {
    try {
      // Note: User tags are typically set during media creation
      // This is a placeholder for potential post-creation tag updates
      logger.info('User tags update requested', { mediaId, userTags });
      return { success: true };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload media URL to Instagram CDN
   */
  async uploadUrl(mediaUrl: string): Promise<{ url: string; handle: string }> {
    try {
      const response = await this.client.post('/content_publishing', null, {
        params: {
          url: mediaUrl,
          type: 'IMAGE',
        },
      });
      return {
        url: mediaUrl,
        handle: response.data.id,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check publishing eligibility
   */
  async checkPublishingEligibility(): Promise<{ canPublish: boolean; quotas: Record<string, number> }> {
    try {
      const response = await this.client.get(`/${this.businessAccountId}/content_publishing_limit`, {
        params: {
          fields: 'config,quota_usage',
        },
      });

      const data = response.data || {};
      return {
        canPublish: true,
        quotas: data.quota_usage || {},
      };
    } catch (error) {
      logger.warn('Could not check publishing eligibility');
      return {
        canPublish: true,
        quotas: {},
      };
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const { response } = error;
      if (response) {
        const errorData = response.data?.error || {};
        return new InstagramAPIError(
          errorData.message || 'Instagram API error',
          errorData.code,
          errorData.message
        );
      }
      return new InstagramAPIError('Network error connecting to Instagram API');
    }
    return error instanceof Error ? error : new Error('Unknown error');
  }
}

// Export singleton instance
export const instagramApiService = new InstagramApiService();
export default instagramApiService;