import { z } from 'zod';

// Twitter API v2 request validation schemas

// Create tweet validation
export const createTweetSchema = z.object({
  text: z.string()
    .min(1, 'Tweet text is required')
    .max(280, 'Tweet text cannot exceed 280 characters'),
  reply: z.object({
    in_reply_to_tweet_id: z.string().min(1),
    exclude_reply_user_ids: z.array(z.string()).optional(),
  }).optional(),
  quote_tweet_id: z.string().optional(),
  media: z.object({
    media_ids: z.array(z.string()).max(4, 'Maximum 4 media items allowed'),
    tagged_user_ids: z.array(z.string()).optional(),
  }).optional(),
  poll: z.object({
    duration_minutes: z.number().int().min(5).max(10080), // 5 min to 7 days
    options: z.array(z.string()).min(2).max(4),
  }).optional(),
  direct_message_deep_link: z.string().optional(),
  geo: z.object({
    place_id: z.string(),
  }).optional(),
  super_followers_only: z.boolean().optional(),
  reply_settings: z.enum(['everyone', 'mentioned_users', 'followers']).optional(),
});

// Thread validation
export const createThreadSchema = z.object({
  tweets: z.array(
    z.object({
      text: z.string()
        .min(1, 'Tweet text is required')
        .max(280, 'Tweet text cannot exceed 280 characters'),
      media: z.object({
        media_ids: z.array(z.string()).max(4),
        tagged_user_ids: z.array(z.string()).optional(),
      }).optional(),
    })
  ).min(2, 'Thread must have at least 2 tweets')
    .max(25, 'Thread cannot exceed 25 tweets'),
});

// Schedule tweet validation
export const scheduleTweetSchema = z.object({
  content: z.string()
    .min(1, 'Content is required')
    .max(280, 'Content cannot exceed 280 characters'),
  scheduledAt: z.string().datetime({ message: 'Invalid ISO 8601 datetime' }),
  mediaIds: z.array(z.string()).optional(),
  replyToId: z.string().optional(),
  threadTweets: z.array(z.string()).optional(),
});

// Media upload validation
export const mediaUploadSchema = z.object({
  mediaData: z.instanceof(Buffer).or(z.string()), // Base64 string or Buffer
  mimeType: z.enum([
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm',
  ], { message: 'Invalid media type' }),
  altText: z.string().max(1000).optional(),
});

// Mentions query validation
export const mentionsQuerySchema = z.object({
  maxResults: z.coerce.number().int().min(10).max(100).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  paginationToken: z.string().optional(),
});

// Search query validation
export const searchTweetsQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  maxResults: z.coerce.number().int().min(10).max(100).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  paginationToken: z.string().optional(),
});

// Batch analytics validation
export const batchAnalyticsSchema = z.object({
  tweetIds: z.array(z.string())
    .min(1, 'At least one tweet ID is required')
    .max(100, 'Maximum 100 tweet IDs per request'),
});

// User ID params validation
export const userIdParamsSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
});

// Tweet ID params validation
export const tweetIdParamsSchema = z.object({
  id: z.string().min(1, 'Tweet ID is required'),
});

// Follow user validation
export const followUserSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
});

// Set token validation
export const setTokenSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().optional(),
});

// Type exports
export type CreateTweetInput = z.infer<typeof createTweetSchema>;
export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type ScheduleTweetInput = z.infer<typeof scheduleTweetSchema>;
export type MediaUploadInput = z.infer<typeof mediaUploadSchema>;
export type MentionsQueryInput = z.infer<typeof mentionsQuerySchema>;
export type SearchTweetsQueryInput = z.infer<typeof searchTweetsQuerySchema>;
export type BatchAnalyticsInput = z.infer<typeof batchAnalyticsSchema>;
export type FollowUserInput = z.infer<typeof followUserSchema>;
export type SetTokenInput = z.infer<typeof setTokenSchema>;
