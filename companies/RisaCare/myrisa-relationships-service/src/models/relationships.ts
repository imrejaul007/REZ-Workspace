import { z } from 'zod';

// Enums as const objects for better type safety
export const RelationshipStatus = {
  ACTIVE: 'active',
  MARRIED: 'married',
  ENGAGED: 'engaged',
  COMPLICATED: 'complicated',
  LONG_DISTANCE: 'long_distance',
  ON_BREAK: 'on_break',
  ENDED: 'ended'
} as const;

export const InteractionType = {
  CALL: 'call',
  VIDEO_CALL: 'video_call',
  DATE: 'date',
  TEXT: 'text',
  IN_PERSON: 'in_person',
  QUALITY_TIME: 'quality_time',
  CONFLICT: 'conflict',
  SENTIMENTAL_MOMENT: 'sentimental_moment'
} as const;

// Type exports for enum values
export type RelationshipStatusType = typeof RelationshipStatus[keyof typeof RelationshipStatus];
export type InteractionTypeValue = typeof InteractionType[keyof typeof InteractionType];
export type GoalStatusType = typeof GoalStatus[keyof typeof GoalStatus];

export const GoalStatus = {
  ACTIVE: 'active',
  ACHIEVED: 'achieved',
  ABANDONED: 'abandoned'
} as const;

// Zod Schemas
export const PartnerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Partner name is required'),
  birthday: z.string().optional(),
  anniversary: z.string().optional(),
  photoUrl: z.string().url().optional(),
  notes: z.string().optional()
});

export const RelationshipSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().min(1, 'User ID is required'),
  partner: PartnerSchema,
  status: z.enum([
    RelationshipStatus.ACTIVE,
    RelationshipStatus.MARRIED,
    RelationshipStatus.ENGAGED,
    RelationshipStatus.COMPLICATED,
    RelationshipStatus.LONG_DISTANCE,
    RelationshipStatus.ON_BREAK,
    RelationshipStatus.ENDED
  ]),
  startDate: z.string(),
  qualityScore: z.number().min(0).max(10).default(5),
  communicationScore: z.number().min(0).max(10).default(5),
  intimacyScore: z.number().min(0).max(10).default(5),
  trustScore: z.number().min(0).max(10).default(5),
  conflictResolutionScore: z.number().min(0).max(10).default(5),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const InteractionRecordSchema = z.object({
  id: z.string().uuid(),
  relationshipId: z.string().uuid(),
  type: z.enum([
    InteractionType.CALL,
    InteractionType.VIDEO_CALL,
    InteractionType.DATE,
    InteractionType.TEXT,
    InteractionType.IN_PERSON,
    InteractionType.QUALITY_TIME,
    InteractionType.CONFLICT,
    InteractionType.SENTIMENTAL_MOMENT
  ]),
  date: z.string(),
  duration: z.number().min(0).optional(), // in minutes
  quality: z.number().min(1).max(5).default(3),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  conflicts: z.array(z.object({
    description: z.string(),
    resolution: z.string().optional(),
    resolved: z.boolean().default(false)
  })).default([]),
  createdAt: z.string()
});

export const RelationshipGoalSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().min(1, 'User ID is required'),
  relationshipId: z.string().uuid().optional(),
  title: z.string().min(1, 'Goal title is required'),
  description: z.string().optional(),
  targetDate: z.string().optional(),
  status: z.enum([
    GoalStatus.ACTIVE,
    GoalStatus.ACHIEVED,
    GoalStatus.ABANDONED
  ]).default(GoalStatus.ACTIVE),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  progress: z.number().min(0).max(100).default(0),
  metrics: z.object({
    targetValue: z.number().optional(),
    currentValue: z.number().default(0),
    unit: z.string().optional()
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const RelationshipHealthScoreSchema = z.object({
  userId: z.string().min(1),
  overallScore: z.number().min(0).max(100),
  communicationScore: z.number().min(0).max(100),
  intimacyScore: z.number().min(0).max(100),
  trustScore: z.number().min(0).max(100),
  conflictResolutionScore: z.number().min(0).max(100),
  qualityTimeScore: z.number().min(0).max(100),
  emotionalSupportScore: z.number().min(0).max(100),
  growthScore: z.number().min(0).max(100),
  trend: z.enum(['improving', 'stable', 'declining']).default('stable'),
  recentInteractions: z.number().default(0),
  calculatedAt: z.string()
});

// Input schemas for API endpoints
export const AddRelationshipInputSchema = z.object({
  partner: z.object({
    name: z.string().min(1),
    birthday: z.string().optional(),
    anniversary: z.string().optional(),
    photoUrl: z.string().url().optional(),
    notes: z.string().optional()
  }),
  status: z.enum([
    RelationshipStatus.ACTIVE,
    RelationshipStatus.MARRIED,
    RelationshipStatus.ENGAGED,
    RelationshipStatus.COMPLICATED,
    RelationshipStatus.LONG_DISTANCE,
    RelationshipStatus.ON_BREAK
  ]).default(RelationshipStatus.ACTIVE),
  startDate: z.string().optional()
});

export const LogInteractionInputSchema = z.object({
  type: z.enum([
    InteractionType.CALL,
    InteractionType.VIDEO_CALL,
    InteractionType.DATE,
    InteractionType.TEXT,
    InteractionType.IN_PERSON,
    InteractionType.QUALITY_TIME,
    InteractionType.CONFLICT,
    InteractionType.SENTIMENTAL_MOMENT
  ]),
  date: z.string().optional(),
  duration: z.number().min(0).optional(),
  quality: z.number().min(1).max(5).default(3),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  conflicts: z.array(z.object({
    description: z.string(),
    resolution: z.string().optional(),
    resolved: z.boolean().default(false)
  })).default([])
});

export const SetGoalInputSchema = z.object({
  relationshipId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  targetDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  metrics: z.object({
    targetValue: z.number().optional(),
    currentValue: z.number().default(0),
    unit: z.string().optional()
  }).optional()
});

// TypeScript Types (inferred from Zod schemas)
export type Partner = z.infer<typeof PartnerSchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type InteractionRecord = z.infer<typeof InteractionRecordSchema>;
export type RelationshipGoal = z.infer<typeof RelationshipGoalSchema>;
export type RelationshipHealthScore = z.infer<typeof RelationshipHealthScoreSchema>;

// Input types use z.input to include defaults
export type AddRelationshipInput = z.input<typeof AddRelationshipInputSchema>;
export type LogInteractionInput = z.input<typeof LogInteractionInputSchema>;
export type SetGoalInput = z.input<typeof SetGoalInputSchema>;