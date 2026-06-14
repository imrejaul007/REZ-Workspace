import { z } from 'zod';

// Search request schema
export const searchHashtagsSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.number().min(1).max(50).optional().default(20),
  category: z.string().optional(),
  includeBanned: z.boolean().optional().default(false),
});

// Suggest hashtags schema
export const suggestHashtagsSchema = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(['post', 'reel', 'story', 'video']).optional().default('post'),
  count: z.number().min(1).max(30).optional().default(15),
  includeNiche: z.boolean().optional().default(true),
});

// Get hashtag details schema
export const getHashtagDetailsSchema = z.object({
  tag: z.string().min(1),
});

// Trending hashtags schema
export const getTrendingHashtagsSchema = z.object({
  category: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  direction: z.enum(['up', 'down', 'stable', 'all']).optional().default('up'),
});

// Create hashtag set schema
export const createHashtagSetSchema = z.object({
  name: z.string().min(1).max(100),
  tags: z.array(z.string().min(1)).min(1).max(30),
  category: z.string().optional(),
  isPublic: z.boolean().optional().default(true),
});

// Check banned hashtags schema
export const checkBannedHashtagsSchema = z.object({
  hashtags: z.array(z.string().min(1)).min(1).max(50),
});

// Analyze content schema
export const analyzeContentSchema = z.object({
  content: z.string().min(1).max(5000),
  title: z.string().optional(),
  imageDescription: z.string().optional(),
  targetAudience: z.string().optional(),
});

// Types
export type SearchHashtagsInput = z.infer<typeof searchHashtagsSchema>;
export type SuggestHashtagsInput = z.infer<typeof suggestHashtagsSchema>;
export type GetHashtagDetailsInput = z.infer<typeof getHashtagDetailsSchema>;
export type GetTrendingHashtagsInput = z.infer<typeof getTrendingHashtagsSchema>;
export type CreateHashtagSetInput = z.infer<typeof createHashtagSetSchema>;
export type CheckBannedHashtagsInput = z.infer<typeof checkBannedHashtagsSchema>;
export type AnalyzeContentInput = z.infer<typeof analyzeContentSchema>;