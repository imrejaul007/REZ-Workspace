import axios, { AxiosInstance, AxiosError } from 'axios';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import {
  TikTokConfig,
  TikTokOAuthToken,
  TikTokUser,
  VideoPostRequest,
  Video,
  Comment,
  ScheduledPost,
  VideoAnalytics,
  ProfileAnalytics,
  TikTokApiException,
  TikTokErrorCode,
  TikTokApiError,
  TIKTOK_SCOPES_STRING,
} from '../types';

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
};

const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';
const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize';

export class TikTokService {
  private config: TikTokConfig;
  private tenantTokens: Map<string, TikTokOAuthToken> = new Map();
  private scheduledPosts: Map<string, ScheduledPost> = new Map();
  private scheduledTimers: Map<string, NodeJS.Timeout> = new Map();

  // Retry config - can be customized per request
  private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;

  constructor() {
    this.config = {
      clientKey: process.env.TIKTOK_CLIENT_KEY || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
      accessToken: process.env.TIKTOK_ACCESS_TOKEN || '',
      callbackUrl: process.env.TIKTOK_CALLBACK_URL || 'http://localhost:4785/auth/callback',
    };

    // Restore scheduled posts from storage if available
    this.restoreScheduledPosts();
  }

  /**
   * Configure retry behavior
   */
  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Execute a function with retry logic
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    operationName: string,
    tenantId?: string
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = this.retryConfig.initialDelayMs;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (this.isRetryableError(error)) {
          logger.warn(`${operationName} failed (attempt ${attempt}/${this.retryConfig.maxRetries})`, {
            tenantId,
            error: (error as Error).message,
          });

          if (attempt < this.retryConfig.maxRetries) {
            // Exponential backoff with jitter
            const jitter = Math.random() * 0.3 * delay;
            await this.sleep(delay + jitter);
            delay = Math.min(delay * 2, this.retryConfig.maxDelayMs);
            continue;
          }
        }

        // Non-retryable error, throw immediately
        break;
      }
    }

    throw lastError;
  }

  /**
   * Check if an error should trigger a retry
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof TikTokApiException) {
      // Don't retry auth errors or client errors
      return [
        TikTokErrorCode.RATE_LIMITED,
        TikTokErrorCode.NETWORK_ERROR,
        TikTokErrorCode.UNKNOWN,
      ].includes(error.code);
    }

    if (error instanceof AxiosError) {
      // Retry on network errors and 5xx server errors
      if (!error.response) return true; // Network error
      return error.response.status >= 500 || error.response.status === 429;
    }

    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create axios client with proper configuration
   */
  private getClient(tenantId: string): AxiosInstance {
    const token = this.tenantTokens.get(tenantId) || { access_token: this.config.accessToken };
    return axios.create({
      baseURL: TIKTOK_API_BASE,
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });
  }

  /**
   * Handle TikTok API errors
   */
  private handleApiError(error: unknown, operation: string, tenantId?: string): never {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const apiError: TikTokApiError | undefined = error.response?.data;

      logger.error(`TikTok API error in ${operation}`, {
        tenantId,
        status,
        error: apiError || error.message,
      });

      if (status === 401) {
        throw new TikTokApiException(
          TikTokErrorCode.UNAUTHORIZED,
          'Authentication failed or token expired',
          apiError
        );
      }

      if (status === 429) {
        throw new TikTokApiException(
          TikTokErrorCode.RATE_LIMITED,
          'Rate limit exceeded. Please try again later.',
          apiError
        );
      }

      if (status === 400) {
        const errorMsg = apiError?.message || error.message;
        if (errorMsg.includes('quota')) {
          throw new TikTokApiException(
            TikTokErrorCode.QUOTA_EXCEEDED,
            'API quota exceeded',
            apiError
          );
        }
        if (errorMsg.includes('scope')) {
          throw new TikTokApiException(
            TikTokErrorCode.SCOPE_INSUFFICIENT,
            'Insufficient permissions. Required scope not granted.',
            apiError
          );
        }
      }
    }

    // Default error handling
    throw new TikTokApiException(
      TikTokErrorCode.UNKNOWN,
      `Failed to ${operation}: ${(error as Error).message}`,
      undefined
    );
  }

  // ==========================================
  // OAuth Methods
  // ==========================================

  /**
   * Generate OAuth authorization URL
   * Uses TikTok Login Kit OAuth 2.0 flow
   */
  generateAuthUrl(tenantId: string): string {
    const state = Buffer.from(
      JSON.stringify({ tenantId, timestamp: Date.now() })
    ).toString('base64url'); // Use base64url for URL safety

    const params = new URLSearchParams({
      client_key: this.config.clientKey,
      response_type: 'code',
      scope: TIKTOK_SCOPES_STRING,
      redirect_uri: this.config.callbackUrl,
      state,
    });

    return `${TIKTOK_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * POST /oauth/token/
   */
  async exchangeCodeForToken(code: string, tenantId: string): Promise<TikTokOAuthToken> {
    return this.withRetry(async () => {
      try {
        const response = await axios.post(
          `${TIKTOK_API_BASE}/oauth/token/`,
          {
            client_key: this.config.clientKey,
            client_secret: this.config.clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: this.config.callbackUrl,
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        const tokenData: TikTokOAuthToken = response.data;
        this.tenantTokens.set(tenantId, tokenData);

        logger.info('TikTok OAuth successful', { tenantId, scope: tokenData.scope });
        return tokenData;
      } catch (error) {
        this.handleApiError(error, 'exchange code for token', tenantId);
      }
    }, 'OAuth token exchange', tenantId);
  }

  /**
   * Refresh access token
   * POST /oauth/token/
   */
  async refreshToken(refreshToken: string, tenantId: string): Promise<TikTokOAuthToken> {
    return this.withRetry(async () => {
      try {
        const response = await axios.post(
          `${TIKTOK_API_BASE}/oauth/token/`,
          {
            client_key: this.config.clientKey,
            client_secret: this.config.clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        const tokenData: TikTokOAuthToken = response.data;
        this.tenantTokens.set(tenantId, tokenData);

        logger.info('TikTok token refreshed', { tenantId });
        return tokenData;
      } catch (error) {
        this.handleApiError(error, 'refresh token', tenantId);
      }
    }, 'OAuth token refresh', tenantId);
  }

  /**
   * Set access token directly (for manual token configuration)
   */
  setAccessToken(tenantId: string, accessToken: string, openId?: string): void {
    this.tenantTokens.set(tenantId, {
      access_token: accessToken,
      open_id: openId || '',
      scope: TIKTOK_SCOPES_STRING,
      expires_in: 0,
      token_type: 'Bearer',
    });
    logger.info('Access token set', { tenantId });
  }

  // ==========================================
  // User Methods
  // ==========================================

  /**
   * Get current user info
   * GET /user/info/
   */
  async getCurrentUser(tenantId: string): Promise<TikTokUser> {
    return this.withRetry(async () => {
      const client = this.getClient(tenantId);

      try {
        const response = await client.get('/user/info/', {
          params: {
            fields: 'open_id,union_id,display_name,avatar_url,bio_description,is_verified,follower_count,following_count,likes_count,video_count',
          },
        });

        if (response.data?.data?.user) {
          return response.data.data.user;
        }

        throw new TikTokApiException(
          TikTokErrorCode.UNKNOWN,
          'Failed to parse user response'
        );
      } catch (error) {
        this.handleApiError(error, 'get current user', tenantId);
      }
    }, 'Get current user', tenantId);
  }

  /**
   * Get user info with specific fields
   */
  async getUserInfo(tenantId: string, fields?: string[]): Promise<TikTokUser> {
    return this.withRetry(async () => {
      const client = this.getClient(tenantId);
      const fieldList = fields || [
        'open_id', 'union_id', 'display_name', 'avatar_url',
        'bio_description', 'is_verified', 'follower_count',
        'following_count', 'likes_count', 'video_count'
      ];

      try {
        const response = await client.get('/user/info/', {
          params: { fields: fieldList.join(',') },
        });

        if (response.data?.data?.user) {
          return response.data.data.user;
        }

        throw new TikTokApiException(
          TikTokErrorCode.UNKNOWN,
          'Failed to parse user info response'
        );
      } catch (error) {
        this.handleApiError(error, 'get user info', tenantId);
      }
    }, 'Get user info', tenantId);
  }

  // ==========================================
  // Video Methods
  // ==========================================

  /**
   * Initialize video upload
   * POST /video/init/
   */
  private async initializeUpload(
    tenantId: string,
    videoSize: number
  ): Promise<string> {
    const token = this.tenantTokens.get(tenantId) || { access_token: this.config.accessToken };

    try {
      const response = await axios.post(
        `${TIKTOK_API_BASE}/video/init/`,
        {
          upload_type: 'upload',
          source_info: {
            source: 'FILE_UPLOAD',
            video_size: videoSize,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const uploadId = response.data?.data?.upload_id;
      if (!uploadId) {
        throw new TikTokApiException(
          TikTokErrorCode.UPLOAD_FAILED,
          'Failed to initialize upload: no upload_id returned'
        );
      }

      return uploadId;
    } catch (error) {
      this.handleApiError(error, 'initialize upload', tenantId);
    }
  }

  /**
   * Upload video chunk
   * POST /video/upload/
   */
  private async uploadChunk(
    tenantId: string,
    uploadId: string,
    chunkIndex: number,
    totalChunks: number,
    videoData: Buffer,
    fileName: string
  ): Promise<void> {
    const token = this.tenantTokens.get(tenantId) || { access_token: this.config.accessToken };

    const formData = new FormData();
    formData.append('video', videoData, {
      filename: fileName,
      contentType: 'video/mp4',
    });

    try {
      await axios.post(
        `${TIKTOK_API_BASE}/video/upload/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
            ...formData.getHeaders(),
          },
          params: {
            upload_id: uploadId,
            chunk_index: chunkIndex,
            total_chunk: totalChunks,
          },
        }
      );
    } catch (error) {
      this.handleApiError(error, 'upload video chunk', tenantId);
    }
  }

  /**
   * Publish uploaded video
   * POST /video/publish/
   */
  private async publishVideo(
    tenantId: string,
    uploadId: string,
    postData: VideoPostRequest
  ): Promise<string> {
    const token = this.tenantTokens.get(tenantId) || { access_token: this.config.accessToken };

    const publishData: Record<string, unknown> = {
      upload_id: uploadId,
      post_info: {
        title: postData.title.substring(0, 2200), // TikTok title limit
        description: (postData.description || '').substring(0, 2200),
        privacy_level: postData.privacy_level || 'PUBLIC',
        allow_comment: postData.allow_comment !== false,
        allow_duet: postData.allow_duet !== false,
        allow_stitch: postData.allow_stitch !== false,
      },
    };

    if (postData.duet_original_video_id) {
      publishData.duet_original_video_id = postData.duet_original_video_id;
    }

    if (postData.stitch_original_video_id) {
      publishData.stitch_original_video_id = postData.stitch_original_video_id;
    }

    try {
      const response = await axios.post(
        `${TIKTOK_API_BASE}/video/publish/`,
        publishData,
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const videoId = response.data?.data?.video_id;
      if (!videoId) {
        throw new TikTokApiException(
          TikTokErrorCode.PUBLISH_FAILED,
          'Failed to publish video: no video_id returned'
        );
      }

      return videoId;
    } catch (error) {
      this.handleApiError(error, 'publish video', tenantId);
    }
  }

  /**
   * Upload and post a video file
   */
  async uploadVideo(
    tenantId: string,
    videoData: Buffer,
    fileName: string,
    postData: VideoPostRequest
  ): Promise<Video> {
    logger.info('Starting video upload', { tenantId, fileName, size: videoData.length });

    // Initialize upload
    const uploadId = await this.initializeUpload(tenantId, videoData.length);

    // Upload in chunks (for simplicity, single chunk for small files)
    await this.uploadChunk(tenantId, uploadId, 0, 1, videoData, fileName);

    // Publish
    const videoId = await this.publishVideo(tenantId, uploadId, postData);

    logger.info('Video uploaded successfully', { videoId, tenantId });

    return {
      id: videoId,
      create_time: Date.now() / 1000,
      share_url: `https://www.tiktok.com/@user/video/${videoId}`,
      title: postData.title,
      description: postData.description,
      is_ad_video: postData.is_ads_video,
    };
  }

  /**
   * Post video from URL (pull upload)
   * POST /video/publish/
   */
  async postVideo(tenantId: string, postData: VideoPostRequest): Promise<Video> {
    return this.withRetry(async () => {
      const token = this.tenantTokens.get(tenantId) || { access_token: this.config.accessToken };

      const publishData: Record<string, unknown> = {
        source_info: {
          source: 'PULL_UPLOAD',
          video_url: postData.video_url,
        },
        post_info: {
          title: postData.title.substring(0, 2200),
          description: (postData.description || '').substring(0, 2200),
          privacy_level: postData.privacy_level || 'PUBLIC',
          allow_comment: postData.allow_comment !== false,
          allow_duet: postData.allow_duet !== false,
          allow_stitch: postData.allow_stitch !== false,
        },
      };

      if (postData.duet_original_video_id) {
        publishData.duet_original_video_id = postData.duet_original_video_id;
      }

      if (postData.stitch_original_video_id) {
        publishData.stitch_original_video_id = postData.stitch_original_video_id;
      }

      try {
        const response = await axios.post(
          `${TIKTOK_API_BASE}/video/publish/`,
          publishData,
          {
            headers: {
              Authorization: `Bearer ${token.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const videoId = response.data?.data?.video_id;

        logger.info('Video posted successfully', { videoId, tenantId });

        return {
          id: videoId,
          create_time: Date.now() / 1000,
          share_url: `https://www.tiktok.com/@user/video/${videoId}`,
          title: postData.title,
          description: postData.description,
        };
      } catch (error) {
        this.handleApiError(error, 'post video', tenantId);
      }
    }, 'Post video', tenantId);
  }

  /**
   * Get video info
   * GET /video/info/
   */
  async getVideo(tenantId: string, videoId: string): Promise<Video> {
    return this.withRetry(async () => {
      const client = this.getClient(tenantId);

      try {
        const response = await client.get('/video/info/', {
          params: {
            video_id: videoId,
            fields: 'id,cover_image_url,title,description,duration,height,width,create_time,share_url,statistics,is_ad_video',
          },
        });

        if (response.data?.data?.video) {
          return response.data.data.video;
        }

        throw new TikTokApiException(
          TikTokErrorCode.VIDEO_NOT_FOUND,
          'Video not found'
        );
      } catch (error) {
        this.handleApiError(error, 'get video', tenantId);
      }
    }, 'Get video', tenantId);
  }

  /**
   * Get user's videos
   * GET /video/list/
   */
  async getUserVideos(
    tenantId: string,
    options?: {
      maxCount?: number;
      cursor?: string;
    }
  ): Promise<{ videos: Video[]; cursor?: string; hasMore: boolean }> {
    return this.withRetry(async () => {
      const client = this.getClient(tenantId);

      try {
        const response = await client.get('/video/list/', {
          params: {
            max_count: options?.maxCount || 20,
            cursor: options?.cursor,
            fields: 'id,cover_image_url,title,description,duration,create_time,share_url,statistics',
          },
        });

        const data = response.data?.data || {};

        return {
          videos: data.videos || [],
          cursor: data.cursor,
          hasMore: data.has_more || false,
        };
      } catch (error) {
        this.handleApiError(error, 'get user videos', tenantId);
      }
    }, 'Get user videos', tenantId);
  }

  /**
   * Delete video
   * POST /video/delete/
   */
  async deleteVideo(tenantId: string, videoId: string): Promise<boolean> {
    return this.withRetry(async () => {
      const client = this.getClient(tenantId);

      try {
        await client.post('/video/delete/', {
          video_ids: [videoId],
        });

        logger.info('Video deleted', { videoId, tenantId });
        return true;
      } catch (error) {
        this.handleApiError(error, 'delete video', tenantId);
      }
    }, 'Delete video', tenantId);
  }

  // ==========================================
  // Comment Methods
  // ==========================================

  /**
   * Get video comments
   * GET /comment/list/
   */
  async getComments(
    tenantId: string,
    videoId: string,
    options?: {
      maxCount?: number;
      cursor?: string;
    }
  ): Promise<{ comments: Comment[]; cursor?: string; hasMore: boolean }> {
    return this.withRetry(async () => {
      const client = this.getClient(tenantId);

      try {
        const response = await client.get('/comment/list/', {
          params: {
            video_id: videoId,
            max_count: options?.maxCount || 20,
            cursor: options?.cursor,
          },
        });

        const data = response.data?.data || {};

        return {
          comments: data.comments || [],
          cursor: data.cursor,
          hasMore: data.has_more || false,
        };
      } catch (error) {
        this.handleApiError(error, 'get comments', tenantId);
      }
    }, 'Get comments', tenantId);
  }

  /**
   * Post a comment
   * POST /comment/create/
   */
  async postComment(tenantId: string, videoId: string, text: string): Promise<Comment> {
    return this.withRetry(async () => {
      const client = this.getClient(tenantId);

      try {
        const response = await client.post('/comment/create/', {
          video_id: videoId,
          comment_text: text,
        });

        if (response.data?.data?.comment) {
          return response.data.data.comment;
        }

        throw new TikTokApiException(
          TikTokErrorCode.UNKNOWN,
          'Failed to create comment'
        );
      } catch (error) {
        this.handleApiError(error, 'post comment', tenantId);
      }
    }, 'Post comment', tenantId);
  }

  /**
   * Reply to a comment
   * POST /comment/reply/
   */
  async replyToComment(
    tenantId: string,
    videoId: string,
    commentId: string,
    text: string
  ): Promise<Comment> {
    return this.withRetry(async () => {
      const client = this.getClient(tenantId);

      try {
        const response = await client.post('/comment/reply/', {
          video_id: videoId,
          comment_id: commentId,
          comment_text: text,
        });

        if (response.data?.data?.comment) {
          return response.data.data.comment;
        }

        throw new TikTokApiException(
          TikTokErrorCode.UNKNOWN,
          'Failed to reply to comment'
        );
      } catch (error) {
        this.handleApiError(error, 'reply to comment', tenantId);
      }
    }, 'Reply to comment', tenantId);
  }

  /**
   * Like a comment
   * POST /comment/like/
   */
  async likeComment(tenantId: string, commentId: string): Promise<boolean> {
    return this.withRetry(async () => {
      const client = this.getClient(tenantId);

      try {
        await client.post('/comment/like/', {
          comment_id: commentId,
        });

        logger.info('Comment liked', { commentId, tenantId });
        return true;
      } catch (error) {
        this.handleApiError(error, 'like comment', tenantId);
      }
    }, 'Like comment', tenantId);
  }

  // ==========================================
  // Analytics Methods
  // ==========================================

  /**
   * Get video analytics
   * GET /video/stats/
   */
  async getVideoAnalytics(tenantId: string, videoId: string): Promise<VideoAnalytics> {
    return this.withRetry(async () => {
      const client = this.getClient(tenantId);

      try {
        const response = await client.get('/video/stats/', {
          params: { video_id: videoId },
        });

        const data = response.data?.data?.video_stats || {};

        return {
          video_id: videoId,
          views: data.view_count || 0,
          likes: data.like_count || 0,
          comments: data.comment_count || 0,
          shares: data.share_count || 0,
          downloads: data.download_count || 0,
          plays: data.play_count || 0,
        };
      } catch (error) {
        // Fall back to basic video stats if analytics not available
        logger.warn('Analytics API failed, falling back to basic stats', { videoId });
        const video = await this.getVideo(tenantId, videoId);
        return {
          video_id: videoId,
          views: video.statistics?.play_count || 0,
          likes: video.statistics?.digg_count || 0,
          comments: video.statistics?.comment_count || 0,
          shares: video.statistics?.share_count || 0,
          downloads: video.statistics?.download_count || 0,
          plays: video.statistics?.play_count || 0,
        };
      }
    }, 'Get video analytics', tenantId);
  }

  /**
   * Get profile analytics
   * GET /user/stats/
   */
  async getProfileAnalytics(tenantId: string): Promise<ProfileAnalytics> {
    return this.withRetry(async () => {
      const client = this.getClient(tenantId);

      try {
        const response = await client.get('/user/stats/');

        const data = response.data?.data?.user_stats || {};

        return {
          followers: data.follower_count || 0,
          following: data.following_count || 0,
          likes: data.likes_count || 0,
          video_count: data.video_count || 0,
          total_views: data.total_video_views || 0,
          new_followers: data.new_followers_count || 0,
          lost_followers: data.lost_followers_count || 0,
          net_followers: (data.new_followers_count || 0) - (data.lost_followers_count || 0),
          profile_views: data.profile_view_count || 0,
          video_views: data.video_views || 0,
        };
      } catch (error) {
        // Fall back to user info if stats not available
        logger.warn('Stats API failed, falling back to user info', { tenantId });
        const user = await this.getUserInfo(tenantId);
        return {
          followers: user.follower_count || 0,
          following: user.following_count || 0,
          likes: user.likes_count || 0,
          video_count: user.video_count || 0,
          total_views: 0,
        };
      }
    }, 'Get profile analytics', tenantId);
  }

  // ==========================================
  // Scheduled Post Methods
  // ==========================================

  /**
   * Schedule a post for later publishing
   */
  schedulePost(
    tenantId: string,
    postData: VideoPostRequest
  ): ScheduledPost {
    if (!postData.scheduled_time) {
      throw new TikTokApiException(
        TikTokErrorCode.UNKNOWN,
        'scheduled_time is required for scheduled posts'
      );
    }

    const scheduledAt = new Date(postData.scheduled_time);

    // Validate scheduled time is in the future
    if (scheduledAt.getTime() <= Date.now()) {
      throw new TikTokApiException(
        TikTokErrorCode.UNKNOWN,
        'Scheduled time must be in the future'
      );
    }

    const schedule: ScheduledPost = {
      id: uuidv4(),
      tenantId,
      videoUrl: postData.video_url,
      videoData: postData.video_data,
      coverImageUrl: postData.cover_image_url,
      title: postData.title,
      description: postData.description,
      scheduledAt,
      status: 'scheduled',
      privacyLevel: postData.privacy_level,
      allowComment: postData.allow_comment,
      allowDuet: postData.allow_duet,
      allowStitch: postData.allow_stitch,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.scheduledPosts.set(schedule.id, schedule);
    this.persistScheduledPost(schedule);

    // Set timeout to execute the post
    const delay = scheduledAt.getTime() - Date.now();
    const timer = setTimeout(async () => {
      await this.executeScheduledPost(schedule.id);
    }, delay);

    this.scheduledTimers.set(schedule.id, timer);

    logger.info('Post scheduled', {
      scheduleId: schedule.id,
      tenantId,
      scheduledAt: scheduledAt.toISOString(),
    });

    return schedule;
  }

  /**
   * Execute a scheduled post
   */
  private async executeScheduledPost(scheduleId: string): Promise<void> {
    const schedule = this.scheduledPosts.get(scheduleId);
    if (!schedule || schedule.status !== 'scheduled') {
      return;
    }

    // Clean up timer reference
    this.scheduledTimers.delete(scheduleId);

    logger.info('Executing scheduled post', { scheduleId, tenantId: schedule.tenantId });

    try {
      const postData: VideoPostRequest = {
        video_url: schedule.videoUrl,
        video_data: schedule.videoData,
        title: schedule.title,
        description: schedule.description,
        privacy_level: schedule.privacyLevel as VideoPostRequest['privacy_level'],
        allow_comment: schedule.allowComment,
        allow_duet: schedule.allowDuet,
        allow_stitch: schedule.allowStitch,
      };

      let video: Video;

      if (schedule.videoData) {
        const videoBuffer = Buffer.from(schedule.videoData, 'base64');
        video = await this.uploadVideo(schedule.tenantId, videoBuffer, 'scheduled_video.mp4', postData);
      } else if (schedule.videoUrl) {
        video = await this.postVideo(schedule.tenantId, postData);
      } else {
        throw new Error('No video URL or data available for scheduled post');
      }

      schedule.status = 'posted';
      schedule.tiktokVideoId = video.id;
      schedule.updatedAt = new Date();
      this.scheduledPosts.set(scheduleId, schedule);
      this.persistScheduledPost(schedule);

      logger.info('Scheduled post published successfully', {
        scheduleId,
        videoId: video.id,
        tenantId: schedule.tenantId,
      });
    } catch (error) {
      schedule.status = 'failed';
      schedule.errorMessage = (error as Error).message;
      schedule.updatedAt = new Date();
      this.scheduledPosts.set(scheduleId, schedule);
      this.persistScheduledPost(schedule);

      logger.error('Scheduled post failed', {
        scheduleId,
        error: (error as Error).message,
        tenantId: schedule.tenantId,
      });
    }
  }

  /**
   * Get scheduled posts for a tenant
   */
  getScheduledPosts(tenantId: string): ScheduledPost[] {
    return Array.from(this.scheduledPosts.values())
      .filter(post => post.tenantId === tenantId)
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }

  /**
   * Get a specific scheduled post
   */
  getScheduledPost(tenantId: string, scheduleId: string): ScheduledPost | null {
    const schedule = this.scheduledPosts.get(scheduleId);
    if (!schedule || schedule.tenantId !== tenantId) {
      return null;
    }
    return schedule;
  }

  /**
   * Cancel a scheduled post
   */
  cancelScheduledPost(tenantId: string, scheduleId: string): boolean {
    const schedule = this.scheduledPosts.get(scheduleId);
    if (!schedule || schedule.tenantId !== tenantId) {
      return false;
    }

    // Clear the timer if it exists
    const timer = this.scheduledTimers.get(scheduleId);
    if (timer) {
      clearTimeout(timer);
      this.scheduledTimers.delete(scheduleId);
    }

    schedule.status = 'cancelled';
    schedule.updatedAt = new Date();
    this.scheduledPosts.set(scheduleId, schedule);
    this.persistScheduledPost(schedule);

    logger.info('Scheduled post cancelled', { scheduleId, tenantId });
    return true;
  }

  /**
   * Persist scheduled post to storage (file-based for this implementation)
   */
  private persistScheduledPost(post: ScheduledPost): void {
    try {
      const fs = require('fs');
      const path = require('path');
      const storageDir = path.join(process.cwd(), 'data');

      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      const filePath = path.join(storageDir, 'scheduled_posts.json');
      const posts = this.loadScheduledPostsFromDisk();
      posts[post.id] = post;
      fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));
    } catch (error) {
      logger.error('Failed to persist scheduled post', { postId: post.id, error });
    }
  }

  /**
   * Load scheduled posts from disk
   */
  private loadScheduledPostsFromDisk(): Record<string, ScheduledPost> {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'data', 'scheduled_posts.json');

      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error('Failed to load scheduled posts from disk', { error });
    }
    return {};
  }

  /**
   * Restore scheduled posts from disk on startup
   */
  private restoreScheduledPosts(): void {
    try {
      const posts = this.loadScheduledPostsFromDisk();

      for (const [id, post] of Object.entries(posts)) {
        // Re-hydrate Date objects
        post.scheduledAt = new Date(post.scheduledAt);
        post.createdAt = new Date(post.createdAt);
        post.updatedAt = new Date(post.updatedAt);

        // Only restore if still scheduled
        if (post.status === 'scheduled') {
          this.scheduledPosts.set(id, post);

          // Reschedule if in the future
          const delay = post.scheduledAt.getTime() - Date.now();
          if (delay > 0) {
            const timer = setTimeout(async () => {
              await this.executeScheduledPost(id);
            }, delay);
            this.scheduledTimers.set(id, timer);
          } else {
            // Execute immediately if past due
            this.executeScheduledPost(id);
          }
        }
      }

      logger.info('Restored scheduled posts', { count: this.scheduledPosts.size });
    } catch (error) {
      logger.error('Failed to restore scheduled posts', { error });
    }
  }

  // ==========================================
  // Tenant Management
  // ==========================================

  /**
   * Disconnect tenant and clean up
   */
  disconnectTenant(tenantId: string): void {
    // Cancel all scheduled posts
    const scheduledPosts = this.getScheduledPosts(tenantId);
    for (const post of scheduledPosts) {
      if (post.status === 'scheduled') {
        this.cancelScheduledPost(tenantId, post.id);
      }
    }

    // Remove token
    this.tenantTokens.delete(tenantId);

    logger.info('Tenant disconnected', { tenantId });
  }

  /**
   * Check if tenant is connected
   */
  isConnected(tenantId: string): boolean {
    return this.tenantTokens.has(tenantId) || !!this.config.accessToken;
  }

  /**
   * Get connection info for a tenant
   */
  getConnectionInfo(tenantId: string): {
    connected: boolean;
    hasToken: boolean;
    openId?: string;
    expiresIn?: number;
  } {
    const token = this.tenantTokens.get(tenantId);
    return {
      connected: this.isConnected(tenantId),
      hasToken: !!token,
      openId: token?.open_id,
      expiresIn: token?.expires_in,
    };
  }
}

export default new TikTokService();
