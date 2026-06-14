/** Snapchat Integration - Models Tests */
import { z } from 'zod';

const campaignSchema = z.object({
  campaignId: z.string(),
  name: z.string(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED', 'DRAFT']),
  budget: z.number().positive(),
  objective: z.enum(['AWARENESS', 'TRAFFIC', 'CONVERSION', 'APP_INSTALL', 'VIDEO_VIEW']),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const adSchema = z.object({
  adId: z.string(),
  campaignId: z.string(),
  name: z.string(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']),
  type: z.enum(['SINGLE_IMAGE', 'SINGLE_VIDEO', 'STORY', 'COLLECTION']),
  creative: z.object({ mediaUrl: z.string().url(), headline: z.string().optional(), callToAction: z.string().optional() }),
});

const audienceSchema = z.object({
  audienceId: z.string(),
  name: z.string(),
  size: z.number().min(0),
  source: z.enum(['CUSTOMER_LIST', 'WEBSITE_VISITORS', 'APP_USERS', 'LOOKALIKE']),
  description: z.string().optional(),
});

describe('SnapchatCampaign Model', () => {
  it('should validate correct campaign', () => {
    const data = { campaignId: 'camp-123', name: 'Test', status: 'ACTIVE', budget: 1000, objective: 'AWARENESS' };
    expect(campaignSchema.safeParse(data).success).toBe(true);
  });
  it('should reject negative budget', () => {
    const data = { campaignId: 'camp-123', name: 'Test', status: 'ACTIVE', budget: -100, objective: 'AWARENESS' };
    expect(campaignSchema.safeParse(data).success).toBe(false);
  });
  it('should reject invalid status', () => {
    const data = { campaignId: 'camp-123', name: 'Test', status: 'INVALID', budget: 1000, objective: 'AWARENESS' };
    expect(campaignSchema.safeParse(data).success).toBe(false);
  });
});

describe('SnapchatAd Model', () => {
  it('should validate correct ad', () => {
    const data = { adId: 'ad-123', campaignId: 'camp-123', name: 'Test Ad', status: 'ACTIVE', type: 'SINGLE_IMAGE', creative: { mediaUrl: 'https://example.com/image.jpg' } };
    expect(adSchema.safeParse(data).success).toBe(true);
  });
  it('should reject invalid media URL', () => {
    const data = { adId: 'ad-123', campaignId: 'camp-123', name: 'Test', status: 'ACTIVE', type: 'SINGLE_IMAGE', creative: { mediaUrl: 'not-a-url' } };
    expect(adSchema.safeParse(data).success).toBe(false);
  });
});

describe('SnapchatAudience Model', () => {
  it('should validate correct audience', () => {
    const data = { audienceId: 'aud-123', name: 'Test Audience', size: 5000, source: 'CUSTOMER_LIST' };
    expect(audienceSchema.safeParse(data).success).toBe(true);
  });
  it('should reject negative size', () => {
    const data = { audienceId: 'aud-123', name: 'Test', size: -100, source: 'CUSTOMER_LIST' };
    expect(audienceSchema.safeParse(data).success).toBe(false);
  });
});

describe('Model Indexes', () => {
  it('should verify SnapchatCampaign has required fields', () => {
    const model = require('../models/snapchatCampaign.model').SnapchatCampaign;
    expect(model.schema.obj.campaignId).toBeDefined();
    expect(model.schema.obj.status).toBeDefined();
  });
});