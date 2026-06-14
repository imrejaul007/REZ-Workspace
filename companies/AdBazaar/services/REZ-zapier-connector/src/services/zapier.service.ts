import { v4 as uuidv4 } from 'uuid';
import {
  CreatePostInput,
  GetAnalyticsInput,
  SchedulePostInput,
  PostResult,
  AnalyticsResult,
  Integration,
} from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('ZapierService');

// In-memory storage for demo (would call external REZ API in production)
const posts: Map<string, PostResult> = new Map();
const analytics: Map<string, AnalyticsResult[]> = new Map();

export class ZapierService {
  async createPost(tenantId: string, input: CreatePostInput): Promise<PostResult> {
    const post: PostResult = {
      id: uuidv4(),
      title: input.title,
      status: input.scheduledAt ? 'scheduled' : 'draft',
      platform: input.platform,
      createdAt: new Date().toISOString(),
      scheduledAt: input.scheduledAt,
    };

    posts.set(post.id, post);
    logger.info('Post created via Zapier', { postId: post.id, tenantId, platform: input.platform });

    return post;
  }

  async getPost(postId: string): Promise<PostResult | null> {
    return posts.get(postId) || null;
  }

  async getAllPosts(tenantId: string): Promise<PostResult[]> {
    return Array.from(posts.values());
  }

  async schedulePost(input: SchedulePostInput): Promise<PostResult | null> {
    const post = posts.get(input.postId);
    if (!post) {
      return null;
    }

    const updated: PostResult = {
      ...post,
      status: 'scheduled',
      scheduledAt: input.scheduledAt,
    };

    posts.set(post.id, updated);
    logger.info('Post scheduled via Zapier', { postId: post.id, scheduledAt: input.scheduledAt });

    return updated;
  }

  async getAnalytics(input: GetAnalyticsInput): Promise<AnalyticsResult[]> {
    if (input.postId) {
      const postAnalytics = analytics.get(input.postId) || [];
      return postAnalytics.filter(a => {
        const date = new Date(a.date);
        return date >= new Date(input.startDate) && date <= new Date(input.endDate);
      });
    }

    // Return all analytics in date range
    const results: AnalyticsResult[] = [];
    for (const [, analyticsData] of analytics) {
      results.push(...analyticsData.filter(a => {
        const date = new Date(a.date);
        return date >= new Date(input.startDate) && date <= new Date(input.endDate);
      }));
    }

    return results;
  }

  // Record analytics (for testing/demo)
  async recordAnalytics(tenantId: string, data: Partial<AnalyticsResult>): Promise<AnalyticsResult> {
    const result: AnalyticsResult = {
      postId: data.postId || uuidv4(),
      views: data.views || 0,
      engagements: data.engagements || 0,
      clicks: data.clicks || 0,
      shares: data.shares || 0,
      platform: data.platform || 'unknown',
      date: data.date || new Date().toISOString(),
    };

    const existing = analytics.get(result.postId) || [];
    existing.push(result);
    analytics.set(result.postId, existing);

    logger.info('Analytics recorded', { postId: result.postId, tenantId });

    return result;
  }

  // Available actions for Zapier
  getAvailableActions(): { action: string; description: string; inputFields: string[] }[] {
    return [
      {
        action: 'create_post',
        description: 'Create a new social media post',
        inputFields: ['title', 'content', 'platform', 'scheduledAt', 'tags', 'mediaUrls'],
      },
      {
        action: 'get_analytics',
        description: 'Get analytics for posts',
        inputFields: ['postId', 'campaignId', 'startDate', 'endDate'],
      },
      {
        action: 'schedule_post',
        description: 'Schedule a post for publication',
        inputFields: ['postId', 'scheduledAt', 'timezone'],
      },
    ];
  }

  // Available triggers for Zapier
  getAvailableTriggers(): { trigger: string; description: string; sampleData: Record<string, unknown> }[] {
    return [
      {
        trigger: 'post_created',
        description: 'Triggers when a new post is created',
        sampleData: {
          id: uuidv4(),
          title: 'Sample Post',
          status: 'draft',
          platform: 'twitter',
          createdAt: new Date().toISOString(),
        },
      },
      {
        trigger: 'post_published',
        description: 'Triggers when a post is published',
        sampleData: {
          id: uuidv4(),
          title: 'Sample Post',
          status: 'published',
          platform: 'facebook',
          publishedAt: new Date().toISOString(),
        },
      },
      {
        trigger: 'analytics_updated',
        description: 'Triggers when new analytics data is available',
        sampleData: {
          postId: uuidv4(),
          views: 1250,
          engagements: 45,
          clicks: 89,
          shares: 12,
          platform: 'instagram',
        },
      },
    ];
  }
}

export const zapierService = new ZapierService();
