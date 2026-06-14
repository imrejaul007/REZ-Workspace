import { z } from 'zod';

// YouTube Video Upload Schema
export const VideoUploadSchema = z.object({
  youtubeChannelId: z.string().min(1, 'Channel ID is required'),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be under 100 characters'),
  description: z.string().max(5000, 'Description must be under 5000 characters').optional(),
  tags: z.array(z.string()).max(500, 'Maximum 500 tags allowed').optional(),
  categoryId: z.string().optional(),
  privacyStatus: z.enum(['public', 'unlisted', 'private']).default('private'),
});

// Video Update Schema
export const VideoUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string()).max(500).optional(),
  categoryId: z.string().optional(),
  privacyStatus: z.enum(['public', 'unlisted', 'private']).optional(),
});

// Channel Connect Schema
export const ChannelConnectSchema = z.object({
  youtubeChannelId: z.string().min(1, 'Channel ID is required'),
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().optional(),
});

// Playlist Create Schema
export const PlaylistCreateSchema = z.object({
  youtubeChannelId: z.string().min(1, 'Channel ID is required'),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be under 100 characters'),
  description: z.string().max(5000, 'Description must be under 5000 characters').optional(),
  privacyStatus: z.enum(['public', 'unlisted', 'private']).default('private'),
});

// Comment Moderation Schema
export const CommentModerationSchema = z.object({
  commentId: z.string().min(1, 'Comment ID is required'),
  action: z.enum(['approve', 'reject', 'flag'], {
    errorMap: () => ({ message: 'Action must be approve, reject, or flag' }),
  }),
  note: z.string().max(500).optional(),
});

// Batch Comment Moderation Schema
export const BatchCommentModerationSchema = z.object({
  commentIds: z.array(z.string()).min(1, 'At least one comment ID is required'),
  action: z.enum(['approve', 'reject', 'flag'], {
    errorMap: () => ({ message: 'Action must be approve, reject, or flag' }),
  }),
  note: z.string().max(500).optional(),
});

// Live Stream Create Schema
export const LiveStreamCreateSchema = z.object({
  youtubeChannelId: z.string().min(1, 'Channel ID is required'),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be under 100 characters'),
  description: z.string().max(5000, 'Description must be under 5000 characters').optional(),
  scheduledStartTime: z.string().datetime().optional(),
  privacyStatus: z.enum(['public', 'unlisted', 'private']).default('public'),
});

// Pagination Schema
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Helper function to format duration from ISO 8601
export const formatDuration = (isoDuration: string): string => {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Helper function to format view count
export const formatViewCount = (count: number): string => {
  if (count >= 1_000_000_000) {
    return `${(count / 1_000_000_000).toFixed(1)}B`;
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
};

// Helper function to format subscriber count
export const formatSubscriberCount = formatViewCount;

// Helper function to parse ISO 8601 duration to seconds
export const parseDurationToSeconds = (isoDuration: string): number => {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
};

// Helper function to generate YouTube-compatible slug
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
};
