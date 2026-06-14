import { z } from 'zod';

// LinkedIn OAuth Token Response Schema
export const LinkedInOAuthTokenSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  refresh_token_expires_in: z.number().optional(),
  scope: z.string(),
  token_type: z.string().optional(),
});

// Post Request Schema
export const PostRequestSchema = z.object({
  lifecycleState: z.enum(['DRAFT', 'PUBLISHED']).optional().default('PUBLISHED'),
  visibility: z.object({
    memberNetworkVisibility: z.enum(['PUBLIC', 'CONNECTIONS']),
  }),
  commentary: z.string().max(3000).optional(),
  distribution: z.object({
    feedDistribution: z.enum(['MAIN_FEED', 'ALL', 'SPOTLIGHT']).optional(),
    targetEntities: z.object({
      seeders: z.array(z.string()).optional(),
      topics: z.array(z.object({
        topic: z.string(),
        name: z.string(),
      })).optional(),
    }).optional(),
    thirdPartyDistributionChannels: z.array(z.string()).optional(),
  }).optional(),
  image: z.object({
    title: z.string().optional(),
    altText: z.string().optional(),
  }).optional(),
  content: z.object({
    contentEntities: z.array(z.object({
      entity: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
    })).optional(),
    description: z.string().optional(),
    title: z.string().optional(),
    clickTrackingUrl: z.string().url().optional(),
    thumbnail: z.string().url().optional(),
  }).optional(),
  articles: z.array(z.object({
    source: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  callToAction: z.object({
    type: z.enum(['CUSTOM', 'SITE_WIDE_CUSTOM_EVENT', 'APPLY', 'LEARN_MORE', 'REGISTER', 'SIGN_UP', 'DOWNLOAD', 'GET_QUOTE', 'REQUEST_TIME', 'ADD_TO_CART', 'START_FREE_TRIAL', 'CONTACT', 'DOWNTIME']),
    customizedCallToActionButton: z.string().optional(),
    customizedCallToActionUrl: z.string().url().optional(),
  }).optional(),
}).refine(
  data => data.commentary || data.content,
  { message: 'Either commentary or content is required' }
);

// Campaign Create Schema
export const CampaignCreateSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(255),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED', 'DRAFT']).optional().default('DRAFT'),
  runSchedule: z.object({
    start: z.number().int().positive(),
    end: z.number().int().positive().optional(),
  }).optional(),
  targeting: z.object({
    locations: z.array(z.object({
      name: z.string(),
      id: z.string(),
    })).optional(),
    industries: z.array(z.object({
      name: z.string(),
      id: z.string(),
    })).optional(),
    jobTitles: z.array(z.object({
      name: z.string(),
      id: z.string(),
    })).optional(),
    companySizes: z.array(z.string()).optional(),
    ageRanges: z.array(z.object({
      name: z.string(),
      id: z.string(),
    })).optional(),
    memberSeniority: z.array(z.object({
      name: z.string(),
      id: z.string(),
    })).optional(),
    fieldOfStudy: z.array(z.object({
      name: z.string(),
      id: z.string(),
    })).optional(),
    fieldsOfStudy: z.array(z.object({
      name: z.string(),
      id: z.string(),
    })).optional(),
    schools: z.array(z.object({
      name: z.string(),
      id: z.string(),
    })).optional(),
    yearsOfExperience: z.array(z.object({
      name: z.string(),
      id: z.string(),
    })).optional(),
    structuredSnippet: z.object({
      header: z.string(),
      values: z.array(z.string()),
    }).optional(),
    skills: z.array(z.object({
      name: z.string(),
      id: z.string(),
    })).optional(),
    companyName: z.array(z.string()).optional(),
    excludedCompanies: z.array(z.object({
      name: z.string(),
      id: z.string(),
    })).optional(),
    excludedJobTitles: z.array(z.object({
      name: z.string(),
      id: z.string(),
    })).optional(),
    excludedTitles: z.array(z.object({
      name: z.string(),
      id: z.string(),
    })).optional(),
  }).optional(),
  dailyBudget: z.object({
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
    currencyCode: z.string().length(3),
  }).optional(),
  totalBudget: z.object({
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
    currencyCode: z.string().length(3),
  }).optional(),
  format: z.enum([
    'SPONSORED_STATUS_UPDATES',
    'SPONSORED_INMAILS',
    'SPONSORED_VIDEO',
    'TEXT_AD',
    'SPONSORED_CONVERSATIONS',
    'DYNAMIC_AD',
    'CAROUSEL_IMAGE_AD',
  ]),
  unitCost: z.object({
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
    currencyCode: z.string().length(3),
  }).optional(),
  costType: z.enum(['CPC', 'CPM', 'oCPM', 'CPE']).optional(),
  optimizationTargetType: z.string().optional(),
  creativeIds: z.array(z.string()).optional(),
  imageIds: z.array(z.string()).optional(),
});

// Creative Create Schema
export const CreativeCreateSchema = z.object({
  campaign: z.string().min(1, 'Campaign ID is required'),
  name: z.string().max(255).optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  leadGenForm: z.string().optional(),
  content: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    callToAction: z.object({
      type: z.string(),
      customizedCallToActionButton: z.string().optional(),
      customizedCallToActionUrl: z.string().url().optional(),
    }).optional(),
    previewUrl: z.string().url().optional(),
    thumbnail: z.object({
      id: z.string(),
      displayUrl: z.string().url(),
    }).optional(),
    additionalContextBanner: z.object({
      id: z.string(),
      displayUrl: z.string().url(),
    }).optional(),
  }).optional(),
  variables: z.record(z.unknown()).optional(),
});

// Lead Gen Form Create Schema
export const LeadGenFormCreateSchema = z.object({
  name: z.string().min(1, 'Form name is required').max(255),
  title: z.string().max(255).optional(),
  description: z.string().max(5000).optional(),
  customGreeting: z.string().max(255).optional(),
  customGreetingFields: z.array(z.string()).optional(),
  privacyPolicyUrl: z.string().url().optional(),
  includeCompanyBranding: z.boolean().optional().default(true),
  fields: z.array(z.object({
    name: z.string().min(1),
    type: z.string(),
    isRequired: z.boolean(),
    label: z.string().optional(),
  })).min(1, 'At least one field is required'),
});

// Analytics Request Schema
export const AnalyticsRequestSchema = z.object({
  campaigns: z.array(z.string()).min(1, 'At least one campaign ID is required'),
  dateRange: z.object({
    start: z.object({
      day: z.number().int().min(1).max(31),
      month: z.number().int().min(1).max(12),
      year: z.number().int().min(2000),
    }),
    end: z.object({
      day: z.number().int().min(1).max(31),
      month: z.number().int().min(1).max(12),
      year: z.number().int().min(2000),
    }),
  }),
  timeGranularity: z.enum(['DAY', 'MONTH', 'SUMMARY']).optional().default('SUMMARY'),
  fields: z.array(z.enum([
    'impressions',
    'clicks',
    'ctr',
    'cpc',
    'cpm',
    'spend',
    'conversions',
    'conversionRate',
    'leads',
    'leadgenFormOpens',
    'leadgenFormCompletions',
    'costPerLeads',
    'videoViews',
    'videoCompletions',
    'engagementRate',
  ])).optional().default(['impressions', 'clicks', 'spend']),
});

// Image Upload Request Schema
export const ImageUploadRequestSchema = z.object({
  organizationId: z.string().optional(),
  fileName: z.string().optional(),
});

// Access Token Request Schema
export const AccessTokenRequestSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().optional(),
});

// Type exports
export type PostRequestInput = z.infer<typeof PostRequestSchema>;
export type CampaignCreateInput = z.infer<typeof CampaignCreateSchema>;
export type CreativeCreateInput = z.infer<typeof CreativeCreateSchema>;
export type LeadGenFormCreateInput = z.infer<typeof LeadGenFormCreateSchema>;
export type AnalyticsRequestInput = z.infer<typeof AnalyticsRequestSchema>;
export type AccessTokenRequestInput = z.infer<typeof AccessTokenRequestSchema>;
