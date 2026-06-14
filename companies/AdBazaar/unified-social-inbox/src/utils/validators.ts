import { z } from 'zod';

// Platform enum
export const PlatformSchema = z.enum(['instagram', 'facebook', 'twitter', 'linkedin', 'whatsapp']);
export const MessageSenderSchema = z.enum(['user', 'agent']);
export const MediaTypeSchema = z.enum(['image', 'video', 'audio']);
export const ConversationStatusSchema = z.enum(['active', 'closed', 'snoozed']);
export const PrioritySchema = z.enum(['low', 'medium', 'high']);
export const SentimentSchema = z.enum(['positive', 'neutral', 'negative']);

// Platform user schema
export const PlatformUserSchema = z.object({
  platformUserId: z.string().min(1),
  username: z.string().min(1),
  displayName: z.string().min(1),
  profileImage: z.string().url().optional(),
  followerCount: z.number().optional(),
});

// Conversation schemas
export const CreateConversationSchema = z.object({
  platform: PlatformSchema,
  platformConversationId: z.string().min(1),
  user: PlatformUserSchema,
  accountId: z.string().min(1),
});

export const UpdateConversationSchema = z.object({
  status: ConversationStatusSchema.optional(),
  priority: PrioritySchema.optional(),
  sentiment: SentimentSchema.optional(),
  tags: z.array(z.string()).optional(),
  assignee: z.string().optional(),
  snoozedUntil: z.string().datetime().optional(),
});

export const AssignConversationSchema = z.object({
  assignee: z.string().min(1),
});

export const UpdateTagsSchema = z.object({
  tags: z.array(z.string()),
});

export const UpdateStatusSchema = z.object({
  status: ConversationStatusSchema,
});

// Message schemas
export const SendMessageSchema = z.object({
  platform: PlatformSchema,
  platformConversationId: z.string().min(1),
  content: z.string().min(1),
  mediaUrl: z.string().url().optional(),
  mediaType: MediaTypeSchema.optional(),
  recipientId: z.string().min(1),
});

export const ReplyToThreadSchema = z.object({
  content: z.string().min(1),
  mediaUrl: z.string().url().optional(),
  mediaType: MediaTypeSchema.optional(),
});

export const ForwardMessageSchema = z.object({
  messageId: z.string().min(1),
  targetPlatform: PlatformSchema,
  targetConversationId: z.string().min(1),
});

export const SnoozeSchema = z.object({
  duration: z.number().min(5).max(10080).describe('Duration in minutes (5 min to 1 week)'),
});

export const UnsnoozeSchema = z.object({}).strict();

// Template schemas
export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  platform: z.union([PlatformSchema, z.literal('all')]).default('all'),
  category: z.string().min(1).max(50),
  content: z.string().min(1).max(1000),
  emoji: z.string().max(10).optional(),
  variables: z.array(z.string()).optional(),
});

export const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  platform: z.union([PlatformSchema, z.literal('all')]).optional(),
  category: z.string().min(1).max(50).optional(),
  content: z.string().min(1).max(1000).optional(),
  emoji: z.string().max(10).optional(),
  variables: z.array(z.string()).optional(),
});

// Settings schemas
export const UpdateSettingsSchema = z.object({
  autoAssign: z.boolean().optional(),
  assignmentRules: z.array(z.object({
    id: z.string(),
    keyword: z.string(),
    assignee: z.string(),
    priority: PrioritySchema,
  })).optional(),
  notificationSettings: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    slack: z.boolean().optional(),
  }).optional(),
  workingHours: z.object({
    enabled: z.boolean().optional(),
    timezone: z.string().optional(),
    startHour: z.number().min(0).max(23).optional(),
    endHour: z.number().min(0).max(23).optional(),
    daysOff: z.array(z.number().min(0).max(6)).optional(),
  }).optional(),
  slaSettings: z.object({
    firstResponseTime: z.number().min(0).optional(),
    resolutionTime: z.number().min(0).optional(),
    warningThreshold: z.number().min(0).max(1).optional(),
  }).optional(),
  sentimentThreshold: z.number().min(0).max(1).optional(),
});

// Query schemas
export const ConversationFiltersSchema = z.object({
  platform: PlatformSchema.optional(),
  status: ConversationStatusSchema.optional(),
  priority: PrioritySchema.optional(),
  assignee: z.string().optional(),
  sentiment: SentimentSchema.optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;
export type UpdateConversationInput = z.infer<typeof UpdateConversationSchema>;
export type AssignConversationInput = z.infer<typeof AssignConversationSchema>;
export type UpdateTagsInput = z.infer<typeof UpdateTagsSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type ReplyToThreadInput = z.infer<typeof ReplyToThreadSchema>;
export type ForwardMessageInput = z.infer<typeof ForwardMessageSchema>;
export type SnoozeInput = z.infer<typeof SnoozeSchema>;
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;
export type ConversationFiltersInput = z.infer<typeof ConversationFiltersSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;