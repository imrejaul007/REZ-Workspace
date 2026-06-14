import { z } from 'zod';

// Agency schemas
export const agencyCreateSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string().default('India'),
    pincode: z.string()
  }).optional(),
  industry: z.enum(['retail', 'finance', 'healthcare', 'automotive', 'real_estate', 'education', 'technology', 'other']).optional(),
  tier: z.enum(['starter', 'professional', 'enterprise']).default('starter'),
  settings: z.object({
    defaultCurrency: z.string().default('INR'),
    timezone: z.string().default('Asia/Kolkata'),
    dateFormat: z.string().default('DD/MM/YYYY'),
    autoReporting: z.boolean().default(true),
    reportingFrequency: z.enum(['daily', 'weekly', 'monthly']).default('weekly')
  }).optional()
});

export const agencyUpdateSchema = agencyCreateSchema.partial();

// Client schemas
export const clientCreateSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  industry: z.string().optional(),
  contactPerson: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string()
  }).optional(),
  budget: z.object({
    monthly: z.number().positive().default(0),
    total: z.number().positive().default(0),
    currency: z.string().default('INR')
  }).optional(),
  spendingLimit: z.number().positive().optional(),
  notes: z.string().optional()
});

export const clientUpdateSchema = clientCreateSchema.partial();

// Team member schemas
export const teamMemberCreateSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'analyst', 'campaign_manager', 'viewer']),
  permissions: z.array(z.enum([
    'view_agencies', 'edit_agencies',
    'view_clients', 'edit_clients', 'delete_clients',
    'view_campaigns', 'edit_campaigns', 'delete_campaigns',
    'view_analytics', 'export_data',
    'manage_team', 'manage_billing',
    'manage_templates', 'manage_settings'
  ])).default(['view_agencies', 'view_clients', 'view_campaigns']),
  department: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional()
});

export const teamMemberUpdateSchema = teamMemberCreateSchema.partial();

// Campaign template schemas
export const campaignTemplateCreateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  type: z.enum(['awareness', 'consideration', 'conversion', 'retargeting', 'brand']),
  structure: z.object({
    objectives: z.array(z.string()),
    keyMetrics: z.array(z.string()),
    budgetAllocation: z.record(z.string(), z.number()),
    biddingStrategy: z.enum(['cpc', 'cpm', 'cpv', 'cpa', 'auto']),
    targeting: z.object({
      locations: z.array(z.string()).optional(),
      demographics: z.object({
        ageRanges: z.array(z.string()).optional(),
        gender: z.array(z.enum(['male', 'female', 'other'])).optional(),
        incomeBrackets: z.array(z.string()).optional()
      }).optional(),
      interests: z.array(z.string()).optional(),
      behaviors: z.array(z.string()).optional(),
      devices: z.array(z.enum(['desktop', 'mobile', 'tablet', 'all'])).optional(),
      placements: z.array(z.string()).optional()
    }).optional(),
    creatives: z.object({
      adFormats: z.array(z.string()),
      messaging: z.string(),
      ctaButtons: z.array(z.string())
    }).optional(),
    frequency: z.object({
      capping: z.number().optional(),
      pacing: z.enum(['fast', 'uniform', 'accelerated'])
    }).optional()
  }),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false)
});

export const campaignTemplateUpdateSchema = campaignTemplateCreateSchema.partial();

// Dashboard query schema
export const dashboardQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  metrics: z.array(z.string()).optional()
});

// Type exports
export type AgencyCreate = z.infer<typeof agencyCreateSchema>;
export type AgencyUpdate = z.infer<typeof agencyUpdateSchema>;
export type ClientCreate = z.infer<typeof clientCreateSchema>;
export type ClientUpdate = z.infer<typeof clientUpdateSchema>;
export type TeamMemberCreate = z.infer<typeof teamMemberCreateSchema>;
export type TeamMemberUpdate = z.infer<typeof teamMemberUpdateSchema>;
export type CampaignTemplateCreate = z.infer<typeof campaignTemplateCreateSchema>;
export type CampaignTemplateUpdate = z.infer<typeof campaignTemplateUpdateSchema>;
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;