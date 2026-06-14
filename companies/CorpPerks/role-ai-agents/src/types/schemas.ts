// ============================================================================
// Role AI Agents - Zod Validation Schemas
// ============================================================================

import { z } from 'zod';
import type { JobRole, AgentLevel } from './index';

// Valid roles and levels
export const VALID_ROLES: JobRole[] = [
  'software-engineer',
  'sales',
  'marketing',
  'finance',
  'hr',
  'operations',
  'product',
  'design',
  'support',
  'admin',
];

export const VALID_LEVELS: AgentLevel[] = ['L1', 'L2', 'L3', 'L4'];

// Role Schema
export const JobRoleSchema = z.enum(VALID_ROLES as [JobRole, ...JobRole[]]);
export const AgentLevelSchema = z.enum(VALID_LEVELS as [AgentLevel, ...AgentLevel[]]);

// Chat Message Schema
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(10000),
  timestamp: z.date().or(z.string().datetime()),
});

// User Profile Schema
export const UserProfileSchema = z.object({
  userId: z.string().min(1),
  currentRole: JobRoleSchema.optional(),
  currentLevel: AgentLevelSchema.optional(),
  experience: z.number().min(0).max(50),
  skills: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
});

// Chat Request Schema
export const ChatRequestSchema = z.object({
  role: JobRoleSchema,
  level: AgentLevelSchema,
  message: z.string().min(1).max(5000),
  userId: z.string().optional(),
  context: z.object({
    previousMessages: z.array(ChatMessageSchema).optional(),
    userProfile: UserProfileSchema.optional(),
    sessionData: z.record(z.unknown()).optional(),
  }).optional(),
});

// Recommendation Request Schema
export const RoleRecommendationRequestSchema = z.object({
  userId: z.string().optional(),
  currentRole: JobRoleSchema.optional(),
  currentLevel: AgentLevelSchema.optional(),
  experience: z.number().min(0).max(50).optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  targetRole: JobRoleSchema.optional(),
});

// Session ID Schema
export const SessionIdSchema = z.string().uuid();

// Pagination Schema
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Type exports
export type ChatRequestInput = z.infer<typeof ChatRequestSchema>;
export type UserProfileInput = z.infer<typeof UserProfileSchema>;
export type RoleRecommendationRequestInput = z.infer<typeof RoleRecommendationRequestSchema>;
