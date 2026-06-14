/**
 * Validation schemas for brand-partnership-portal
 */

import { z } from 'zod';

// Brand schemas
export const brandRegisterSchema = z.object({
  name: z.string().min(1).max(200),
  industry: z.string().min(1).max(100),
  website: z.string().url().optional(),
  logo: z.string().url().optional(),
  description: z.string().max(2000).optional(),
  socialLinks: z.object({
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    facebook: z.string().optional()
  }).optional(),
  tier: z.enum(['basic', 'silver', 'gold', 'platinum']).default('basic'),
  userId: z.string().min(1)
});

export const brandUpdateSchema = brandRegisterSchema.partial().omit({ userId: true });

// Campaign schemas
export const campaignCreateSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  goals: z.array(z.string()).optional(),
  budget: z.number().min(0).optional(),
  timeline: z.object({
    startDate: z.string(),
    endDate: z.string()
  }).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).default('draft'),
  deliverables: z.array(z.object({
    type: z.enum(['post', 'story', 'reel', 'video', 'blog', 'other']),
    count: z.number().min(1).optional(),
    description: z.string().optional()
  })).optional(),
  requirements: z.array(z.object({
    type: z.string(),
    value: z.string()
  })).optional()
});

export const campaignUpdateSchema = campaignCreateSchema.partial();
export const campaignMatchSchema = z.object({
  minFollowers: z.number().min(0).optional(),
  maxFollowers: z.number().min(0).optional(),
  categories: z.array(z.string()).optional(),
  minEngagementRate: z.number().min(0).max(100).optional(),
  location: z.string().optional()
});

// Proposal schemas
export const proposalCreateSchema = z.object({
  campaignId: z.string().min(1),
  influencerId: z.string().min(1),
  brandId: z.string().min(1),
  proposedRate: z.number().min(0),
  message: z.string().max(2000).optional()
});

export const proposalUpdateSchema = proposalCreateSchema.partial();
export const proposalActionSchema = z.object({
  reason: z.string().max(500).optional()
});

// Contract schemas
export const contractCreateSchema = z.object({
  proposalId: z.string().min(1),
  terms: z.string().max(10000),
  deliverables: z.array(z.object({
    type: z.string(),
    description: z.string(),
    deadline: z.string().optional()
  })),
  paymentSchedule: z.array(z.object({
    milestone: z.string(),
    amount: z.number().min(0),
    dueDate: z.string().optional()
  })),
  startDate: z.string(),
  endDate: z.string()
});

// Application schemas
export const applicationCreateSchema = z.object({
  campaignId: z.string().min(1),
  influencerId: z.string().min(1),
  message: z.string().max(2000).optional(),
  proposedRate: z.number().min(0)
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Type exports
export type BrandRegister = z.infer<typeof brandRegisterSchema>;
export type BrandUpdate = z.infer<typeof brandUpdateSchema>;
export type CampaignCreate = z.infer<typeof campaignCreateSchema>;
export type CampaignUpdate = z.infer<typeof campaignUpdateSchema>;
export type CampaignMatch = z.infer<typeof campaignMatchSchema>;
export type ProposalCreate = z.infer<typeof proposalCreateSchema>;
export type ProposalUpdate = z.infer<typeof proposalUpdateSchema>;
export type ContractCreate = z.infer<typeof contractCreateSchema>;
export type ApplicationCreate = z.infer<typeof applicationCreateSchema>;
export type Pagination = z.infer<typeof paginationSchema>;