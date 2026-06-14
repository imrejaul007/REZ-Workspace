import { z } from 'zod';

/**
 * Validation schemas for Reddit Integration API
 */

// Auth schemas
export const oauthRequestSchema = z.object({
  state: z.string().min(1, 'State is required for OAuth'),
});

export const tokenExchangeSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
});

// Subreddit schemas
export const addSubredditSchema = z.object({
  name: z
    .string()
    .min(1, 'Subreddit name is required')
    .regex(/^[a-zA-Z0-9_]+$/, 'Invalid subreddit name format')
    .transform((val) => val.toLowerCase().replace(/^r\//, '')),
});

export const subredditQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  skip: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
});

// Post schemas
export const createPostSchema = z.object({
  subreddit: z
    .string()
    .min(1, 'Subreddit is required')
    .regex(/^[a-zA-Z0-9_]+$/, 'Invalid subreddit name')
    .transform((val) => val.toLowerCase()),
  title: z.string().min(1, 'Title is required').max(300, 'Title too long'),
  content: z.string().max(40000, 'Content too long').optional(),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  mediaUrls: z.array(z.string().url()).max(20).optional(),
  nsfw: z.boolean().default(false),
  spoiler: z.boolean().default(false),
  flair: z.string().max(100).optional(),
});

export const updatePostSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  content: z.string().max(40000).optional(),
  nsfw: z.boolean().optional(),
  spoiler: z.boolean().optional(),
  flair: z.string().max(100).optional(),
});

export const postQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(25),
  skip: z.coerce.number().min(0).default(0),
  subreddit: z.string().optional(),
  sort: z.enum(['new', 'top', 'hot', 'controversial']).default('new'),
});

// Comment schemas
export const createCommentSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  parentId: z.string().optional(),
  content: z.string().min(1, 'Comment content is required').max(10000, 'Comment too long'),
});

export const commentQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(25),
  skip: z.coerce.number().min(0).default(0),
  sort: z.enum(['new', 'top', 'controversial']).default('new'),
});

// Vote schema
export const voteSchema = z.object({
  targetId: z.string().min(1, 'Target ID is required'),
  direction: z.enum(['up', 'down', 'none'], {
    errorMap: () => ({ message: 'Direction must be: up, down, or none' }),
  }),
});

// Analytics schemas
export const analyticsQuerySchema = z.object({
  subreddit: z.string().optional(),
  days: z.coerce.number().min(1).max(365).default(30),
  limit: z.coerce.number().min(1).max(100).default(10),
});

// Schedule schemas
export const schedulePostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300, 'Title too long'),
  content: z.string().max(40000, 'Content too long').optional(),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  mediaUrls: z.array(z.string().url()).max(20).optional(),
  subreddit: z
    .string()
    .min(1, 'Subreddit is required')
    .regex(/^[a-zA-Z0-9_]+$/, 'Invalid subreddit name')
    .transform((val) => val.toLowerCase()),
  scheduledFor: z
    .string()
    .datetime('Invalid datetime format')
    .refine((date) => new Date(date) > new Date(), 'Scheduled time must be in the future'),
  nsfw: z.boolean().default(false),
  spoiler: z.boolean().default(false),
  flair: z.string().max(100).optional(),
});

export const scheduleQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(25),
  skip: z.coerce.number().min(0).default(0),
  status: z.enum(['pending', 'published', 'failed', 'cancelled']).optional(),
});

// ID parameter schema
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export const nameParamSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

// Export all schemas
export const schemas = {
  oauthRequest: oauthRequestSchema,
  tokenExchange: tokenExchangeSchema,
  addSubreddit: addSubredditSchema,
  subredditQuery: subredditQuerySchema,
  createPost: createPostSchema,
  updatePost: updatePostSchema,
  postQuery: postQuerySchema,
  createComment: createCommentSchema,
  commentQuery: commentQuerySchema,
  vote: voteSchema,
  analyticsQuery: analyticsQuerySchema,
  schedulePost: schedulePostSchema,
  scheduleQuery: scheduleQuerySchema,
  idParam: idParamSchema,
  nameParam: nameParamSchema,
};

export type OAuthRequest = z.infer<typeof oauthRequestSchema>;
export type TokenExchange = z.infer<typeof tokenExchangeSchema>;
export type AddSubreddit = z.infer<typeof addSubredditSchema>;
export type CreatePost = z.infer<typeof createPostSchema>;
export type UpdatePost = z.infer<typeof updatePostSchema>;
export type CreateComment = z.infer<typeof createCommentSchema>;
export type Vote = z.infer<typeof voteSchema>;
export type SchedulePost = z.infer<typeof schedulePostSchema>;