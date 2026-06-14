import axios, { AxiosInstance } from 'axios';
import {
  Platform,
  PlatformPost,
  PlatformConnectorResponse,
  PLATFORM_CONFIGS,
  PostStatus,
} from '../types';
import { platformLogger as logger } from '../utils/logger';

interface PlatformClient {
  client: AxiosInstance;
  baseUrl: string;
  platform: Platform;
}

// Platform service URLs
const PLATFORM_URLS: Record<Platform, string> = {
  twitter: process.env.TWITTER_SERVICE_URL || 'http://localhost:4780',
  instagram: process.env.INSTAGRAM_SERVICE_URL || 'http://localhost:4781',
  linkedin: process.env.LINKEDIN_SERVICE_URL || 'http://localhost:4790',
  tiktok: process.env.TIKTOK_SERVICE_URL || 'http://localhost:4785',
  facebook: process.env.FACEBOOK_SERVICE_URL || 'http://localhost:4782',
  whatsapp: process.env.WHATSAPP_SERVICE_URL || 'http://localhost:4783',
};

export class PlatformConnectorService {
  private clients: Map<Platform, PlatformClient> = new Map();
  private requestCache: Map<string, { data: unknown; expiry: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute cache

  constructor() {
    this.initializeClients();
  }

  // Initialize HTTP clients for each platform
  private initializeClients(): void {
    const platforms: Platform[] = ['twitter', 'instagram', 'linkedin', 'tiktok', 'facebook', 'whatsapp'];

    for (const platform of platforms) {
      const baseUrl = PLATFORM_URLS[platform];
      const config = PLATFORM_CONFIGS[platform];

      const client = axios.create({
        baseURL: baseUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'X-Platform': platform,
          'X-Service': 'rez-unified-calendar',
        },
      });

      // Request interceptor for logging and auth
      client.interceptors.request.use(
        (config) => {
          logger.debug(`[${platform}] ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
          });
          return config;
        },
        (error) => {
          logger.error(`[${platform}] Request error`, { error });
          return Promise.reject(error);
        }
      );

      // Response interceptor for error handling
      client.interceptors.response.use(
        (response) => {
          logger.debug(`[${platform}] Response ${response.status}`, {
            url: response.config.url,
          });
          return response;
        },
        async (error) => {
          const status = error.response?.status || 500;
          const message = error.response?.data?.message || error.message;

          logger.error(`[${platform}] Response error`, {
            status,
            message,
            url: error.config?.url,
          });

          // Implement retry logic for rate limiting
          if (status === 429 && error.config && !error.config._retry) {
            error.config._retry = true;
            const retryAfter = error.response?.headers?.['retry-after'];
            const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return client(error.config);
          }

          return Promise.reject(error);
        }
      );

      this.clients.set(platform, {
        client,
        baseUrl,
        platform,
      });

      logger.info(`Initialized client for ${platform}`, { baseUrl });
    }
  }

  // Get cached data or fetch
  private async getCachedOrFetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = this.requestCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      logger.debug(`Cache hit for ${key}`);
      return cached.data as T;
    }

    const data = await fetchFn();
    this.requestCache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_TTL,
    });
    return data;
  }

  // Clear cache for a specific key pattern
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.requestCache.keys()) {
        if (key.includes(pattern)) {
          this.requestCache.delete(key);
        }
      }
    } else {
      this.requestCache.clear();
    }
    logger.info('Cache cleared', { pattern: pattern || 'all' });
  }

  // Fetch posts from a specific platform
  async fetchPosts(platform: Platform): Promise<PlatformPost[]> {
    try {
      const clientData = this.clients.get(platform);
      if (!clientData) {
        throw new Error(`No client configured for platform: ${platform}`);
      }

      const cacheKey = `posts-${platform}`;
      return this.getCachedOrFetch(cacheKey, async () => {
        const response = await clientData.client.get<{
          success: boolean;
          data: unknown[];
        }>('/api/scheduled-posts');

        if (response.data.success && Array.isArray(response.data.data)) {
          return response.data.data.map(post => this.normalizePost(post, platform));
        }

        logger.warn(`Unexpected response format from ${platform}`, {
          hasData: !!response.data.data,
        });
        return [];
      });
    } catch (error) {
      logger.error(`Failed to fetch posts from ${platform}`, { error });
      // Return empty array instead of throwing - allows other platforms to continue
      return [];
    }
  }

  // Normalize post data from platform-specific format to unified format
  private normalizePost(data: unknown, platform: Platform): PlatformPost {
    const basePost = {
      id: (data as Record<string, unknown>).id as string || crypto.randomUUID(),
      platform,
      externalId: (data as Record<string, unknown>).externalId as string,
      content: {
        text: (data as Record<string, unknown>).content as string ||
              (data as Record<string, unknown>).text as string ||
              (data as Record<string, unknown>).caption as string ||
              '',
        media: (data as Record<string, unknown>).media as PlatformPost['content']['media'] || [],
        link: (data as Record<string, unknown>).link as string,
      },
      scheduledTime: new Date(
        (data as Record<string, unknown>).scheduledTime as string ||
        (data as Record<string, unknown>).scheduledAt as string ||
        Date.now()
      ),
      status: this.normalizeStatus((data as Record<string, unknown>).status as string),
      mediaUrls: (data as Record<string, unknown>).mediaUrls as string[],
      hashtags: this.extractHashtags((data as Record<string, unknown>).content as string),
      mentions: this.extractMentions((data as Record<string, unknown>).content as string),
      location: (data as Record<string, unknown>).location as string,
      metadata: (data as Record<string, unknown>).metadata as Record<string, unknown>,
      createdAt: new Date(
        (data as Record<string, unknown>).createdAt as string ||
        (data as Record<string, unknown>).created_at as string ||
        Date.now()
      ),
      updatedAt: new Date(
        (data as Record<string, unknown>).updatedAt as string ||
        (data as Record<string, unknown>).updated_at as string ||
        Date.now()
      ),
    };

    return basePost;
  }

  // Normalize status from platform-specific to unified
  private normalizeStatus(status: string): PostStatus {
    const statusMap: Record<string, PostStatus> = {
      // Twitter/Instagram statuses
      'draft': 'draft',
      'scheduled': 'scheduled',
      'published': 'published',
      'failed': 'failed',
      'pending': 'pending_review',
      'pending_review': 'pending_review',
      // LinkedIn statuses
      'queued': 'scheduled',
      'active': 'scheduled',
      // TikTok statuses
      'processing': 'pending_review',
      // Generic
      'error': 'failed',
      'success': 'published',
    };

    return statusMap[status.toLowerCase()] || 'scheduled';
  }

  // Extract hashtags from text
  private extractHashtags(text: string): string[] {
    if (!text) return [];
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    return text.match(hashtagRegex) || [];
  }

  // Extract mentions from text
  private extractMentions(text: string): string[] {
    if (!text) return [];
    const mentionRegex = /@[a-zA-Z0-9_]+/g;
    return text.match(mentionRegex) || [];
  }

  // Publish a post on the platform
  async publishPost(platform: Platform, postId: string): Promise<PlatformConnectorResponse<unknown>> {
    try {
      const clientData = this.clients.get(platform);
      if (!clientData) {
        return {
          success: false,
          error: `No client configured for platform: ${platform}`,
          platform,
          timestamp: new Date(),
        };
      }

      logger.info(`Publishing post ${postId} on ${platform}`);

      const response = await clientData.client.post(`/api/posts/${postId}/publish`);

      this.clearCache(`posts-${platform}`);

      return {
        success: true,
        data: response.data,
        platform,
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : String(error);

      logger.error(`Failed to publish post on ${platform}`, { postId, error: errorMessage });

      return {
        success: false,
        error: errorMessage,
        platform,
        timestamp: new Date(),
      };
    }
  }

  // Update schedule for a post
  async updateSchedule(
    platform: Platform,
    postId: string,
    newScheduledTime: Date
  ): Promise<PlatformConnectorResponse<unknown>> {
    try {
      const clientData = this.clients.get(platform);
      if (!clientData) {
        return {
          success: false,
          error: `No client configured for platform: ${platform}`,
          platform,
          timestamp: new Date(),
        };
      }

      logger.info(`Updating schedule for post ${postId} on ${platform}`, {
        newScheduledTime: newScheduledTime.toISOString(),
      });

      const response = await clientData.client.patch(`/api/posts/${postId}/schedule`, {
        scheduledTime: newScheduledTime.toISOString(),
      });

      this.clearCache(`posts-${platform}`);

      return {
        success: true,
        data: response.data,
        platform,
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : String(error);

      logger.error(`Failed to update schedule on ${platform}`, { postId, error: errorMessage });

      return {
        success: false,
        error: errorMessage,
        platform,
        timestamp: new Date(),
      };
    }
  }

  // Delete a post from the platform
  async deletePost(platform: Platform, postId: string): Promise<PlatformConnectorResponse<unknown>> {
    try {
      const clientData = this.clients.get(platform);
      if (!clientData) {
        return {
          success: false,
          error: `No client configured for platform: ${platform}`,
          platform,
          timestamp: new Date(),
        };
      }

      logger.info(`Deleting post ${postId} from ${platform}`);

      await clientData.client.delete(`/api/posts/${postId}`);

      this.clearCache(`posts-${platform}`);

      return {
        success: true,
        platform,
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : String(error);

      logger.error(`Failed to delete post from ${platform}`, { postId, error: errorMessage });

      return {
        success: false,
        error: errorMessage,
        platform,
        timestamp: new Date(),
      };
    }
  }

  // Create a new post on the platform
  async createPost(
    platform: Platform,
    postData: Partial<PlatformPost>
  ): Promise<PlatformConnectorResponse<PlatformPost>> {
    try {
      const clientData = this.clients.get(platform);
      if (!clientData) {
        return {
          success: false,
          error: `No client configured for platform: ${platform}`,
          platform,
          timestamp: new Date(),
        };
      }

      logger.info(`Creating post on ${platform}`);

      const payload = {
        content: postData.content,
        scheduledTime: postData.scheduledTime?.toISOString(),
        mediaUrls: postData.mediaUrls,
        hashtags: postData.hashtags,
        mentions: postData.mentions,
        location: postData.location,
        metadata: postData.metadata,
      };

      const response = await clientData.client.post('/api/posts', payload);

      this.clearCache(`posts-${platform}`);

      return {
        success: true,
        data: response.data.data as PlatformPost,
        platform,
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : String(error);

      logger.error(`Failed to create post on ${platform}`, { error: errorMessage });

      return {
        success: false,
        error: errorMessage,
        platform,
        timestamp: new Date(),
      };
    }
  }

  // Get platform-specific preview
  async getPreview(
    platform: Platform,
    postData: Partial<PlatformPost>
  ): Promise<PlatformConnectorResponse<unknown>> {
    try {
      const clientData = this.clients.get(platform);
      if (!clientData) {
        return {
          success: false,
          error: `No client configured for platform: ${platform}`,
          platform,
          timestamp: new Date(),
        };
      }

      const response = await clientData.client.post('/api/preview', {
        content: postData.content,
        platform,
      });

      return {
        success: true,
        data: response.data,
        platform,
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : String(error);

      return {
        success: false,
        error: errorMessage,
        platform,
        timestamp: new Date(),
      };
    }
  }

  // Check platform health/connectivity
  async checkPlatformHealth(platform: Platform): Promise<PlatformConnectorResponse<boolean>> {
    try {
      const clientData = this.clients.get(platform);
      if (!clientData) {
        return {
          success: false,
          error: `No client configured for platform: ${platform}`,
          platform,
          timestamp: new Date(),
        };
      }

      const startTime = Date.now();
      await clientData.client.get('/health');
      const latency = Date.now() - startTime;

      logger.debug(`Health check for ${platform}`, { latency });

      return {
        success: true,
        data: true,
        platform,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: axios.isAxiosError(error) ? error.message : 'Unknown error',
        platform,
        timestamp: new Date(),
      };
    }
  }

  // Check all platform health
  async checkAllPlatformHealth(): Promise<Map<Platform, boolean>> {
    const platforms: Platform[] = ['twitter', 'instagram', 'linkedin', 'tiktok', 'facebook', 'whatsapp'];
    const results = new Map<Platform, boolean>();

    for (const platform of platforms) {
      const result = await this.checkPlatformHealth(platform);
      results.set(platform, result.success);
    }

    return results;
  }

  // Sync all platforms (full refresh)
  async syncAllPlatforms(): Promise<Map<Platform, PlatformConnectorResponse<PlatformPost[]>>> {
    const platforms: Platform[] = ['twitter', 'instagram', 'linkedin', 'tiktok', 'facebook', 'whatsapp'];
    const results = new Map<Platform, PlatformConnectorResponse<PlatformPost[]>>();

    for (const platform of platforms) {
      try {
        const posts = await this.fetchPosts(platform);
        results.set(platform, {
          success: true,
          data: posts,
          platform,
          timestamp: new Date(),
        });
      } catch (error) {
        results.set(platform, {
          success: false,
          error: String(error),
          platform,
          timestamp: new Date(),
        });
      }
    }

    return results;
  }
}

export const platformConnectorService = new PlatformConnectorService();
