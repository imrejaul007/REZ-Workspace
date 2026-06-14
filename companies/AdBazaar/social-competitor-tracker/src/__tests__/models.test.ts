/** Social Competitor Tracker - Models Tests */
import { z } from 'zod';

const competitorSchema = z.object({
  competitorId: z.string(),
  name: z.string(),
  platforms: z.array(z.enum(['instagram', 'twitter', 'facebook', 'linkedin', 'tiktok'])),
  handle: z.string().optional(),
  followers: z.number().min(0),
  isActive: z.boolean(),
});

const postSchema = z.object({
  postId: z.string(),
  competitorId: z.string(),
  platform: z.string(),
  content: z.string(),
  engagement: z.object({ likes: z.number(), comments: z.number(), shares: z.number() }),
  postedAt: z.date(),
});

const snapshotSchema = z.object({
  snapshotId: z.string(),
  competitorId: z.string(),
  followers: z.number(),
  engagement: z.object({ likes: z.number(), comments: z.number(), shares: z.number() }),
  timestamp: z.date(),
});

describe('Competitor Model', () => {
  it('should validate correct competitor', () => {
    const data = { competitorId: 'comp-123', name: 'Test', platforms: ['instagram'], followers: 10000, isActive: true };
    expect(competitorSchema.safeParse(data).success).toBe(true);
  });
  it('should reject negative followers', () => {
    const data = { competitorId: 'comp-123', name: 'Test', platforms: ['instagram'], followers: -100, isActive: true };
    expect(competitorSchema.safeParse(data).success).toBe(false);
  });
});

describe('CompetitorPost Model', () => {
  it('should validate correct post', () => {
    const data = { postId: 'post-123', competitorId: 'comp-123', platform: 'instagram', content: 'Test', engagement: { likes: 100, comments: 10, shares: 5 }, postedAt: new Date() };
    expect(postSchema.safeParse(data).success).toBe(true);
  });
  it('should reject missing engagement', () => {
    const data = { postId: 'post-123', competitorId: 'comp-123', platform: 'instagram', content: 'Test', postedAt: new Date() };
    expect(postSchema.safeParse(data).success).toBe(false);
  });
});

describe('CompetitorSnapshot Model', () => {
  it('should validate correct snapshot', () => {
    const data = { snapshotId: 'snap-123', competitorId: 'comp-123', followers: 10000, engagement: { likes: 100, comments: 10, shares: 5 }, timestamp: new Date() };
    expect(snapshotSchema.safeParse(data).success).toBe(true);
  });
});

describe('Model Indexes', () => {
  it('should verify Competitor has required fields', () => {
    const model = require('../models/competitor.model').Competitor;
    expect(model.schema.obj.competitorId).toBeDefined();
    expect(model.schema.obj.isActive).toBeDefined();
  });
  it('should verify CompetitorPost has required fields', () => {
    const model = require('../models/competitor-post.model').CompetitorPost;
    expect(model.schema.obj.competitorId).toBeDefined();
    expect(model.schema.obj.platform).toBeDefined();
  });
});