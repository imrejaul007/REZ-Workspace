/**
 * WhatsApp Campaign Validation Schemas
 */

import { z } from 'zod';

// Template schemas
const templateButtonSchema = z.object({
  text: z.string().min(1).max(25),
  action: z.string().min(1).max(250),
});

const campaignTemplateSchema = z.object({
  type: z.enum(['promotional', 'transactional', 'reengagement', 'welcome']),
  header: z.string().max(60).optional(),
  body: z.string().min(1).max(4096),
  footer: z.string().max(60).optional(),
  buttons: z.array(templateButtonSchema).max(3).optional(),
  mediaUrl: z.string().url().optional(),
});

// Audience schemas
const audienceFiltersSchema = z.object({
  lastPurchaseDays: z.number().int().positive().optional(),
  cartAbandoners: z.boolean().optional(),
  minOrderValue: z.number().positive().optional(),
  lastVisitDays: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
});

const campaignAudienceSchema = z.object({
  type: z.enum(['all_customers', 'segment', 'custom']),
  segmentId: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  filters: audienceFiltersSchema.optional(),
});

// Scheduling schemas
const campaignSchedulingSchema = z.object({
  type: z.enum(['immediate', 'scheduled', 'automated']),
  scheduledTime: z.string().datetime().optional(),
  optimalTimeEnabled: z.boolean().default(false),
});

// Create campaign schema
export const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  merchantId: z.string().min(1),
  template: campaignTemplateSchema,
  audience: campaignAudienceSchema,
  scheduling: campaignSchedulingSchema,
});

// Update campaign schema
export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  template: campaignTemplateSchema.optional(),
  audience: campaignAudienceSchema.optional(),
  scheduling: campaignSchedulingSchema.optional(),
});

// List campaigns query schema
export const listCampaignsQuerySchema = z.object({
  merchantId: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'sending', 'completed', 'paused']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Campaign ID param schema
export const campaignIdParamSchema = z.object({
  id: z.string().min(1),
});

// Webhook payload schema
export const webhookPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          value: z.object({
            messaging_product: z.string(),
            metadata: z.object({
              display_phone_number: z.string(),
              phone_number_id: z.string(),
            }),
            statuses: z
              .array(
                z.object({
                  id: z.string(),
                  recipient_id: z.string(),
                  status: z.string(),
                  timestamp: z.string(),
                })
              )
              .optional(),
          }),
          field: z.string(),
        })
      ),
    })
  ),
});

// Send campaign schema
export const sendCampaignSchema = z.object({
  forceResend: z.boolean().default(false),
});

// Pause/resume campaign schema
export const pauseCampaignSchema = z.object({
  reason: z.string().max(500).optional(),
});