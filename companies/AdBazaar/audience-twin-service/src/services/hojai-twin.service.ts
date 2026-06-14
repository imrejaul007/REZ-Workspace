import axios, { AxiosInstance } from 'axios';
import config from '../config';
import logger from '../config/logger';
import { HojaiTwinUser, ChannelPreference } from '../types';

interface HojaiTwinResponse {
  success: boolean;
  twin?: {
    twinId: string;
    userId: string;
    profile: {
      demographics: {
        age: number;
        gender: string;
        location: string;
      };
      interests: string[];
      behaviors: {
        sessions: number;
        purchases: number;
        avgOrderValue: number;
      };
    };
    preferences: {
      channels: string[];
      bestTimes: string[];
    };
    riskFactors: {
      churnRisk: number;
      engagementScore: number;
    };
  };
  error?: string;
}

interface HojaiTwinSearchRequest {
  criteria: {
    interests?: string[];
    ageRange?: { min: number; max: number };
    location?: string;
    purchaseHistory?: {
      minOrders?: number;
      maxOrders?: number;
      minValue?: number;
      maxValue?: number;
    };
    engagementLevel?: 'high' | 'medium' | 'low';
    brandAffinities?: Record<string, number>;
  };
  limit?: number;
}

interface HojaiTwinSearchResponse {
  success: boolean;
  users?: HojaiTwinUser[];
  total?: number;
  error?: string;
}

class HojaiTwinService {
  private client: AxiosInstance;
  private cache: Map<string, { data: unknown; expiry: number }> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: config.hojaiTwin.url,
      timeout: config.hojaiTwin.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.hojaiTwin.apiKey,
      },
    });
  }

  private async getCached<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: unknown, ttl: number = config.cache.ttl): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl * 1000,
    });
  }

  async getUserTwin(userId: string): Promise<HojaiTwinUser | null> {
    const cacheKey = `user:${userId}`;
    const cached = await this.getCached<HojaiTwinUser>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      logger.info(`Fetching twin for user: ${userId}`);
      const response = await this.client.get<HojaiTwinResponse>(`/api/twin/${userId}`);

      if (response.data.success && response.data.twin) {
        const twin = response.data.twin;
        const user: HojaiTwinUser = {
          userId: twin.userId,
          profile: twin.profile,
          preferences: {
            channels: twin.preferences.channels as ChannelPreference[],
            bestTimes: twin.preferences.bestTimes,
          },
          riskFactors: twin.riskFactors,
        };
        this.setCache(cacheKey, user);
        return user;
      }

      return null;
    } catch (error) {
      logger.error(`Failed to fetch twin for user ${userId}:`, error);
      return null;
    }
  }

  async searchUsersByCriteria(criteria: HojaiTwinSearchRequest['criteria'], limit: number = 1000): Promise<HojaiTwinUser[]> {
    const cacheKey = `search:${JSON.stringify({ criteria, limit })}`;
    const cached = await this.getCached<HojaiTwinUser[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      logger.info('Searching users by criteria:', criteria);
      const response = await this.client.post<HojaiTwinSearchResponse>('/api/twin/search', {
        criteria,
        limit,
      });

      if (response.data.success && response.data.users) {
        this.setCache(cacheKey, response.data.users);
        return response.data.users;
      }

      return [];
    } catch (error) {
      logger.error('Failed to search users by criteria:', error);
      return [];
    }
  }

  async getAudienceInsights(userIds: string[]): Promise<{
    avgLifetimeValue: number;
    avgIntentLikelihood: number;
    topInterests: string[];
    channelPreferences: Record<ChannelPreference, number>;
    avgChurnRisk: number;
    avgEngagementScore: number;
  } | null> {
    try {
      logger.info(`Getting audience insights for ${userIds.length} users`);
      const response = await this.client.post<{
        success: boolean;
        insights?: {
          avgLifetimeValue: number;
          avgIntentLikelihood: number;
          topInterests: string[];
          channelPreferences: Record<ChannelPreference, number>;
          avgChurnRisk: number;
          avgEngagementScore: number;
        };
        error?: string;
      }>('/api/twin/audience/insights', { userIds });

      if (response.data.success && response.data.insights) {
        return response.data.insights;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get audience insights:', error);
      return null;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export const hojaiTwinService = new HojaiTwinService();
export default HojaiTwinService;