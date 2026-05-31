/**
 * GENIE Briefing Service - Type Definitions
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Daily briefings (morning + evening) for GENIE Personal Intelligence OS
 *
 * Tagline: "You don't use Genie. You talk to Genie."
 */
import { z } from 'zod';
// ============================================================================
// Zod Schemas for Validation
// ============================================================================
// Briefing Type Schema
export const BriefingTypeSchema = z.enum(['morning', 'evening']);
// Section Type Schema
export const SectionTypeSchema = z.enum(['calendar', 'tasks', 'followups', 'weather', 'insights', 'reminders']);
// Priority Level Schema
export const PriorityLevelSchema = z.enum(['high', 'medium', 'low']);
// Briefing Item Schema (for input - id is optional)
export const BriefingItemSchema = z.object({
    id: z.string().optional(), // Optional for input
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    description: z.string().max(1000).optional(),
    priority: PriorityLevelSchema.optional(),
    completed: z.boolean().optional(),
    action_url: z.string().url().optional().or(z.literal('')),
}).transform((data) => ({
    id: data.id || `item_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    title: data.title,
    description: data.description,
    priority: data.priority,
    completed: data.completed,
    action_url: data.action_url,
}));
// Briefing Section Schema (for input)
export const BriefingSectionSchema = z.object({
    type: SectionTypeSchema,
    title: z.string().min(1).max(100),
    items: z.array(BriefingItemSchema).default([]),
});
// Create Briefing Schema
export const CreateBriefingSchema = z.object({
    type: BriefingTypeSchema,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    sections: z.array(BriefingSectionSchema).default([]),
    summary: z.string().max(500).optional(),
});
// Update Briefing Schema
export const UpdateBriefingSchema = z.object({
    type: BriefingTypeSchema.optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    sections: z.array(BriefingSectionSchema).optional(),
    summary: z.string().max(500).optional(),
});
// Generate Briefing Schema
export const GenerateBriefingSchema = z.object({
    type: BriefingTypeSchema,
    user_id: z.string().min(1, 'User ID is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    include_sections: z.array(SectionTypeSchema).optional(),
    preferences: z.object({
        format: z.enum(['concise', 'detailed']).default('detailed'),
        tone: z.enum(['formal', 'casual', 'friendly']).default('friendly'),
    }).optional(),
});
// Query Schemas
export const GetBriefingQuerySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export const ListBriefingsQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
    type: BriefingTypeSchema.optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
//# sourceMappingURL=types.js.map