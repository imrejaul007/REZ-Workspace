import { z } from 'zod';

// ============================================================================
// CONTENT TWIN SCHEMAS
// ============================================================================

export const CreateContentTwinSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  content_type: z.enum(['video', 'audio', 'image', 'text', 'interactive', 'livestream', 'podcast', 'document']),
  attributes: z.object({
    genre: z.array(z.string()).optional(),
    mood: z.array(z.string()).optional(),
    theme: z.array(z.string()).optional(),
    runtime: z.number().optional(),
    release_date: z.string().optional(),
    rating: z.string().optional(),
    language: z.array(z.string()).optional(),
    target_age: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
    production_quality: z.enum(['low', 'medium', 'high', 'premium']).optional(),
    metadata: z.object({
      director: z.string().optional(),
      cast: z.array(z.string()).optional(),
      studio: z.string().optional(),
      distributor: z.string().optional(),
    }).optional(),
  }).optional(),
  relationships: z.object({
    creators: z.array(z.object({
      creator_id: z.string(),
      role: z.string().optional(),
    })).optional(),
    events: z.array(z.object({
      event_id: z.string(),
      context: z.string().optional(),
    })).optional(),
    brands: z.array(z.object({
      brand_id: z.string(),
      integration_type: z.string().optional(),
    })).optional(),
  }).optional(),
});

export const UpdateContentTwinSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  attributes: z.object({
    genre: z.array(z.string()).optional(),
    mood: z.array(z.string()).optional(),
    theme: z.array(z.string()).optional(),
    runtime: z.number().optional(),
    release_date: z.string().optional(),
    rating: z.string().optional(),
    language: z.array(z.string()).optional(),
    target_age: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
    production_quality: z.enum(['low', 'medium', 'high', 'premium']).optional(),
  }).optional(),
});

export const UpdatePerformanceSchema = z.object({
  views: z.number().min(0).optional(),
  unique_viewers: z.number().min(0).optional(),
  avg_watch_time: z.number().min(0).optional(),
  completion_rate: z.number().min(0).max(100).optional(),
  engagement_score: z.number().min(0).max(100).optional(),
  share_count: z.number().min(0).optional(),
  comment_count: z.number().min(0).optional(),
  save_count: z.number().min(0).optional(),
  revenue: z.number().optional(),
  roi: z.number().optional(),
});

export const UpdateAudienceAlignmentSchema = z.object({
  primary_audience: z.array(z.object({
    audience_id: z.string(),
    match_score: z.number(),
    segment_size: z.number().optional(),
  })).optional(),
  secondary_audience: z.array(z.object({
    audience_id: z.string(),
    match_score: z.number(),
  })).optional(),
  demographic_match: z.number().min(0).max(100).optional(),
  intent_match: z.number().min(0).max(100).optional(),
});

export const AddPlacementSchema = z.object({
  venue_id: z.string(),
  screen_id: z.string(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  position: z.string(),
});

export type CreateContentTwinRequest = z.infer<typeof CreateContentTwinSchema>;
export type UpdateContentTwinRequest = z.infer<typeof UpdateContentTwinSchema>;
export type UpdatePerformanceRequest = z.infer<typeof UpdatePerformanceSchema>;
export type UpdateAudienceAlignmentRequest = z.infer<typeof UpdateAudienceAlignmentSchema>;
export type AddPlacementRequest = z.infer<typeof AddPlacementSchema>;
