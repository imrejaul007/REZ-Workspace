/**
 * GENIE Project Service - Project Service
 * Version: 1.0.0 | Date: May 31, 2026
 * Purpose: Business logic for project operations
 */
import { Project, Task, Milestone, CreateProjectInput, UpdateProjectInput, CreateTaskInput, UpdateTaskInput, CreateMilestoneInput, ListProjectsQuery, ListTasksQuery } from '../types.js';
/**
 * Create a new project
 */
export declare function createProject(userId: string, input: CreateProjectInput): Promise<Project>;
/**
 * Get project by ID
 */
export declare function getProjectById(projectId: string, userId: string): Promise<Project | null>;
/**
 * List projects with pagination
 */
export declare function listProjects(userId: string, query: ListProjectsQuery): Promise<{
    projects: Project[];
    total: number;
    page: number;
    pageSize: number;
}>;
/**
 * Update a project
 */
export declare function updateProject(projectId: string, userId: string, input: UpdateProjectInput): Promise<Project | null>;
/**
 * Delete a project
 */
export declare function deleteProject(projectId: string, userId: string): Promise<boolean>;
/**
 * Recalculate project progress
 */
export declare function recalculateProjectProgress(projectId: string): Promise<number>;
/**
 * Create a new task
 */
export declare function createTask(userId: string, input: CreateTaskInput): Promise<Task>;
/**
 * Get task by ID
 */
export declare function getTaskById(taskId: string, userId: string): Promise<Task | null>;
/**
 * List tasks with pagination
 */
export declare function listTasks(userId: string, query: ListTasksQuery): Promise<{
    tasks: Task[];
    total: number;
    page: number;
    pageSize: number;
}>;
/**
 * Update a task
 */
export declare function updateTask(taskId: string, userId: string, input: UpdateTaskInput): Promise<Task | null>;
/**
 * Delete a task
 */
export declare function deleteTask(taskId: string, userId: string): Promise<boolean>;
/**
 * Get tasks for a project
 */
export declare function getProjectTasks(projectId: string, userId: string): Promise<Task[]>;
/**
 * Create a milestone
 */
export declare function createMilestone(userId: string, input: CreateMilestoneInput): Promise<Milestone>;
/**
 * Get milestones for a project
 */
export declare function getProjectMilestones(projectId: string): Promise<Milestone[]>;
/**
 * Complete a milestone
 */
export declare function completeMilestone(milestoneId: string, userId: string): Promise<Milestone | null>;
/**
 * Delete a milestone
 */
export declare function deleteMilestone(milestoneId: string, userId: string): Promise<boolean>;
/**
 * Get project statistics
 */
export declare function getProjectStats(userId: string): Promise<{
    total_projects: number;
    active_projects: number;
    completed_projects: number;
    total_tasks: number;
    pending_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
    upcoming_milestones: number;
}>;
//# sourceMappingURL=projectService.d.ts.map