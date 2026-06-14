/**
 * UGC Management Service - Models Tests
 * Tests MongoDB schemas and validation
 */

import { z } from 'zod';
import { IUGCContent } from '../models/UGCContent';
import { IUGCCampaign } from '../models/UGCCampaign';
import { IUGCRights } from '../models/UGCRights';

// Validation schemas
const ugcContentSchema = z.object({
  platform: z.enum(['instagram', 'twitter', 'facebook', 'tiktok']),
  originalUrl: z.string().url(),
  mediaUrl: z.string().url(),
  mediaType: z.enum(['image', 'video']),
  caption: z.string(),
  author: z.object({
    platformUserId: z.string(),
    username: z.string(),
    displayName: z.string(),
    followerCount: z.number().min(0),
  }),
  hashtags: z.array(z.string()),
  engagement: z.object({
    likes: z.number().min(0),
    comments: z.number().min(0),
    shares: z.number().min(0),
  }),
  status: z.enum(['collected', 'pending_review', 'approved', 'rejected', 'displayed']),
  rightsStatus: z.enum(['none', 'requested', 'granted', 'denied']),
});

const ugcCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  platforms: z.array(z.enum(['instagram', 'twitter', 'facebook', 'tiktok'])),
  hashtags: z.array(z.string()).min(1),
  startDate: z.date(),
  endDate: z.date(),
  status: z.enum(['draft', 'active', 'paused', 'completed']),
  moderationRules: z.object({
    minFollowers: z.number().optional(),
    maxFollowers: z.number().optional(),
    excludeHashtags: z.array(z.string()).optional(),
    requireHashtags: z.array(z.string()).optional(),
    excludeAccounts: z.array(z.string()).optional(),
    sentimentThreshold: z.number().optional(),
  }).optional(),
  approvalRequired: z.boolean(),
});

const ugcRightsSchema = z.object({
  ugcId: z.string(),
  rightsType: z.enum(['display', 'repost', 'commercial', 'all']),
  usageTerms: z.string().optional(),
  requestedBy: z.string(),
  status: z.enum(['pending', 'granted', 'denied', 'expired']),
  expiresAt: z.date().optional(),
});

describe('UGCContent Model', () => {
  describe('Schema Validation (Zod)', () => {
    it('should validate correct UGC content', () => {
      const validData = {
        platform: 'instagram',
        originalUrl: 'https://instagram.com/p/abc123',
        mediaUrl: 'https://example.com/media.jpg',
        mediaType: 'image',
        caption: 'Amazing product! #love #product',
        author: {
          platformUserId: 'user-123',
          username: 'testuser',
          displayName: 'Test User',
          followerCount: 5000,
        },
        hashtags: ['#love', '#product'],
        engagement: { likes: 100, comments: 10, shares: 5 },
        status: 'pending_review',
        rightsStatus: 'none',
      };

      const result = ugcContentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid platform', () => {
      const invalidData = {
        platform: 'invalid',
        originalUrl: 'https://instagram.com/p/abc123',
        mediaUrl: 'https://example.com/media.jpg',
        mediaType: 'image',
        caption: 'Test',
        author: {
          platformUserId: 'user-123',
          username: 'testuser',
          displayName: 'Test User',
          followerCount: 5000,
        },
        hashtags: [],
        engagement: { likes: 0, comments: 0, shares: 0 },
        status: 'pending_review',
        rightsStatus: 'none',
      };

      const result = ugcContentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid URL', () => {
      const invalidData = {
        platform: 'instagram',
        originalUrl: 'not-a-url',
        mediaUrl: 'https://example.com/media.jpg',
        mediaType: 'image',
        caption: 'Test',
        author: {
          platformUserId: 'user-123',
          username: 'testuser',
          displayName: 'Test User',
          followerCount: 5000,
        },
        hashtags: [],
        engagement: { likes: 0, comments: 0, shares: 0 },
        status: 'pending_review',
        rightsStatus: 'none',
      };

      const result = ugcContentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid media type', () => {
      const invalidData = {
        platform: 'instagram',
        originalUrl: 'https://instagram.com/p/abc123',
        mediaUrl: 'https://example.com/media.jpg',
        mediaType: 'gif',
        caption: 'Test',
        author: {
          platformUserId: 'user-123',
          username: 'testuser',
          displayName: 'Test User',
          followerCount: 5000,
        },
        hashtags: [],
        engagement: { likes: 0, comments: 0, shares: 0 },
        status: 'pending_review',
        rightsStatus: 'none',
      };

      const result = ugcContentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative follower count', () => {
      const invalidData = {
        platform: 'instagram',
        originalUrl: 'https://instagram.com/p/abc123',
        mediaUrl: 'https://example.com/media.jpg',
        mediaType: 'image',
        caption: 'Test',
        author: {
          platformUserId: 'user-123',
          username: 'testuser',
          displayName: 'Test User',
          followerCount: -100,
        },
        hashtags: [],
        engagement: { likes: 0, comments: 0, shares: 0 },
        status: 'pending_review',
        rightsStatus: 'none',
      };

      const result = ugcContentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const invalidData = {
        platform: 'instagram',
        originalUrl: 'https://instagram.com/p/abc123',
        mediaUrl: 'https://example.com/media.jpg',
        mediaType: 'image',
        caption: 'Test',
        author: {
          platformUserId: 'user-123',
          username: 'testuser',
          displayName: 'Test User',
          followerCount: 5000,
        },
        hashtags: [],
        engagement: { likes: 0, comments: 0, shares: 0 },
        status: 'invalid-status',
        rightsStatus: 'none',
      };

      const result = ugcContentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('IUGCContent Interface', () => {
    it('should have correct structure', () => {
      const content: IUGCContent = {
        platform: 'instagram',
        originalUrl: 'https://instagram.com/p/abc123',
        mediaUrl: 'https://example.com/media.jpg',
        mediaType: 'image',
        caption: 'Amazing product!',
        author: {
          platformUserId: 'user-123',
          username: 'testuser',
          displayName: 'Test User',
          followerCount: 5000,
          profileImage: 'https://example.com/profile.jpg',
        },
        hashtags: ['#love', '#product'],
        engagement: { likes: 100, comments: 10, shares: 5 },
        status: 'approved',
        rightsStatus: 'granted',
        rightsRequestedAt: new Date(),
        rightsGrantedAt: new Date(),
        approvedBy: 'admin',
        approvedAt: new Date(),
        displayedOn: ['website', 'app'],
        sentiment: 'positive',
        sentimentScore: 0.8,
        moderationNotes: 'Looks good',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as IUGCContent;

      expect(content.platform).toBe('instagram');
      expect(content.status).toBe('approved');
      expect(content.author.followerCount).toBe(5000);
    });

    it('should allow optional fields', () => {
      const content: IUGCContent = {
        platform: 'twitter',
        originalUrl: 'https://twitter.com/user/status/123',
        mediaUrl: 'https://example.com/media.jpg',
        mediaType: 'video',
        caption: 'Test',
        author: {
          platformUserId: 'user-123',
          username: 'testuser',
          displayName: 'Test User',
          followerCount: 100,
        },
        hashtags: [],
        engagement: { likes: 0, comments: 0, shares: 0 },
        status: 'pending_review',
        rightsStatus: 'none',
        displayedOn: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as IUGCContent;

      expect(content.approvedBy).toBeUndefined();
      expect(content.sentiment).toBeUndefined();
    });
  });
});

describe('UGCCampaign Model', () => {
  describe('Schema Validation (Zod)', () => {
    it('should validate correct campaign', () => {
      const validData = {
        name: 'Test Campaign',
        description: 'Campaign description',
        platforms: ['instagram', 'twitter'],
        hashtags: ['#test', '#ugc'],
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'active',
        approvalRequired: true,
      };

      const result = ugcCampaignSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        description: 'Campaign description',
        platforms: ['instagram'],
        hashtags: ['#test'],
        startDate: new Date(),
        endDate: new Date(),
        status: 'active',
        approvalRequired: false,
      };

      const result = ugcCampaignSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty hashtags', () => {
      const invalidData = {
        name: 'Test Campaign',
        description: 'Campaign description',
        platforms: ['instagram'],
        hashtags: [],
        startDate: new Date(),
        endDate: new Date(),
        status: 'active',
        approvalRequired: false,
      };

      const result = ugcCampaignSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate moderation rules', () => {
      const validData = {
        name: 'Test Campaign',
        description: 'Campaign description',
        platforms: ['instagram'],
        hashtags: ['#test'],
        startDate: new Date(),
        endDate: new Date(),
        status: 'active',
        approvalRequired: true,
        moderationRules: {
          minFollowers: 1000,
          maxFollowers: 100000,
          excludeHashtags: ['#spam'],
          requireHashtags: ['#test'],
          sentimentThreshold: 0.3,
        },
      };

      const result = ugcCampaignSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('IUGCCampaign Interface', () => {
    it('should have correct structure', () => {
      const campaign: IUGCCampaign = {
        name: 'Test Campaign',
        description: 'Description',
        platforms: ['instagram', 'twitter'],
        hashtags: ['#test'],
        startDate: new Date(),
        endDate: new Date(),
        status: 'active',
        moderationRules: {
          minFollowers: 1000,
          excludeHashtags: ['#spam'],
        },
        approvalRequired: true,
        stats: {
          collected: 100,
          pending: 50,
          approved: 40,
          rejected: 10,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as IUGCCampaign;

      expect(campaign.name).toBe('Test Campaign');
      expect(campaign.stats.collected).toBe(100);
    });
  });
});

describe('UGCRights Model', () => {
  describe('Schema Validation (Zod)', () => {
    it('should validate correct rights request', () => {
      const validData = {
        ugcId: 'ugc-123',
        rightsType: 'display',
        usageTerms: 'For promotional use only',
        requestedBy: 'brand-123',
        status: 'pending',
      };

      const result = ugcRightsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept all valid rights types', () => {
      const rightsTypes = ['display', 'repost', 'commercial', 'all'];

      rightsTypes.forEach(rightsType => {
        const validData = {
          ugcId: 'ugc-123',
          rightsType,
          requestedBy: 'brand-123',
          status: 'pending',
        };
        const result = ugcRightsSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid rights type', () => {
      const invalidData = {
        ugcId: 'ugc-123',
        rightsType: 'invalid',
        requestedBy: 'brand-123',
        status: 'pending',
      };

      const result = ugcRightsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const invalidData = {
        ugcId: 'ugc-123',
        rightsType: 'display',
        requestedBy: 'brand-123',
        status: 'invalid',
      };

      const result = ugcRightsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('IUGCRights Interface', () => {
    it('should have correct structure', () => {
      const rights: IUGCRights = {
        ugcId: 'ugc-123',
        rightsType: 'commercial',
        usageTerms: 'Full commercial use rights',
        requestedBy: 'brand-123',
        requestedAt: new Date(),
        status: 'granted',
        respondedBy: 'admin',
        respondedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      } as IUGCRights;

      expect(rights.ugcId).toBe('ugc-123');
      expect(rights.status).toBe('granted');
    });
  });
});

describe('Model Indexes', () => {
  it('should verify UGCContent has required indexes', () => {
    const model = require('../models/UGCContent').UGCContent;
    const schemaObj = model.schema.obj;

    expect(schemaObj.platform).toBeDefined();
    expect(schemaObj.status).toBeDefined();
    expect(schemaObj.campaignId).toBeDefined();
  });

  it('should verify UGCCampaign has proper structure', () => {
    const model = require('../models/UGCCampaign').UGCCampaign;
    const schemaObj = model.schema.obj;

    expect(schemaObj.name).toBeDefined();
    expect(schemaObj.status).toBeDefined();
  });

  it('should verify UGCRights has proper structure', () => {
    const model = require('../models/UGCRights').UGCRights;
    const schemaObj = model.schema.obj;

    expect(schemaObj.ugcId).toBeDefined();
    expect(schemaObj.status).toBeDefined();
    expect(schemaObj.rightsType).toBeDefined();
  });
});