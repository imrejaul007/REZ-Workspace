import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: string;
  media_url: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  permalink: string;
}

interface InstagramInsights {
  impressions: number;
  reach: number;
  profile_views: number;
  website_clicks: number;
  email_clicks: number;
  follower_count: number;
  following_count: number;
  media_count: number;
}

interface InstagramFollowerSource {
  hashtag: number;
  explore: number;
  profile: number;
  suggested: number;
  other: number;
}

interface InstagramUser {
  id: string;
  username: string;
  name: string;
  profile_picture_url: string;
  biography: string;
  website: string;
  followers_count: number;
  following_count: number;
  media_count: number;
  is_business: boolean;
}

export class InstagramService {
  private accessToken: string;
  private businessAccountId: string;
  private apiUrl: string;

  constructor() {
    this.accessToken = config.instagram.accessToken;
    this.businessAccountId = config.instagram.businessAccountId;
    this.apiUrl = config.instagram.apiUrl;
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    try {
      const response = await axios.get(`${this.apiUrl}${endpoint}`, {
        params: { access_token: this.accessToken },
      });
      return response.data;
    } catch (error) {
      logger.error('Instagram API request failed', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async getUserProfile(): Promise<InstagramUser> {
    const endpoint = `/${this.businessAccountId}`;
    return this.makeRequest<InstagramUser>(endpoint);
  }

  async getMedia(limit: number = 25): Promise<{ data: InstagramMedia[] }> {
    const endpoint = `/${this.businessAccountId}/media`;
    return this.makeRequest<{ data: InstagramMedia[] }>(
      `${endpoint}?fields=id,caption,media_type,media_url,timestamp,like_count,comments_count,permalink&limit=${limit}`
    );
  }

  async getInsights(days: number = 7): Promise<InstagramInsights> {
    const endpoint = `/${this.businessAccountId}/insights`;
    const since = Math.floor(Date.now() / 1000) - days * 86400;
    const until = Math.floor(Date.now() / 1000);

    const data = await this.makeRequest<{
      data: Array<{ name: string; values: Array<{ value: number }> }>;
    }>(
      `${endpoint}?metric=impressions,reach,profile_views,website_clicks,email_clicks,follower_count,following_count,media_count&period=day&since=${since}&until=${until}`
    );

    const insights: InstagramInsights = {
      impressions: 0,
      reach: 0,
      profile_views: 0,
      website_clicks: 0,
      email_clicks: 0,
      follower_count: 0,
      following_count: 0,
      media_count: 0,
    };

    for (const metric of data.data) {
      const latestValue =
        metric.values.length > 0
          ? metric.values[metric.values.length - 1].value
          : 0;

      switch (metric.name) {
        case 'impressions':
          insights.impressions = latestValue;
          break;
        case 'reach':
          insights.reach = latestValue;
          break;
        case 'profile_views':
          insights.profile_views = latestValue;
          break;
        case 'website_clicks':
          insights.website_clicks = latestValue;
          break;
        case 'email_clicks':
          insights.email_clicks = latestValue;
          break;
        case 'follower_count':
          insights.follower_count = latestValue;
          break;
        case 'following_count':
          insights.following_count = latestValue;
          break;
        case 'media_count':
          insights.media_count = latestValue;
          break;
      }
    }

    return insights;
  }

  async getFollowerInsights(days: number = 30): Promise<{
    follower_demographics: {
      countries: Array<{ country: string; percentage: number }>;
      gender: Array<{ gender: string; percentage: number }>;
      age_ranges: Array<{ age_range: string; percentage: number }>;
    };
    follower_source: InstagramFollowerSource;
  }> {
    const endpoint = `/${this.businessAccountId}/insights`;
    const since = Math.floor(Date.now() / 1000) - days * 86400;
    const until = Math.floor(Date.now() / 1000);

    try {
      const data = await this.makeRequest<{
        data: Array<{ name: string; values: Array<{ value: number | object }> }>;
      }>(
        `${endpoint}?metric=follower_demographics,follower_source&period=month&since=${since}&until=${until}`
      );

      const result = {
        follower_demographics: {
          countries: [],
          gender: [],
          age_ranges: [],
        },
        follower_source: {
          hashtag: 0,
          explore: 0,
          profile: 0,
          suggested: 0,
          other: 0,
        },
      };

      for (const metric of data.data) {
        if (metric.name === 'follower_demographics' && metric.values.length > 0) {
          const value = metric.values[0].value as {
            countries?: Array<{ key: string; value: number }>;
            gender?: Array<{ key: string; value: number }>;
            age_ranges?: Array<{ key: string; value: number }>;
          };

          if (value.countries) {
            const total = value.countries.reduce((sum, c) => sum + c.value, 0);
            result.follower_demographics.countries = value.countries.map((c) => ({
              country: c.key,
              percentage: total > 0 ? (c.value / total) * 100 : 0,
            }));
          }

          if (value.gender) {
            const total = value.gender.reduce((sum, g) => sum + g.value, 0);
            result.follower_demographics.gender = value.gender.map((g) => ({
              gender: g.key,
              percentage: total > 0 ? (g.value / total) * 100 : 0,
            }));
          }

          if (value.age_ranges) {
            const total = value.age_ranges.reduce((sum, a) => sum + a.value, 0);
            result.follower_demographics.age_ranges = value.age_ranges.map((a) => ({
              age_range: a.key,
              percentage: total > 0 ? (a.value / total) * 100 : 0,
            }));
          }
        }

        if (metric.name === 'follower_source' && metric.values.length > 0) {
          const value = metric.values[0].value as {
            hashtag?: number;
            explore?: number;
            profile?: number;
            suggested?: number;
            other?: number;
          };

          result.follower_source = {
            hashtag: value.hashtag || 0,
            explore: value.explore || 0,
            profile: value.profile || 0,
            suggested: value.suggested || 0,
            other: value.other || 0,
          };
        }
      }

      return result;
    } catch (error) {
      logger.warn('Follower insights not available, returning defaults', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        follower_demographics: {
          countries: [],
          gender: [],
          age_ranges: [],
        },
        follower_source: {
          hashtag: 0,
          explore: 0,
          profile: 0,
          suggested: 0,
          other: 0,
        },
      };
    }
  }

  async getAudienceInsights(): Promise<{
    online_followers: Array<{ hour: number; percentage: number }>;
  }> {
    const endpoint = `/${this.businessAccountId}/insights`;
    const days = 7;
    const since = Math.floor(Date.now() / 1000) - days * 86400;
    const until = Math.floor(Date.now() / 1000);

    try {
      const data = await this.makeRequest<{
        data: Array<{ name: string; values: Array<{ value: Array<{ hour: number }> }> }>;
      }>(
        `${endpoint}?metric=online_followers&period=hour&since=${since}&until=${until}`
      );

      const result: { online_followers: Array<{ hour: number; percentage: number }> } = {
        online_followers: [],
      };

      for (const metric of data.data) {
        if (metric.name === 'online_followers' && metric.values.length > 0) {
          const hourlyData = metric.values[0].value as Array<{ hour: number }>;
          const total = hourlyData.length;
          result.online_followers = hourlyData.map((h) => ({
            hour: h.hour,
            percentage: total > 0 ? (1 / total) * 100 : 0,
          }));
        }
      }

      return result;
    } catch (error) {
      logger.warn('Audience insights not available');
      return { online_followers: [] };
    }
  }

  async getRecentMedia(limit: number = 10): Promise<InstagramMedia[]> {
    const response = await this.getMedia(limit);
    return response.data;
  }

  calculateEngagementRate(media: InstagramMedia[]): number {
    if (media.length === 0) return 0;

    const totalEngagement = media.reduce((sum, m) => {
      return sum + m.like_count + m.comments_count;
    }, 0);

    const avgEngagement = totalEngagement / media.length;
    const profileData = this.getUserProfileSync();

    if (profileData.followers === 0) return 0;

    return (avgEngagement / profileData.followers) * 100;
  }

  private cachedProfile: InstagramUser | null = null;

  private getUserProfileSync(): { followers: number } {
    return {
      followers: this.cachedProfile?.followers_count || 0,
    };
  }

  async syncUserProfile(): Promise<void> {
    try {
      this.cachedProfile = await this.getUserProfile();
    } catch (error) {
      logger.error('Failed to sync user profile', { error });
    }
  }
}

export const instagramService = new InstagramService();