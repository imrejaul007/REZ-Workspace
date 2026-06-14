import { z } from 'zod';

// ============================================
// TikTok API Types based on TikTok Login Kit and Content Posting API
// ============================================

export interface TikTokConfig {
  clientKey: string;
  clientSecret: string;
  accessToken: string;
  callbackUrl: string;
}

export interface TikTokOAuthToken {
  access_token: string;
  refresh_token?: string;
  open_id: string;
  scope: string;
  expires_in: number;
  refresh_expires_in?: number;
  token_type: string;
}

export interface TikTokUser {
  open_id: string;
  union_id?: string;
  nickname?: string;
  avatar_url?: string;
  avatar_url_100?: string;
  avatar_url_200?: string;
  is_verified?: boolean;
  user_name?: string;
  display_name?: string;
  bio_description?: string;
  profile_deep_link?: string;
  video_count?: number;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  digg_count?: number;
  friend_count?: number;
}

export interface VideoPostRequest {
  video_url?: string;
  video_data?: string; // base64 encoded video
  cover_image_url?: string;
  title: string;
  description?: string;
  post_mode?: 'DIRECT_POST' | 'SCHEDULE' | 'DRAFT';
  scheduled_time?: number; // Unix timestamp in milliseconds
  privacy_level?: 'SELF_ONLY' | 'MUTUAL_FOLLOW_FRIENDS' | 'FRIENDS' | 'PUBLIC';
  allow_comment?: boolean;
  allow_duet?: boolean;
  allow_stitch?: boolean;
  duet_original_video_id?: string;
  stitch_original_video_id?: string;
  is_ads_video?: boolean;
  is_user_consent_provided?: 'YES' | 'NO';
}

export interface Video {
  id: string;
  create_time: number;
  share_url: string;
  cover_image_url?: string;
  title?: string;
  description?: string;
  duration?: number;
  height?: number;
  width?: number;
  author?: TikTokUser;
  music_id?: string;
  music_title?: string;
  music_author_name?: string;
  statistics?: {
    play_count: number;
    digg_count: number;
    comment_count: number;
    share_count: number;
    download_count: number;
    forward_count?: number;
    lose_count?: number;
    lose_comment_count?: number;
  };
  labels?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  is_ad_video?: boolean;
  video_description?: string;
}

export interface Comment {
  id: string;
  video_id: string;
  text: string;
  like_count: number;
  reply_count: number;
  create_time: number;
  author: TikTokUser;
  reply_to_comment_id?: string;
  reply_to_user_id?: string;
  child_comments?: Comment[];
  top_replies?: Comment[];
}

export interface ScheduledPost {
  id: string;
  tenantId: string;
  videoUrl?: string;
  videoData?: string;
  coverImageUrl?: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  status: 'scheduled' | 'posted' | 'failed' | 'cancelled';
  tiktokVideoId?: string;
  privacyLevel?: string;
  allowComment?: boolean;
  allowDuet?: boolean;
  allowStitch?: boolean;
  createdAt: Date;
  updatedAt: Date;
  errorMessage?: string;
}

export interface VideoAnalytics {
  video_id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  downloads: number;
  plays: number;
  engagement_rate?: number;
  average_watch_time?: number;
  retention_rate?: number;
  top_countries?: Array<{ country: string; count: number }>;
  demographics?: {
    age_ranges?: Array<{ range: string; percentage: number }>;
    genders?: Array<{ gender: string; percentage: number }>;
    countries?: Array<{ country: string; percentage: number }>;
  };
  traffic_sources?: Array<{ source: string; percentage: number }>;
}

export interface ProfileAnalytics {
  followers: number;
  following: number;
  likes: number;
  video_count: number;
  total_views: number;
  avg_engagement_rate?: number;
  new_followers?: number;
  lost_followers?: number;
  net_followers?: number;
  profile_views?: number;
  video_views?: number;
  digg_count?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// ============================================
// TikTok API Error Types
// ============================================

export enum TikTokErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMITED = 'RATE_LIMITED',
  VIDEO_NOT_FOUND = 'VIDEO_NOT_FOUND',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  SCOPE_INSUFFICIENT = 'SCOPE_INSUFFICIENT',
  CONTENT_POLICY_VIOLATION = 'CONTENT_POLICY_VIOLATION',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  PUBLISH_FAILED = 'PUBLISH_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export interface TikTokApiError {
  code: string;
  message: string;
  http_status?: number;
  api_path?: string;
}

export class TikTokApiException extends Error {
  constructor(
    public code: TikTokErrorCode,
    message: string,
    public apiError?: TikTokApiError
  ) {
    super(message);
    this.name = 'TikTokApiException';
  }
}

// ============================================
// Zod Validation Schemas
// ============================================

// OAuth Token Request
export const SetTokenSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  openId: z.string().optional(),
});

// Video Post Request
export const VideoPostRequestSchema = z.object({
  video_url: z.string().url().optional(),
  video_data: z.string().optional(),
  cover_image_url: z.string().url().optional(),
  title: z.string().min(1, 'Title is required').max(2200, 'Title too long'),
  description: z.string().max(2200, 'Description too long').optional(),
  post_mode: z.enum(['DIRECT_POST', 'SCHEDULE', 'DRAFT']).optional(),
  scheduled_time: z.number().positive().optional(),
  privacy_level: z.enum(['SELF_ONLY', 'MUTUAL_FOLLOW_FRIENDS', 'FRIENDS', 'PUBLIC']).optional(),
  allow_comment: z.boolean().optional(),
  allow_duet: z.boolean().optional(),
  allow_stitch: z.boolean().optional(),
  duet_original_video_id: z.string().optional(),
  stitch_original_video_id: z.string().optional(),
  is_ads_video: z.boolean().optional(),
  is_user_consent_provided: z.enum(['YES', 'NO']).optional(),
}).refine(
  (data) => data.video_url || data.video_data,
  { message: 'Either video_url or video_data (base64) is required' }
);

// Schedule Post Request (simpler schema without video - video must be provided separately)
export const SchedulePostRequestSchema = z.object({
  videoUrl: z.string().url('Invalid video URL').optional(),
  title: z.string().min(1, 'Title is required').max(2200, 'Title too long'),
  description: z.string().max(2200, 'Description too long').optional(),
  scheduled_time: z.number().positive('Scheduled time is required'),
  privacy_level: z.enum(['SELF_ONLY', 'MUTUAL_FOLLOW_FRIENDS', 'FRIENDS', 'PUBLIC']).optional(),
  allow_comment: z.boolean().optional(),
  allow_duet: z.boolean().optional(),
  allow_stitch: z.boolean().optional(),
}).refine(
  (data) => data.videoUrl,
  { message: 'videoUrl is required for scheduled posts' }
);

// Comment Request
export const CommentRequestSchema = z.object({
  text: z.string().min(1, 'Comment text is required').max(2200, 'Comment too long'),
});

// Pagination Query
export const PaginationQuerySchema = z.object({
  maxCount: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
});

// ============================================
// Type exports from Zod schemas
// ============================================

export type SetTokenInput = z.infer<typeof SetTokenSchema>;
export type VideoPostInput = z.infer<typeof VideoPostRequestSchema>;
export type SchedulePostInput = z.infer<typeof SchedulePostRequestSchema>;
export type CommentInput = z.infer<typeof CommentRequestSchema>;
export type PaginationInput = z.infer<typeof PaginationQuerySchema>;

// ============================================
// API Scope Definitions
// ============================================

export enum TikTokScope {
  USER_INFO_BASIC = 'user.info.basic',
  USER_INFO_STATS = 'user.info.stats',
  VIDEO_UPLOAD = 'video.upload',
  VIDEO_PUBLISH = 'video.publish',
  VIDEO_PUBLISH_WHITELIST = 'video.publish.whitelist',
  COMMENT_READ = 'comment.read',
  COMMENT_WRITE = 'comment.write',
  LIKE_LIST = 'like.list',
  FRIENDSHIP_READ = 'friendship.read',
  FRIENDSHIP_WRITE = 'friendship.write',
  STATS_BASIC = 'stats.basic',
  INSIGHTS_VIDEO = 'insights.video',
}

// Available scopes for the integration
export const TIKTOK_SCOPES = [
  TikTokScope.USER_INFO_BASIC,
  TikTokScope.USER_INFO_STATS,
  TikTokScope.VIDEO_UPLOAD,
  TikTokScope.VIDEO_PUBLISH,
  TikTokScope.COMMENT_READ,
  TikTokScope.COMMENT_WRITE,
  TikTokScope.STATS_BASIC,
  TikTokScope.INSIGHTS_VIDEO,
] as const;

export const TIKTOK_SCOPES_STRING = TIKTOK_SCOPES.join(',');
