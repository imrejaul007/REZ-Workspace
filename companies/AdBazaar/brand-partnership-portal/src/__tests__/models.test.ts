/** Brand Partnership Portal - Models Tests */
import { z } from 'zod';

const brandSchema = z.object({
  brandId: z.string(),
  name: z.string().min(1),
  industry: z.string(),
  website: z.string().url().optional(),
  budget: z.number().positive().optional(),
  status: z.enum(['active', 'inactive', 'pending']),
});

const campaignSchema = z.object({
  campaignId: z.string(),
  brandId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']),
  budget: z.number().positive(),
  startDate: z.date(),
  endDate: z.date(),
  deliverables: z.array(z.object({ type: z.string(), quantity: z.number(), rate: z.number() })),
});

const proposalSchema = z.object({
  proposalId: z.string(),
  campaignId: z.string(),
  influencerId: z.string(),
  status: z.enum(['pending', 'accepted', 'rejected', 'withdrawn']),
  amount: z.number().positive(),
  proposedDeliverables: z.array(z.object({ type: z.string(), quantity: z.number() })),
});

const applicationSchema = z.object({
  applicationId: z.string(),
  campaignId: z.string(),
  influencerId: z.string(),
  status: z.enum(['submitted', 'under_review', 'shortlisted', 'rejected', 'selected']),
  coverLetter: z.string().optional(),
});

describe('Brand Model', () => {
  it('should validate correct brand', () => {
    const data = { brandId: 'brand-123', name: 'Test Brand', industry: 'fashion', website: 'https://test.com', budget: 50000, status: 'active' };
    expect(brandSchema.safeParse(data).success).toBe(true);
  });
  it('should reject empty name', () => {
    const data = { brandId: 'brand-123', name: '', industry: 'tech' };
    expect(brandSchema.safeParse(data).success).toBe(false);
  });
  it('should reject negative budget', () => {
    const data = { brandId: 'brand-123', name: 'Test', industry: 'tech', budget: -100 };
    expect(brandSchema.safeParse(data).success).toBe(false);
  });
});

describe('Campaign Model', () => {
  it('should validate correct campaign', () => {
    const data = { campaignId: 'camp-123', brandId: 'brand-123', name: 'Test Campaign', status: 'draft', budget: 10000, startDate: new Date(), endDate: new Date(), deliverables: [] };
    expect(campaignSchema.safeParse(data).success).toBe(true);
  });
  it('should reject invalid status', () => {
    const data = { campaignId: 'camp-123', brandId: 'brand-123', name: 'Test', status: 'invalid', budget: 1000, startDate: new Date(), endDate: new Date(), deliverables: [] };
    expect(campaignSchema.safeParse(data).success).toBe(false);
  });
  it('should validate deliverables', () => {
    const data = { campaignId: 'camp-123', brandId: 'brand-123', name: 'Test', status: 'draft', budget: 5000, startDate: new Date(), endDate: new Date(), deliverables: [{ type: 'instagram_post', quantity: 5, rate: 500 }] };
    expect(campaignSchema.safeParse(data).success).toBe(true);
  });
});

describe('Proposal Model', () => {
  it('should validate correct proposal', () => {
    const data = { proposalId: 'prop-123', campaignId: 'camp-123', influencerId: 'inf-123', status: 'pending', amount: 5000, proposedDeliverables: [] };
    expect(proposalSchema.safeParse(data).success).toBe(true);
  });
  it('should reject negative amount', () => {
    const data = { proposalId: 'prop-123', campaignId: 'camp-123', influencerId: 'inf-123', status: 'pending', amount: -100, proposedDeliverables: [] };
    expect(proposalSchema.safeParse(data).success).toBe(false);
  });
});

describe('Application Model', () => {
  it('should validate correct application', () => {
    const data = { applicationId: 'app-123', campaignId: 'camp-123', influencerId: 'inf-123', status: 'submitted', coverLetter: 'I am interested in this campaign' };
    expect(applicationSchema.safeParse(data).success).toBe(true);
  });
  it('should reject invalid status', () => {
    const data = { applicationId: 'app-123', campaignId: 'camp-123', influencerId: 'inf-123', status: 'invalid' };
    expect(applicationSchema.safeParse(data).success).toBe(false);
  });
});

describe('Model Indexes', () => {
  it('should verify Brand has required fields', () => {
    const model = require('../models/brand.model').Brand;
    expect(model.schema.obj.brandId).toBeDefined();
    expect(model.schema.obj.status).toBeDefined();
  });
  it('should verify Campaign has required fields', () => {
    const model = require('../models/campaign.model').Campaign;
    expect(model.schema.obj.campaignId).toBeDefined();
    expect(model.schema.obj.status).toBeDefined();
  });
});