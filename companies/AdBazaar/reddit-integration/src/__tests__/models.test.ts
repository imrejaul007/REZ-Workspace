/** Reddit Integration - Models Tests */
import { z } from 'zod';

const accountSchema = z.object({ accountId: z.string(), username: z.string(), accessToken: z.string(), refreshToken: z.string().optional(), isActive: z.boolean() });
const subredditSchema = z.object({ subredditId: z.string(), name: z.string(), displayName: z.string(), subscribers: z.number().min(0), isTracked: z.boolean() });
const postSchema = z.object({ postId: z.string(), subreddit: z.string(), title: z.string(), content: z.string().optional(), author: z.string(), score: z.number(), url: z.string().url().optional(), createdAt: z.date() });
const scheduledPostSchema = z.object({ scheduleId: z.string(), subreddit: z.string(), title: z.string(), content: z.string().optional(), scheduledTime: z.date(), status: z.enum(['pending', 'posted', 'cancelled', 'failed']) });

describe('RedditAccount Model', () => {
  it('should validate correct account', () => {
    const data = { accountId: 'reddit-123', username: 'testuser', accessToken: 'token', isActive: true };
    expect(accountSchema.safeParse(data).success).toBe(true);
  });
  it('should reject missing username', () => {
    const data = { accountId: 'reddit-123', accessToken: 'token', isActive: true };
    expect(accountSchema.safeParse(data).success).toBe(false);
  });
});

describe('RedditSubreddit Model', () => {
  it('should validate correct subreddit', () => {
    const data = { subredditId: 'sub-123', name: 'marketing', displayName: 'r/marketing', subscribers: 10000, isTracked: true };
    expect(subredditSchema.safeParse(data).success).toBe(true);
  });
  it('should reject negative subscribers', () => {
    const data = { subredditId: 'sub-123', name: 'test', displayName: 'r/test', subscribers: -100, isTracked: true };
    expect(subredditSchema.safeParse(data).success).toBe(false);
  });
});

describe('RedditPost Model', () => {
  it('should validate correct post', () => {
    const data = { postId: 'post-123', subreddit: 'test', title: 'Test Post', author: 'testuser', score: 100, createdAt: new Date() };
    expect(postSchema.safeParse(data).success).toBe(true);
  });
  it('should validate post with URL', () => {
    const data = { postId: 'post-123', subreddit: 'test', title: 'Test', author: 'user', score: 50, url: 'https://reddit.com/r/test/post', createdAt: new Date() };
    expect(postSchema.safeParse(data).success).toBe(true);
  });
});

describe('ScheduledPost Model', () => {
  it('should validate correct scheduled post', () => {
    const data = { scheduleId: 'sched-123', subreddit: 'test', title: 'Test', scheduledTime: new Date(), status: 'pending' };
    expect(scheduledPostSchema.safeParse(data).success).toBe(true);
  });
  it('should reject invalid status', () => {
    const data = { scheduleId: 'sched-123', subreddit: 'test', title: 'Test', scheduledTime: new Date(), status: 'invalid' };
    expect(scheduledPostSchema.safeParse(data).success).toBe(false);
  });
});

describe('Model Indexes', () => {
  it('should verify RedditAccount has required fields', () => {
    const model = require('../models/RedditAccount').RedditAccount;
    expect(model.schema.obj.accountId).toBeDefined();
  });
  it('should verify RedditSubreddit has required fields', () => {
    const model = require('../models/RedditSubreddit').RedditSubreddit;
    expect(model.schema.obj.name).toBeDefined();
  });
});