import { z } from 'zod';

// Platform Types
export type Platform = 'twitter' | 'instagram' | 'linkedin' | 'tiktok' | 'facebook' | 'whatsapp';

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'pending_review';

export type ContentType = 'text' | 'image' | 'video' | 'carousel' | 'story' | 'reel' | 'live';

// Time Slot for conflict detection
export interface TimeSlot {
  start: Date;
  end: Date;
}

// Platform Post Interface
export interface PlatformPost {
  id: string;
  platform: Platform;
  externalId?: string;
  content: PostContent;
  scheduledTime: Date;
  status: PostStatus;
  mediaUrls?: string[];
  hashtags?: string[];
  mentions?: string[];
  location?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Unified Post (Calendar View)
export interface UnifiedPost extends PlatformPost {
  userId: string;
  title?: string;
  description?: string;
  isConflict: boolean;
  conflictingPosts?: string[];
  platformSpecificData?: PlatformSpecificData;
}

// Platform-specific preview data
export interface PlatformSpecificData {
  twitter?: {
    characterCount: number;
    hashtagsCount: number;
    mentionsCount: number;
    mediaCount: number;
    previewText: string;
  };
  instagram?: {
    captionLength: number;
    hashtagCount: number;
    mediaCount: number;
    previewText: string;
  };
  linkedin?: {
    characterCount: number;
    previewText: string;
    visibility: 'public' | 'connections' | 'private';
  };
  tiktok?: {
    videoDuration?: number;
    captionLength: number;
    hashtagsCount: number;
  };
  facebook?: {
    characterCount: number;
    previewText: string;
    audience: 'public' | 'friends' | 'private';
  };
  whatsapp?: {
    templateName?: string;
    variables?: Record<string, string>;
  };
}

// Post Content
export interface PostContent {
  text: string;
  media?: MediaItem[];
  link?: string;
  poll?: PollData;
}

// Media Item
export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'gif';
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  width?: number;
  height?: number;
}

// Poll Data
export interface PollData {
  question: string;
  options: string[];
  duration?: number; // in hours
  allowMultipleVotes: boolean;
}

// Calendar Event (for calendar view)
export interface CalendarEvent {
  id: string;
  postId: string;
  title: string;
  start: Date;
  end: Date;
  platform: Platform;
  status: PostStatus;
  isConflict: boolean;
  color: string;
  extendedProps: {
    post: UnifiedPost;
  };
}

// Calendar View Types
export interface CalendarView {
  start: Date;
  end: Date;
  events: CalendarEvent[];
  filters: CalendarFilters;
}

export interface CalendarFilters {
  platforms?: Platform[];
  statuses?: PostStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
  userId?: string;
}

// Conflict Detection
export interface Conflict {
  id: string;
  timeSlot: TimeSlot;
  posts: UnifiedPost[];
  severity: 'high' | 'medium' | 'low';
  message: string;
  resolved: boolean;
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  action: 'reschedule' | 'publish_now' | 'merge' | 'cancel';
  affectedPosts: string[];
  newTimeSlot?: TimeSlot;
  resolvedAt: Date;
  resolvedBy: string;
}

// Platform Configuration
export interface PlatformConfig {
  platform: Platform;
  enabled: boolean;
  baseUrl: string;
  authRequired: boolean;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

// Platform Connector Response
export interface PlatformConnectorResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  platform: Platform;
  timestamp: Date;
}

// Bulk Operations
export interface BulkOperation {
  ids: string[];
  action: 'publish' | 'delete' | 'reschedule' | 'change_status';
  newValues?: {
    scheduledTime?: Date;
    status?: PostStatus;
  };
}

export interface BulkOperationResult {
  operationId: string;
  totalItems: number;
  successfulItems: string[];
  failedItems: Array<{
    id: string;
    error: string;
  }>;
}

// Analytics
export interface CalendarAnalytics {
  totalPosts: number;
  postsByPlatform: Record<Platform, number>;
  postsByStatus: Record<PostStatus, number>;
  conflictCount: number;
  upcomingPosts: number;
  pastPosts: number;
}

// Zod Schemas for Validation
export const PlatformPostSchema = z.object({
  id: z.string().uuid(),
  platform: z.enum(['twitter', 'instagram', 'linkedin', 'tiktok', 'facebook', 'whatsapp']),
  externalId: z.string().optional(),
  content: z.object({
    text: z.string().min(1).max(5000),
    media: z.array(z.object({
      id: z.string(),
      type: z.enum(['image', 'video', 'gif']),
      url: z.string().url(),
      thumbnailUrl: z.string().url().optional(),
      altText: z.string().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    })).optional(),
    link: z.string().url().optional(),
    poll: z.object({
      question: z.string(),
      options: z.array(z.string()).min(2).max(5),
      duration: z.number().optional(),
      allowMultipleVotes: z.boolean(),
    }).optional(),
  }),
  scheduledTime: z.string().datetime(),
  status: z.enum(['draft', 'scheduled', 'published', 'failed', 'pending_review']),
  mediaUrls: z.array(z.string().url()).optional(),
  hashtags: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional(),
  location: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const RescheduleSchema = z.object({
  postId: z.string().uuid(),
  newScheduledTime: z.string().datetime(),
  reason: z.string().optional(),
});

export const BulkOperationSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  action: z.enum(['publish', 'delete', 'reschedule', 'change_status']),
  newValues: z.object({
    scheduledTime: z.string().datetime().optional(),
    status: z.enum(['draft', 'scheduled', 'published', 'failed', 'pending_review']).optional(),
  }).optional(),
});

export const CalendarFiltersSchema = z.object({
  platforms: z.array(z.enum(['twitter', 'instagram', 'linkedin', 'tiktok', 'facebook', 'whatsapp'])).optional(),
  statuses: z.array(z.enum(['draft', 'scheduled', 'published', 'failed', 'pending_review'])).optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
  searchQuery: z.string().optional(),
  userId: z.string().uuid().optional(),
});

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// In-memory store types
export interface CalendarStore {
  posts: Map<string, UnifiedPost>;
  conflicts: Map<string, Conflict>;
  users: Map<string, UserCalendarSettings>;
}

export interface UserCalendarSettings {
  userId: string;
  defaultView: 'month' | 'week' | 'day' | 'agenda';
  timezone: string;
  workingHours: {
    start: string; // HH:mm
    end: string;
  };
  notificationPreferences: {
    conflicts: boolean;
    reminders: boolean;
    failedPosts: boolean;
  };
  platformOrder: Platform[];
}

// Platform Colors for Calendar
export const PLATFORM_COLORS: Record<Platform, string> = {
  twitter: '#1DA1F2',
  instagram: '#E4405F',
  linkedin: '#0A66C2',
  tiktok: '#000000',
  facebook: '#1877F2',
  whatsapp: '#25D366',
};

// Platform Configurations
export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  twitter: {
    platform: 'twitter',
    enabled: true,
    baseUrl: process.env.TWITTER_SERVICE_URL || 'http://localhost:4780',
    authRequired: true,
    rateLimit: { requests: 100, windowMs: 900000 },
  },
  instagram: {
    platform: 'instagram',
    enabled: true,
    baseUrl: process.env.INSTAGRAM_SERVICE_URL || 'http://localhost:4781',
    authRequired: true,
    rateLimit: { requests: 200, windowMs: 3600000 },
  },
  linkedin: {
    platform: 'linkedin',
    enabled: true,
    baseUrl: process.env.LINKEDIN_SERVICE_URL || 'http://localhost:4790',
    authRequired: true,
    rateLimit: { requests: 50, windowMs: 60000 },
  },
  tiktok: {
    platform: 'tiktok',
    enabled: true,
    baseUrl: process.env.TIKTOK_SERVICE_URL || 'http://localhost:4785',
    authRequired: true,
    rateLimit: { requests: 30, windowMs: 60000 },
  },
  facebook: {
    platform: 'facebook',
    enabled: true,
    baseUrl: process.env.FACEBOOK_SERVICE_URL || 'http://localhost:4782',
    authRequired: true,
    rateLimit: { requests: 100, windowMs: 3600000 },
  },
  whatsapp: {
    platform: 'whatsapp',
    enabled: true,
    baseUrl: process.env.WHATSAPP_SERVICE_URL || 'http://localhost:4783',
    authRequired: true,
    rateLimit: { requests: 500, windowMs: 3600000 },
  },
};
