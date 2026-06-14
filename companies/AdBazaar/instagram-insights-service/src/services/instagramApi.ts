import axios, { AxiosInstance, AxiosError } from 'axios';
import { getInstagramConfig } from '../config/app';
import { createChildLogger } from '../config/logger';
import { ApiError } from '../middleware/errorHandler';

const logger = createChildLogger('instagram-api');

// Instagram API response types
export interface InstagramApiResponse<T> {
  data: T;
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
    previous?: string;
  };
  error?: {
    message: string;
    type: string;
    code: number;
    fbtrace_id: string;
  };
}

export interface InstagramMedia {
  id: string;
  caption: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  username: string;
  children?: {
    data: { id: string; media_url: string; media_type: string }[];
  };
}

export interface InstagramInsights {
  reach: number;
  impressions: number;
  profile_views: number;
  website_cta_clicks: number;
  email_contacts: number;
  get_directions_clicks: number;
  follower_count: number;
}

export interface InstagramMediaInsights {
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  saved: number;
  shares: number;
  views?: number;
  watch_time?: number;
  average_watch_time?: number;
  engagement: number;
  taps_forward: number;
  taps_back: number;
  exits: number;
  replies: number;
}

export interface InstagramStoryInsights {
  impressions: number;
  reach: number;
  replies: number;
  exits: number;
  taps_forward: number;
  taps_back: number;
  story_creation_time: string;
  story_expiry_time: string;
}

export interface InstagramReelsInsights {
  plays: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
  avg_watch_time: number;
  watch_time: number;
}

export interface InstagramAudienceInsights {
  online_followers: {
    day_parts: { [key: string]: number };
    countries: { [key: string]: number };
    cities: { [key: string]: number };
    age: { [key: string]: number };
    gender: { male: number; female: number };
  };
  followers: {
    age: { [key: string]: number };
    gender: { male: number; female: number };
    country: { [key: string]: number };
    city: { [key: string]: number };
  };
}

export interface InstagramFollowerInsights {
  data: {
    name: string;
    period: string;
    values: { value: number; end_time: string }[];
  }[];
}

export class InstagramApiService {
  private client: AxiosInstance;
  private config: ReturnType<typeof getInstagramConfig>;
  private accessToken: string;

  constructor() {
    this.config = getInstagramConfig();
    this.accessToken = this.config.accessToken;

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      params: {
        access_token: this.accessToken,
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('Instagram API request', {
          method: config.method?.toUpperCase(),
          url: config.url,
        });
        return config;
      },
      (error) => {
        logger.error('Instagram API request error', { error });
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Instagram API response', {
          url: response.config.url,
          status: response.status,
        });
        return response;
      },
      (error: AxiosError) => {
        this.handleApiError(error);
      }
    );
  }

  private handleApiError(error: AxiosError): never {
    if (error.response) {
      const responseData = error.response.data as InstagramApiResponse<unknown>;
      const errorMessage = responseData?.error?.message || 'Instagram API error';

      logger.error('Instagram API error', {
        status: error.response.status,
        error: errorMessage,
        code: responseData?.error?.code,
      });

      throw ApiError.instagramApiError(errorMessage, {
        instagramErrorCode: responseData?.error?.code,
        instagramErrorType: responseData?.error?.type,
        fbtraceId: responseData?.error?.fbtrace_id,
      });
    }

    if (error.request) {
      logger.error('Instagram API no response', { error: error.message });
      throw ApiError.serviceUnavailable('Instagram API is not responding');
    }

    logger.error('Instagram API request setup error', { error: error.message });
    throw ApiError.internal('Failed to connect to Instagram API');
  }

  private async get<T>(endpoint: string, params: Record<string, unknown> = {}): Promise<T> {
    const response = await this.client.get<InstagramApiResponse<T>>(endpoint, { params });
    return response.data.data;
  }

  private async post<T>(endpoint: string, data: Record<string, unknown> = {}): Promise<T> {
    const response = await this.client.post<InstagramApiResponse<T>>(endpoint, data);
    return response.data.data;
  }

  // Account Insights
  async getAccountInsights(
    period: 'day' | 'week' | 'days_28' = 'days_28'
  ): Promise<InstagramInsights> {
    const metrics = [
      'reach',
      'impressions',
      'profile_views',
      'website_cta_clicks',
      'email_contacts',
      'get_directions_clicks',
      'follower_count',
    ].join(',');

    return this.get<InstagramInsights>(
      `/${this.config.apiVersion}/${this.config.businessAccountId}/insights`,
      { metric: metrics, period }
    );
  }

  async getFollowerInsights(
    period: 'day' | 'week' | 'days_28' = 'days_28'
  ): Promise<InstagramFollowerInsights> {
    const metrics = ['follower_count'].join(',');

    return this.get<InstagramFollowerInsights>(
      `/${this.config.apiVersion}/${this.config.businessAccountId}/insights`,
      { metric: metrics, period }
    );
  }

  async getAudienceInsights(): Promise<InstagramAudienceInsights> {
    return this.get<InstagramAudienceInsights>(
      `/${this.config.apiVersion}/${this.config.businessAccountId}/insights`,
      { metric: 'audience_demographics' }
    );
  }

  async getOnlineFollowers(): Promise<InstagramAudienceInsights['online_followers']> {
    return this.get<InstagramAudienceInsights['online_followers']>(
      `/${this.config.apiVersion}/${this.config.businessAccountId}/insights`,
      { metric: 'online_followers' }
    );
  }

  // Media endpoints
  async getMedia(limit: number = 25): Promise<InstagramMedia[]> {
    return this.get<InstagramMedia[]>(
      `/${this.config.apiVersion}/${this.config.businessAccountId}/media`,
      { limit }
    );
  }

  async getMediaById(mediaId: string): Promise<InstagramMedia> {
    return this.get<InstagramMedia>(
      `/${this.config.apiVersion}/${mediaId}`
    );
  }

  async getMediaInsights(mediaId: string): Promise<InstagramMediaInsights> {
    return this.get<InstagramMediaInsights>(
      `/${this.config.apiVersion}/${mediaId}/insights`,
      { metric: 'reach,impressions,likes,comments,saved,shares,views,watch_time,average_watch_time,engagement,taps_forward,taps_back,exits,replies' }
    );
  }

  // Story endpoints
  async getStories(limit: number = 25): Promise<InstagramMedia[]> {
    return this.get<InstagramMedia[]>(
      `/${this.config.apiVersion}/${this.config.businessAccountId}/stories`,
      { limit }
    );
  }

  async getStoryInsights(storyId: string): Promise<InstagramStoryInsights> {
    return this.get<InstagramStoryInsights>(
      `/${this.config.apiVersion}/${storyId}/insights`
    );
  }

  // Reels endpoints
  async getReels(limit: number = 50): Promise<InstagramMedia[]> {
    return this.get<InstagramMedia[]>(
      `/${this.config.apiVersion}/${this.config.businessAccountId}/media`,
      { limit, media_type: 'VIDEO' }
    );
  }

  async getReelsInsights(reelsId: string): Promise<InstagramReelsInsights> {
    return this.get<InstagramReelsInsights>(
      `/${this.config.apiVersion}/${reelsId}/insights`,
      { metric: 'plays,reach,likes,comments,shares,saves,views,avg_watch_time,watch_time' }
    );
  }

  // Hashtag insights
  async getHashtagInsights(hashtag: string): Promise<{
    hashtag_id: string;
    name: string;
    media_count: number;
  }> {
    // First, search for the hashtag
    const hashtagSearch = await this.get<{ id: string; name: string }[]>(
      `/${this.config.apiVersion}/${this.config.businessAccountId}/ig_hashtags`,
      { q: hashtag }
    );

    if (!hashtagSearch || hashtagSearch.length === 0) {
      throw ApiError.notFound(`Hashtag #${hashtag} not found`);
    }

    const hashtagData = hashtagSearch[0];

    // Get hashtag insights
    return this.get<{
      hashtag_id: string;
      name: string;
      media_count: number;
    }>(
      `/${this.config.apiVersion}/${hashtagData.id}/insights`
    );
  }

  // Content container insights
  async getContentInsights(contentId: string): Promise<InstagramMedia & InstagramMediaInsights> {
    const [media, insights] = await Promise.all([
      this.getMediaById(contentId),
      this.getMediaInsights(contentId).catch(() => ({} as InstagramMediaInsights)),
    ]);

    return { ...media, ...insights };
  }

  // Get account info
  async getAccountInfo(): Promise<{
    id: string;
    name: string;
    username: string;
    biography: string;
    followers_count: number;
    follows_count: number;
    media_count: number;
    profile_picture_url: string;
    website: string;
  }> {
    return this.get(
      `/${this.config.apiVersion}/${this.config.businessAccountId}`
    );
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.getAccountInfo();
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let instagramApiInstance: InstagramApiService | null = null;

export const getInstagramApiService = (): InstagramApiService => {
  if (!instagramApiInstance) {
    instagramApiInstance = new InstagramApiService();
  }
  return instagramApiInstance;
};

export default InstagramApiService;
