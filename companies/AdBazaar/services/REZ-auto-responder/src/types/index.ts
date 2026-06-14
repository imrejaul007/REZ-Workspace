import { z } from 'zod';

// Enums
export enum ResponseChannel {
  COMMENT = 'comment',
  DIRECT_MESSAGE = 'dm',
  BOTH = 'both'
}

export enum ResponsePlatform {
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  TIKTOK = 'tiktok'
}

export enum TriggerType {
  KEYWORD = 'keyword',
  HASHTAG = 'hashtag',
  MENTION = 'mention',
  NEW_FOLLOWER = 'new_follower',
  POST_ENGAGEMENT = 'post_engagement',
  TIME_DELAY = 'time_delay',
  SCHEDULE = 'schedule'
}

export enum TriggerMatchType {
  EXACT = 'exact',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  REGEX = 'regex'
}

export enum AutoResponseStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived'
}

// Zod Schemas
export const KeywordTriggerSchema = z.object({
  id: z.string().uuid(),
  keyword: z.string().min(1).max(200),
  matchType: z.nativeEnum(TriggerMatchType).default(TriggerMatchType.CONTAINS),
  caseSensitive: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

export const AutoReplyTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  channel: z.nativeEnum(ResponseChannel),
  platforms: z.array(z.nativeEnum(ResponsePlatform)).default([]),
  triggers: z.array(KeywordTriggerSchema).default([]),
  hashtags: z.array(z.string().max(100)).default([]),
  responseText: z.string().min(1).max(2000),
  responseMedia: z.array(z.string().url()).default([]),
  useAiResponse: z.boolean().default(false),
  aiPrompt: z.string().max(500).optional(),
  delayMinutes: z.number().int().min(0).max(1440).default(0),
  priority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  responseLimit: z.number().int().min(0).optional(), // 0 = unlimited
  responsesToday: z.number().int().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const AutoResponseLogSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid(),
  triggerMatch: z.object({
    type: z.string(),
    value: z.string()
  }),
  sourceMessage: z.object({
    id: z.string(),
    platform: z.nativeEnum(ResponsePlatform),
    authorHandle: z.string(),
    content: z.string()
  }),
  responseSent: z.object({
    content: z.string(),
    mediaUrls: z.array(z.string()).default([]),
    channel: z.nativeEnum(ResponseChannel),
    sentAt: z.date()
  }),
  status: z.enum(['sent', 'failed', 'skipped', 'rate_limited']),
  error: z.string().optional(),
  createdAt: z.date()
});

export const ScheduleSchema = z.object({
  id: z.string().uuid(),
  dayOfWeek: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  timezone: z.string().default('UTC'),
  isActive: z.boolean().default(true)
});

export const TimeDelaySchema = z.object({
  id: z.string().uuid(),
  minutesAfter: z.number().int().min(1).max(10080),
  responseText: z.string().min(1).max(2000),
  useAiResponse: z.boolean().default(false)
});

// Types
export type KeywordTrigger = z.infer<typeof KeywordTriggerSchema>;
export type AutoReplyTemplate = z.infer<typeof AutoReplyTemplateSchema>;
export type AutoResponseLog = z.infer<typeof AutoResponseLogSchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;
export type TimeDelay = z.infer<typeof TimeDelaySchema>;

// API Types
export interface CreateTemplateInput {
  name: string;
  channel: ResponseChannel;
  platforms?: ResponsePlatform[];
  triggers?: { keyword: string; matchType?: TriggerMatchType; caseSensitive?: boolean }[];
  hashtags?: string[];
  responseText: string;
  responseMedia?: string[];
  useAiResponse?: boolean;
  aiPrompt?: string;
  delayMinutes?: number;
  priority?: number;
  responseLimit?: number;
}

export interface UpdateTemplateInput {
  name?: string;
  channel?: ResponseChannel;
  platforms?: ResponsePlatform[];
  triggers?: { keyword: string; matchType?: TriggerMatchType; caseSensitive?: boolean; isActive?: boolean }[];
  hashtags?: string[];
  responseText?: string;
  responseMedia?: string[];
  useAiResponse?: boolean;
  aiPrompt?: string;
  delayMinutes?: number;
  priority?: number;
  isActive?: boolean;
  responseLimit?: number;
}

export interface ProcessMessageInput {
  content: string;
  platform: ResponsePlatform;
  channel: ResponseChannel;
  authorHandle: string;
  authorId: string;
  messageId: string;
  postId?: string;
  hashtags?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
