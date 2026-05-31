/**
 * GENIE Memory Service - Type Definitions
 * Version: 1.0.0 | Date: May 31, 2026
 * Purpose: Personal memory storage and retrieval for GENIE Personal Intelligence OS
 *
 * Tagline: "You don't use Genie. You talk to Genie."
 */
import { z } from 'zod';
// ============================================================================
// Zod Schemas for Validation
// ============================================================================
// Memory Category Schema
export const MemoryCategorySchema = z.enum([
    'conversation',
    'fact',
    'preference',
    'event',
    'decision',
    'idea',
    'learning',
    'personal',
    'work',
    'social'
]);
// Importance Level Schema
export const ImportanceLevelSchema = z.enum(['critical', 'high', 'medium', 'low']);
// Emotional Tone Schema
export const EmotionalToneSchema = z.enum(['positive', 'negative', 'neutral', 'mixed']);
// Memory Source Schema
export const MemorySourceSchema = z.enum(['user_input', 'conversation', 'extraction', 'import', 'ai_generated']);
// Create Memory Schema
export const CreateMemorySchema = z.object({
    content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
    summary: z.string().max(500).optional(),
    category: MemoryCategorySchema,
    tags: z.array(z.string().max(50)).max(20).default([]),
    importance: ImportanceLevelSchema.default('medium'),
    emotional_tone: EmotionalToneSchema.optional(),
    source: MemorySourceSchema.default('user_input'),
    context: z.string().max(1000).optional(),
    expires_at: z.string().datetime().optional(),
});
// Update Memory Schema
export const UpdateMemorySchema = z.object({
    content: z.string().min(1).max(10000).optional(),
    summary: z.string().max(500).optional(),
    category: MemoryCategorySchema.optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    importance: ImportanceLevelSchema.optional(),
    emotional_tone: EmotionalToneSchema.optional(),
    related_memory_ids: z.array(z.string()).max(50).optional(),
    expires_at: z.string().datetime().optional(),
});
// Search Memories Schema
export const SearchMemoriesSchema = z.object({
    query: z.string().max(500).optional(),
    category: MemoryCategorySchema.optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    importance: ImportanceLevelSchema.optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).default(0),
});
// Query Schemas
export const GetMemoryQuerySchema = z.object({
    category: MemoryCategorySchema.optional(),
    importance: ImportanceLevelSchema.optional(),
});
export const ListMemoriesQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
    category: MemoryCategorySchema.optional(),
    importance: ImportanceLevelSchema.optional(),
    sort_by: z.enum(['created_at', 'importance', 'recall_count']).default('created_at'),
    order: z.enum(['asc', 'desc']).default('desc'),
});
// Recall Memory Schema
export const RecallMemorySchema = z.object({
    memory_ids: z.array(z.string()).min(1).max(50),
});
// Add Tags Schema
export const AddTagsSchema = z.object({
    tags: z.array(z.string().max(50)).min(1).max(20),
});
//# sourceMappingURL=types.js.map