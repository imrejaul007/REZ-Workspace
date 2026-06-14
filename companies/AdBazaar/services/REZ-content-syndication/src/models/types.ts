import { z } from 'zod';

// Feed validation schema
export const FeedSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  name: z.string().min(1).max(255),
  platform: z.enum(['twitter', 'linkedin', 'facebook', 'instagram', 'mastodon', 'bluesky', 'custom']),
  enabled: z.boolean().default(true),
  schedule: z.string().default('*/15 * * * *'), // Cron expression
  charLimit: z.number().int().min(1).max(5000).default(280),
  template: z.string().default('{{title}}\n\n{{excerpt}}\n\n{{link}}'),
  tags: z.array(z.string()).default([]),
  lastFetchedAt: z.string().datetime().optional(),
  lastError: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type Feed = z.infer<typeof FeedSchema>;

// Content item from RSS feed
export const ContentItemSchema = z.object({
  id: z.string(),
  feedId: z.string(),
  title: z.string(),
  link: z.string(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  pubDate: z.string().datetime().optional(),
  author: z.string().optional(),
  categories: z.array(z.string()).default([]),
  mediaThumbnail: z.string().optional(),
  isPosted: z.boolean().default(false),
  postedAt: z.string().datetime().optional(),
  postUrl: z.string().optional(),
  error: z.string().optional(),
  createdAt: z.string().datetime()
});

export type ContentItem = z.infer<typeof ContentItemSchema>;

// Create feed input
export const CreateFeedInputSchema = z.object({
  url: z.string().url(),
  name: z.string().min(1).max(255),
  platform: z.enum(['twitter', 'linkedin', 'facebook', 'instagram', 'mastodon', 'bluesky', 'custom']),
  schedule: z.string().optional(),
  charLimit: z.number().int().min(1).max(5000).optional(),
  template: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export type CreateFeedInput = z.infer<typeof CreateFeedInputSchema>;

// Update feed input
export const UpdateFeedInputSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  platform: z.enum(['twitter', 'linkedin', 'facebook', 'instagram', 'mastodon', 'bluesky', 'custom']).optional(),
  enabled: z.boolean().optional(),
  schedule: z.string().optional(),
  charLimit: z.number().int().min(1).max(5000).optional(),
  template: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export type UpdateFeedInput = z.infer<typeof UpdateFeedInputSchema>;

// Post to platform payload
export interface PostPayload {
  content: string;
  link?: string;
  mediaUrl?: string;
  tags?: string[];
}

// Syndication result
export interface SyndicationResult {
  success: boolean;
  contentItemId: string;
  postUrl?: string;
  error?: string;
  timestamp: string;
}

// Feed stats
export interface FeedStats {
  feedId: string;
  totalItems: number;
  postedItems: number;
  failedItems: number;
  lastSyncAt: string;
  averageItemsPerDay: number;
}
