import { z } from 'zod';

export const CreateEventTwinSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  event_type: z.enum(['concert', 'festival', 'sports', 'theater', 'conference', 'exhibition', 'meeting', 'private', 'virtual', 'hybrid']),
  attributes: z.object({
    category: z.string().optional(),
    genre: z.array(z.string()).optional(),
    age_restriction: z.string().optional(),
    dress_code: z.string().optional(),
    is_private: z.boolean().optional(),
    is_virtual: z.boolean().optional(),
    is_hybrid: z.boolean().optional(),
  }).optional(),
  schedule: z.object({
    start_date_time: z.string().min(1),
    end_date_time: z.string().min(1),
    timezone: z.string().optional(),
    doors_open: z.string().optional(),
    recurrence: z.object({
      pattern: z.string(),
      interval: z.number(),
      end_date: z.string().optional(),
    }).optional(),
  }),
  venue: z.object({
    venue_id: z.string().optional(),
    virtual_platform: z.string().optional(),
    room_name: z.string().optional(),
  }).optional(),
  ticketing: z.object({
    total_capacity: z.number().min(0).optional(),
    pricing: z.array(z.object({
      tier: z.string(),
      price: z.number(),
      currency: z.string().optional(),
      quantity: z.number(),
    })).optional(),
  }).optional(),
  relationships: z.object({
    venues: z.array(z.object({ venue_id: z.string(), location_type: z.string().optional() })).optional(),
    creators: z.array(z.object({ creator_id: z.string(), role: z.string().optional(), is_headliner: z.boolean().optional() })).optional(),
    audiences: z.array(z.object({ audience_id: z.string(), ticket_status: z.string().optional() })).optional(),
  }).optional(),
});

export const UpdateEventTwinSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  attributes: z.object({
    category: z.string().optional(),
    genre: z.array(z.string()).optional(),
    age_restriction: z.string().optional(),
    dress_code: z.string().optional(),
  }).optional(),
  schedule: z.object({
    start_date_time: z.string().optional(),
    end_date_time: z.string().optional(),
    timezone: z.string().optional(),
    doors_open: z.string().optional(),
  }).optional(),
});

export const UpdateTicketingSchema = z.object({
  tickets_sold: z.number().min(0).optional(),
  tickets_reserved: z.number().min(0).optional(),
  tickets_available: z.number().min(0).optional(),
  sales_status: z.enum(['not_started', 'on_sale', 'sold_out', 'cancelled']).optional(),
  pricing: z.array(z.object({
    tier: z.string(),
    price: z.number(),
    currency: z.string().optional(),
    quantity: z.number(),
  })).optional(),
});

export const UpdateAttendanceSchema = z.object({
  actual_attendance: z.number().min(0).optional(),
  virtual_attendees: z.number().min(0).optional(),
  no_show_rate: z.number().min(0).max(100).optional(),
  avg_dwell_time: z.number().min(0).optional(),
  peak_attendance: z.number().min(0).optional(),
});

export const UpdateEngagementSchema = z.object({
  social_mentions: z.number().min(0).optional(),
  sentiment: z.object({
    positive: z.number().min(0).max(100).optional(),
    neutral: z.number().min(0).max(100).optional(),
    negative: z.number().min(0).max(100).optional(),
  }).optional(),
  qr_scans: z.number().min(0).optional(),
  content_views: z.number().min(0).optional(),
  ticket_resales: z.number().min(0).optional(),
});

export type CreateEventTwinRequest = z.infer<typeof CreateEventTwinSchema>;
export type UpdateEventTwinRequest = z.infer<typeof UpdateEventTwinSchema>;
export type UpdateTicketingRequest = z.infer<typeof UpdateTicketingSchema>;
export type UpdateAttendanceRequest = z.infer<typeof UpdateAttendanceSchema>;
export type UpdateEngagementRequest = z.infer<typeof UpdateEngagementSchema>;