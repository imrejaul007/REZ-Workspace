/**
 * GENIE Relationship Service - Type Definitions
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Personal relationship tracking for GENIE Personal Intelligence OS
 */
import { z } from 'zod';
/**
 * Zod Schemas for Validation
 */
// Relationship Type Schema
export const RelationshipTypeSchema = z.enum(['family', 'friend', 'colleague', 'client', 'professional']);
// Interaction Type Schema
export const InteractionTypeSchema = z.enum(['call', 'message', 'meeting', 'email', 'note']);
// Create Relationship Schema
export const CreateRelationshipSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    relationship_type: RelationshipTypeSchema,
    importance_score: z.number().min(1).max(10).default(5),
    next_followup: z.string().optional(),
    birthday: z.string().optional(),
    tags: z.array(z.string()).default([]),
    notes: z.string().default(''),
    context: z.array(z.string()).default([]),
});
// Update Relationship Schema
export const UpdateRelationshipSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    relationship_type: RelationshipTypeSchema.optional(),
    importance_score: z.number().min(1).max(10).optional(),
    next_followup: z.string().optional(),
    birthday: z.string().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
    context: z.array(z.string()).optional(),
});
// Create Interaction Schema
export const CreateInteractionSchema = z.object({
    type: InteractionTypeSchema,
    description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
    timestamp: z.string().optional(),
});
// List Relationships Query Schema
export const ListRelationshipsQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
    type: RelationshipTypeSchema.optional(),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'importance_score', 'last_interaction', 'created_at']).default('importance_score'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
// List Interactions Query Schema
export const ListInteractionsQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
    type: InteractionTypeSchema.optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});
//# sourceMappingURL=types.js.map