import { z } from 'zod';

// ============================================================================
// AUDIENCE TWIN SCHEMAS
// ============================================================================

export const CreateAudienceTwinSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  segment_type: z.enum(['demographic', 'behavioral', 'contextual', 'intent', 'lookalike']),
  attributes: z.object({
    demographics: z.object({
      age_ranges: z.array(z.string()).optional(),
      gender: z.array(z.string()).optional(),
      income_brackets: z.array(z.string()).optional(),
      education_levels: z.array(z.string()).optional(),
      geographic_focus: z.array(z.object({
        country: z.string(),
        region: z.string().optional(),
        city: z.string().optional(),
      })).optional(),
    }),
    psychographics: z.object({
      interests: z.array(z.string()).optional(),
      values: z.array(z.string()).optional(),
      lifestyle: z.array(z.string()).optional(),
    }).optional(),
    behavioral: z.object({
      purchase_frequency: z.string().optional(),
      brand_loyalty: z.number().min(0).max(100).optional(),
      engagement_level: z.enum(['low', 'medium', 'high', 'super']).optional(),
      media_consumption: z.object({
        social: z.number().optional(),
        streaming: z.number().optional(),
        broadcast: z.number().optional(),
        print: z.number().optional(),
      }).optional(),
    }).optional(),
  }).optional(),
  relationships: z.object({
    venues: z.array(z.object({
      venue_id: z.string(),
      relationship_type: z.string(),
      affinity_score: z.number().optional(),
    })).optional(),
    events: z.array(z.object({
      event_id: z.string(),
      attendance_status: z.string().optional(),
    })).optional(),
    creators: z.array(z.object({
      creator_id: z.string(),
      follow_status: z.string().optional(),
    })).optional(),
  }).optional(),
});

export const UpdateAudienceTwinSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  attributes: z.object({
    demographics: z.object({
      age_ranges: z.array(z.string()).optional(),
      gender: z.array(z.string()).optional(),
      income_brackets: z.array(z.string()).optional(),
      education_levels: z.array(z.string()).optional(),
      geographic_focus: z.array(z.object({
        country: z.string(),
        region: z.string().optional(),
        city: z.string().optional(),
      })).optional(),
    }).optional(),
    psychographics: z.object({
      interests: z.array(z.string()).optional(),
      values: z.array(z.string()).optional(),
      lifestyle: z.array(z.string()).optional(),
    }).optional(),
    behavioral: z.object({
      purchase_frequency: z.string().optional(),
      brand_loyalty: z.number().min(0).max(100).optional(),
      engagement_level: z.enum(['low', 'medium', 'high', 'super']).optional(),
      media_consumption: z.object({
        social: z.number().optional(),
        streaming: z.number().optional(),
        broadcast: z.number().optional(),
        print: z.number().optional(),
      }).optional(),
    }).optional(),
  }).optional(),
});

export const UpdateEngagementSchema = z.object({
  avg_session_duration: z.number().optional(),
  content_interactions: z.number().optional(),
  conversion_rate: z.number().optional(),
  nps: z.number().min(-100).max(100).optional(),
  sentiment: z.object({
    positive: z.number().min(0).max(100).optional(),
    neutral: z.number().min(0).max(100).optional(),
    negative: z.number().min(0).max(100).optional(),
  }).optional(),
});

export const UpdateSizeEstimateSchema = z.object({
  total_reach: z.number().optional(),
  confidence: z.number().min(0).max(100).optional(),
});

export const UpdateRelationshipsSchema = z.object({
  venues: z.array(z.object({
    venue_id: z.string(),
    relationship_type: z.string(),
    affinity_score: z.number().optional(),
  })).optional(),
  events: z.array(z.object({
    event_id: z.string(),
    attendance_status: z.string().optional(),
  })).optional(),
  creators: z.array(z.object({
    creator_id: z.string(),
    follow_status: z.string().optional(),
  })).optional(),
});

export type CreateAudienceTwinRequest = z.infer<typeof CreateAudienceTwinSchema>;
export type UpdateAudienceTwinRequest = z.infer<typeof UpdateAudienceTwinSchema>;
export type UpdateEngagementRequest = z.infer<typeof UpdateEngagementSchema>;
export type UpdateSizeEstimateRequest = z.infer<typeof UpdateSizeEstimateSchema>;
export type UpdateRelationshipsRequest = z.infer<typeof UpdateRelationshipsSchema>;
