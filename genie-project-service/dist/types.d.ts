/**
 * GENIE Project Service - Type Definitions
 * Version: 1.0.0 | Date: May 31, 2026
 * Purpose: Project tracking and task management for GENIE Personal Intelligence OS
 *
 * Tagline: "You don't use Genie. You talk to Genie."
 */
import { z } from 'zod';
/**
 * Project Status
 */
export type ProjectStatus = 'active' | 'completed' | 'paused' | 'archived';
/**
 * Project Priority
 */
export type ProjectPriority = 'critical' | 'high' | 'medium' | 'low';
/**
 * Task Status
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
/**
 * Task Priority
 */
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
/**
 * Recurring Type
 */
export type RecurringType = 'daily' | 'weekly' | 'monthly' | 'yearly';
/**
 * Project Interface
 */
export interface Project {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    status: ProjectStatus;
    priority: ProjectPriority;
    tags: string[];
    start_date?: string;
    due_date?: string;
    completed_at?: string;
    progress: number;
    task_count: number;
    completed_task_count: number;
    owner_id?: string;
    team_members: string[];
    created_at: string;
    updated_at?: string;
}
/**
 * Task Interface
 */
export interface Task {
    id: string;
    project_id: string;
    user_id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    tags: string[];
    assignee_id?: string;
    due_date?: string;
    estimated_hours?: number;
    actual_hours?: number;
    subtasks: SubTask[];
    recurring?: RecurringConfig;
    dependencies: string[];
    completed_at?: string;
    created_at: string;
    updated_at?: string;
}
/**
 * SubTask Interface
 */
export interface SubTask {
    id: string;
    title: string;
    completed: boolean;
}
/**
 * Recurring Config
 */
export interface RecurringConfig {
    type: RecurringType;
    end_date?: string;
    interval: number;
}
/**
 * Milestone Interface
 */
export interface Milestone {
    id: string;
    project_id: string;
    name: string;
    description?: string;
    due_date: string;
    completed: boolean;
    completed_at?: string;
    created_at: string;
}
/**
 * Project Input
 */
export interface ProjectInput {
    name: string;
    description?: string;
    priority?: ProjectPriority;
    tags?: string[];
    start_date?: string;
    due_date?: string;
    owner_id?: string;
    team_members?: string[];
}
/**
 * Project Update Input
 */
export interface ProjectUpdateInput {
    name?: string;
    description?: string;
    status?: ProjectStatus;
    priority?: ProjectPriority;
    tags?: string[];
    start_date?: string;
    due_date?: string;
    progress?: number;
}
/**
 * Task Input
 */
export interface TaskInput {
    project_id: string;
    title: string;
    description?: string;
    priority?: TaskPriority;
    tags?: string[];
    assignee_id?: string;
    due_date?: string;
    estimated_hours?: number;
    subtasks?: SubTask[];
    recurring?: RecurringConfig;
    dependencies?: string[];
}
/**
 * Task Update Input
 */
export interface TaskUpdateInput {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    tags?: string[];
    assignee_id?: string;
    due_date?: string;
    estimated_hours?: number;
    actual_hours?: number;
    subtasks?: SubTask[];
    recurring?: RecurringConfig;
    dependencies?: string[];
}
/**
 * Milestone Input
 */
export interface MilestoneInput {
    project_id: string;
    name: string;
    description?: string;
    due_date: string;
}
export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta: {
        timestamp: string;
        requestId: string;
        tenantId?: string;
    };
}
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        hasMore: boolean;
    };
    meta: {
        timestamp: string;
        requestId: string;
    };
}
export declare const ProjectStatusSchema: z.ZodEnum<["active", "completed", "paused", "archived"]>;
export declare const ProjectPrioritySchema: z.ZodEnum<["critical", "high", "medium", "low"]>;
export declare const TaskStatusSchema: z.ZodEnum<["pending", "in_progress", "completed", "cancelled"]>;
export declare const TaskPrioritySchema: z.ZodEnum<["critical", "high", "medium", "low"]>;
export declare const RecurringTypeSchema: z.ZodEnum<["daily", "weekly", "monthly", "yearly"]>;
export declare const CreateProjectSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["critical", "high", "medium", "low"]>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    start_date: z.ZodOptional<z.ZodString>;
    due_date: z.ZodOptional<z.ZodString>;
    owner_id: z.ZodOptional<z.ZodString>;
    team_members: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    priority: "critical" | "high" | "medium" | "low";
    tags: string[];
    team_members: string[];
    description?: string | undefined;
    start_date?: string | undefined;
    due_date?: string | undefined;
    owner_id?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    priority?: "critical" | "high" | "medium" | "low" | undefined;
    tags?: string[] | undefined;
    start_date?: string | undefined;
    due_date?: string | undefined;
    owner_id?: string | undefined;
    team_members?: string[] | undefined;
}>;
export declare const UpdateProjectSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["active", "completed", "paused", "archived"]>>;
    priority: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    start_date: z.ZodOptional<z.ZodString>;
    due_date: z.ZodOptional<z.ZodString>;
    progress: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    priority?: "critical" | "high" | "medium" | "low" | undefined;
    status?: "active" | "completed" | "paused" | "archived" | undefined;
    tags?: string[] | undefined;
    start_date?: string | undefined;
    due_date?: string | undefined;
    progress?: number | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    priority?: "critical" | "high" | "medium" | "low" | undefined;
    status?: "active" | "completed" | "paused" | "archived" | undefined;
    tags?: string[] | undefined;
    start_date?: string | undefined;
    due_date?: string | undefined;
    progress?: number | undefined;
}>;
export declare const CreateTaskSchema: z.ZodObject<{
    project_id: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["critical", "high", "medium", "low"]>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    assignee_id: z.ZodOptional<z.ZodString>;
    due_date: z.ZodOptional<z.ZodString>;
    estimated_hours: z.ZodOptional<z.ZodNumber>;
    subtasks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        title: z.ZodString;
        completed: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        completed: boolean;
        title: string;
        id?: string | undefined;
    }, {
        title: string;
        completed?: boolean | undefined;
        id?: string | undefined;
    }>, "many">>;
    recurring: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["daily", "weekly", "monthly", "yearly"]>;
        interval: z.ZodDefault<z.ZodNumber>;
        end_date: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "daily" | "weekly" | "monthly" | "yearly";
        interval: number;
        end_date?: string | undefined;
    }, {
        type: "daily" | "weekly" | "monthly" | "yearly";
        interval?: number | undefined;
        end_date?: string | undefined;
    }>>;
    dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    priority: "critical" | "high" | "medium" | "low";
    tags: string[];
    project_id: string;
    title: string;
    dependencies: string[];
    description?: string | undefined;
    due_date?: string | undefined;
    assignee_id?: string | undefined;
    estimated_hours?: number | undefined;
    subtasks?: {
        completed: boolean;
        title: string;
        id?: string | undefined;
    }[] | undefined;
    recurring?: {
        type: "daily" | "weekly" | "monthly" | "yearly";
        interval: number;
        end_date?: string | undefined;
    } | undefined;
}, {
    project_id: string;
    title: string;
    description?: string | undefined;
    priority?: "critical" | "high" | "medium" | "low" | undefined;
    tags?: string[] | undefined;
    due_date?: string | undefined;
    assignee_id?: string | undefined;
    estimated_hours?: number | undefined;
    subtasks?: {
        title: string;
        completed?: boolean | undefined;
        id?: string | undefined;
    }[] | undefined;
    recurring?: {
        type: "daily" | "weekly" | "monthly" | "yearly";
        interval?: number | undefined;
        end_date?: string | undefined;
    } | undefined;
    dependencies?: string[] | undefined;
}>;
export declare const UpdateTaskSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["pending", "in_progress", "completed", "cancelled"]>>;
    priority: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    assignee_id: z.ZodOptional<z.ZodString>;
    due_date: z.ZodOptional<z.ZodString>;
    estimated_hours: z.ZodOptional<z.ZodNumber>;
    actual_hours: z.ZodOptional<z.ZodNumber>;
    subtasks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        title: z.ZodString;
        completed: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        completed: boolean;
        title: string;
        id?: string | undefined;
    }, {
        completed: boolean;
        title: string;
        id?: string | undefined;
    }>, "many">>;
    recurring: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["daily", "weekly", "monthly", "yearly"]>;
        interval: z.ZodNumber;
        end_date: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "daily" | "weekly" | "monthly" | "yearly";
        interval: number;
        end_date?: string | undefined;
    }, {
        type: "daily" | "weekly" | "monthly" | "yearly";
        interval: number;
        end_date?: string | undefined;
    }>>;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    priority?: "critical" | "high" | "medium" | "low" | undefined;
    status?: "completed" | "pending" | "in_progress" | "cancelled" | undefined;
    tags?: string[] | undefined;
    due_date?: string | undefined;
    title?: string | undefined;
    assignee_id?: string | undefined;
    estimated_hours?: number | undefined;
    subtasks?: {
        completed: boolean;
        title: string;
        id?: string | undefined;
    }[] | undefined;
    recurring?: {
        type: "daily" | "weekly" | "monthly" | "yearly";
        interval: number;
        end_date?: string | undefined;
    } | undefined;
    dependencies?: string[] | undefined;
    actual_hours?: number | undefined;
}, {
    description?: string | undefined;
    priority?: "critical" | "high" | "medium" | "low" | undefined;
    status?: "completed" | "pending" | "in_progress" | "cancelled" | undefined;
    tags?: string[] | undefined;
    due_date?: string | undefined;
    title?: string | undefined;
    assignee_id?: string | undefined;
    estimated_hours?: number | undefined;
    subtasks?: {
        completed: boolean;
        title: string;
        id?: string | undefined;
    }[] | undefined;
    recurring?: {
        type: "daily" | "weekly" | "monthly" | "yearly";
        interval: number;
        end_date?: string | undefined;
    } | undefined;
    dependencies?: string[] | undefined;
    actual_hours?: number | undefined;
}>;
export declare const CreateMilestoneSchema: z.ZodObject<{
    project_id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    due_date: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    due_date: string;
    project_id: string;
    description?: string | undefined;
}, {
    name: string;
    due_date: string;
    project_id: string;
    description?: string | undefined;
}>;
export declare const ListProjectsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["active", "completed", "paused", "archived"]>>;
    priority: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sort_by: z.ZodDefault<z.ZodEnum<["created_at", "due_date", "priority", "progress"]>>;
    order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    sort_by: "priority" | "due_date" | "progress" | "created_at";
    order: "asc" | "desc";
    priority?: "critical" | "high" | "medium" | "low" | undefined;
    status?: "active" | "completed" | "paused" | "archived" | undefined;
    tags?: string[] | undefined;
}, {
    priority?: "critical" | "high" | "medium" | "low" | undefined;
    status?: "active" | "completed" | "paused" | "archived" | undefined;
    tags?: string[] | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    sort_by?: "priority" | "due_date" | "progress" | "created_at" | undefined;
    order?: "asc" | "desc" | undefined;
}>;
export declare const ListTasksQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    project_id: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["pending", "in_progress", "completed", "cancelled"]>>;
    priority: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
    assignee_id: z.ZodOptional<z.ZodString>;
    due_today: z.ZodOptional<z.ZodBoolean>;
    overdue: z.ZodOptional<z.ZodBoolean>;
    sort_by: z.ZodDefault<z.ZodEnum<["created_at", "due_date", "priority"]>>;
    order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    sort_by: "priority" | "due_date" | "created_at";
    order: "asc" | "desc";
    priority?: "critical" | "high" | "medium" | "low" | undefined;
    status?: "completed" | "pending" | "in_progress" | "cancelled" | undefined;
    project_id?: string | undefined;
    assignee_id?: string | undefined;
    due_today?: boolean | undefined;
    overdue?: boolean | undefined;
}, {
    priority?: "critical" | "high" | "medium" | "low" | undefined;
    status?: "completed" | "pending" | "in_progress" | "cancelled" | undefined;
    project_id?: string | undefined;
    assignee_id?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    sort_by?: "priority" | "due_date" | "created_at" | undefined;
    order?: "asc" | "desc" | undefined;
    due_today?: boolean | undefined;
    overdue?: boolean | undefined;
}>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type CreateMilestoneInput = z.infer<typeof CreateMilestoneSchema>;
export type ListProjectsQuery = z.infer<typeof ListProjectsQuerySchema>;
export type ListTasksQuery = z.infer<typeof ListTasksQuerySchema>;
export interface TenantContext {
    tenant_id: string;
    namespace: string;
    user_id?: string;
    plan?: 'starter' | 'professional' | 'enterprise';
    roles?: string[];
}
declare global {
    namespace Express {
        interface Request {
            tenantContext?: TenantContext;
            userId?: string;
        }
    }
}
//# sourceMappingURL=types.d.ts.map