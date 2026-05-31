/**
 * GENIE Project Service - Type Definitions
 * Version: 1.0.0 | Date: May 31, 2026
 * Purpose: Project tracking and task management for GENIE Personal Intelligence OS
 *
 * Tagline: "You don't use Genie. You talk to Genie."
 */
import { z } from 'zod';
// ============================================================================
// Zod Schemas
// ============================================================================
// Project Status Schema
export const ProjectStatusSchema = z.enum(['active', 'completed', 'paused', 'archived']);
// Project Priority Schema
export const ProjectPrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);
// Task Status Schema
export const TaskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
// Task Priority Schema
export const TaskPrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);
// Recurring Type Schema
export const RecurringTypeSchema = z.enum(['daily', 'weekly', 'monthly', 'yearly']);
// Create Project Schema
export const CreateProjectSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    description: z.string().max(2000).optional(),
    priority: ProjectPrioritySchema.default('medium'),
    tags: z.array(z.string().max(50)).max(20).default([]),
    start_date: z.string().datetime().optional(),
    due_date: z.string().datetime().optional(),
    owner_id: z.string().optional(),
    team_members: z.array(z.string()).max(50).default([]),
});
// Update Project Schema
export const UpdateProjectSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: ProjectStatusSchema.optional(),
    priority: ProjectPrioritySchema.optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    start_date: z.string().datetime().optional(),
    due_date: z.string().datetime().optional(),
    progress: z.number().min(0).max(100).optional(),
});
// Create Task Schema
export const CreateTaskSchema = z.object({
    project_id: z.string().min(1),
    title: z.string().min(1, 'Title is required').max(500),
    description: z.string().max(5000).optional(),
    priority: TaskPrioritySchema.default('medium'),
    tags: z.array(z.string().max(50)).max(20).default([]),
    assignee_id: z.string().optional(),
    due_date: z.string().datetime().optional(),
    estimated_hours: z.number().min(0).optional(),
    subtasks: z.array(z.object({
        id: z.string().optional(),
        title: z.string().min(1).max(200),
        completed: z.boolean().default(false),
    })).optional(),
    recurring: z.object({
        type: RecurringTypeSchema,
        interval: z.number().min(1).default(1),
        end_date: z.string().datetime().optional(),
    }).optional(),
    dependencies: z.array(z.string()).max(20).default([]),
});
// Update Task Schema
export const UpdateTaskSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(5000).optional(),
    status: TaskStatusSchema.optional(),
    priority: TaskPrioritySchema.optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    assignee_id: z.string().optional(),
    due_date: z.string().datetime().optional(),
    estimated_hours: z.number().min(0).optional(),
    actual_hours: z.number().min(0).optional(),
    subtasks: z.array(z.object({
        id: z.string().optional(),
        title: z.string().min(1).max(200),
        completed: z.boolean(),
    })).optional(),
    recurring: z.object({
        type: RecurringTypeSchema,
        interval: z.number().min(1),
        end_date: z.string().datetime().optional(),
    }).optional(),
    dependencies: z.array(z.string()).max(20).optional(),
});
// Create Milestone Schema
export const CreateMilestoneSchema = z.object({
    project_id: z.string().min(1),
    name: z.string().min(1, 'Name is required').max(200),
    description: z.string().max(1000).optional(),
    due_date: z.string().datetime(),
});
// Query Schemas
export const ListProjectsQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
    status: ProjectStatusSchema.optional(),
    priority: ProjectPrioritySchema.optional(),
    tags: z.array(z.string()).optional(),
    sort_by: z.enum(['created_at', 'due_date', 'priority', 'progress']).default('created_at'),
    order: z.enum(['asc', 'desc']).default('desc'),
});
export const ListTasksQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
    project_id: z.string().optional(),
    status: TaskStatusSchema.optional(),
    priority: TaskPrioritySchema.optional(),
    assignee_id: z.string().optional(),
    due_today: z.boolean().optional(),
    overdue: z.boolean().optional(),
    sort_by: z.enum(['created_at', 'due_date', 'priority']).default('created_at'),
    order: z.enum(['asc', 'desc']).default('desc'),
});
//# sourceMappingURL=types.js.map