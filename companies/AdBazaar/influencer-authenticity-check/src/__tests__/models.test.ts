/** Influencer Authenticity Check - Models Tests */
import { z } from 'zod';

const profileSchema = z.object({
  profileId: z.string(),
  platform: z.enum(['instagram', 'twitter', 'youtube', 'tiktok']),
  username: z.string(),
  userId: z.string(),
  followers: z.number().min(0),
  following: z.number().min(0),
  postsCount: z.number().min(0),
  avgLikes: z.number().min(0),
  avgComments: z.number().min(0),
  authenticityScore: z.number().min(0).max(1),
  isVerified: z.boolean(),
});

const checkSchema = z.object({
  checkId: z.string(),
  profileId: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
  score: z.number().min(0).max(1),
  flags: z.array(z.string()),
  metrics: z.object({ fakeFollowerRatio: z.number(), suspiciousEngagement: z.boolean(), botScore: z.number() }),
  completedAt: z.date().optional(),
});

describe('InfluencerProfile Model', () => {
  it('should validate correct profile', () => {
    const data = { profileId: 'profile-123', platform: 'instagram', username: 'testuser', userId: '123', followers: 10000, following: 500, postsCount: 100, avgLikes: 500, avgComments: 50, authenticityScore: 0.85, isVerified: true };
    expect(profileSchema.safeParse(data).success).toBe(true);
  });
  it('should reject invalid platform', () => {
    const data = { profileId: 'profile-123', platform: 'invalid', username: 'test', userId: '123', followers: 1000, following: 100, postsCount: 10, avgLikes: 100, avgComments: 10, authenticityScore: 0.5, isVerified: false };
    expect(profileSchema.safeParse(data).success).toBe(false);
  });
  it('should reject score out of range', () => {
    const data = { profileId: 'profile-123', platform: 'instagram', username: 'test', userId: '123', followers: 1000, following: 100, postsCount: 10, avgLikes: 100, avgComments: 10, authenticityScore: 1.5, isVerified: false };
    expect(profileSchema.safeParse(data).success).toBe(false);
  });
});

describe('AuthenticityCheck Model', () => {
  it('should validate correct check', () => {
    const data = { checkId: 'check-123', profileId: 'profile-123', status: 'completed', score: 0.9, flags: [], metrics: { fakeFollowerRatio: 0.05, suspiciousEngagement: false, botScore: 0.1 } };
    expect(checkSchema.safeParse(data).success).toBe(true);
  });
  it('should reject invalid status', () => {
    const data = { checkId: 'check-123', profileId: 'profile-123', status: 'invalid', score: 0.5, flags: [], metrics: { fakeFollowerRatio: 0.1, suspiciousEngagement: false, botScore: 0.2 } };
    expect(checkSchema.safeParse(data).success).toBe(false);
  });
  it('should allow pending status without score', () => {
    const data = { checkId: 'check-123', profileId: 'profile-123', status: 'pending', flags: [], metrics: { fakeFollowerRatio: 0, suspiciousEngagement: false, botScore: 0 } };
    expect(checkSchema.safeParse(data).success).toBe(true);
  });
});

describe('Model Indexes', () => {
  it('should verify InfluencerProfile has required fields', () => {
    const model = require('../models/InfluencerProfile').InfluencerProfile;
    expect(model.schema.obj.profileId).toBeDefined();
    expect(model.schema.obj.platform).toBeDefined();
  });
  it('should verify AuthenticityCheck has required fields', () => {
    const model = require('../models/AuthenticityCheck').AuthenticityCheck;
    expect(model.schema.obj.checkId).toBeDefined();
    expect(model.schema.obj.status).toBeDefined();
  });
});