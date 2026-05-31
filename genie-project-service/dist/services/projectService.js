/**
 * GENIE Project Service - Project Service
 * Version: 1.0.0 | Date: May 31, 2026
 * Purpose: Business logic for project operations
 */
import { v4 as uuidv4 } from 'uuid';
import { ProjectModel, TaskModel, MilestoneModel } from '../models/index.js';
import { createLogger } from '../utils/logger.js';
const logger = createLogger('project-service');
// ============================================================================
// Helper Functions
// ============================================================================
function documentToProject(doc) {
    return {
        id: doc.id,
        user_id: doc.user_id,
        name: doc.name,
        description: doc.description,
        status: doc.status,
        priority: doc.priority,
        tags: doc.tags,
        start_date: doc.start_date?.toISOString(),
        due_date: doc.due_date?.toISOString(),
        completed_at: doc.completed_at?.toISOString(),
        progress: doc.progress,
        task_count: doc.task_count,
        completed_task_count: doc.completed_task_count,
        owner_id: doc.owner_id,
        team_members: doc.team_members,
        created_at: doc.created_at.toISOString(),
        updated_at: doc.updated_at?.toISOString(),
    };
}
function documentToTask(doc) {
    return {
        id: doc.id,
        project_id: doc.project_id,
        user_id: doc.user_id,
        title: doc.title,
        description: doc.description,
        status: doc.status,
        priority: doc.priority,
        tags: doc.tags,
        assignee_id: doc.assignee_id,
        due_date: doc.due_date?.toISOString(),
        estimated_hours: doc.estimated_hours,
        actual_hours: doc.actual_hours,
        subtasks: doc.subtasks.map(st => ({
            id: st.id,
            title: st.title,
            completed: st.completed,
        })),
        recurring: doc.recurring ? {
            type: doc.recurring.type,
            interval: doc.recurring.interval,
            end_date: doc.recurring.end_date?.toISOString(),
        } : undefined,
        dependencies: doc.dependencies,
        completed_at: doc.completed_at?.toISOString(),
        created_at: doc.created_at.toISOString(),
        updated_at: doc.updated_at?.toISOString(),
    };
}
function documentToMilestone(doc) {
    return {
        id: doc.id,
        project_id: doc.project_id,
        name: doc.name,
        description: doc.description,
        due_date: doc.due_date.toISOString(),
        completed: doc.completed,
        completed_at: doc.completed_at?.toISOString(),
        created_at: doc.created_at.toISOString(),
    };
}
// ============================================================================
// Project Operations
// ============================================================================
/**
 * Create a new project
 */
export async function createProject(userId, input) {
    logger.info('create_project', { userId, name: input.name });
    const id = uuidv4();
    const projectData = {
        id,
        user_id: userId,
        name: input.name,
        description: input.description,
        status: 'active',
        priority: input.priority || 'medium',
        tags: input.tags || [],
        start_date: input.start_date ? new Date(input.start_date) : undefined,
        due_date: input.due_date ? new Date(input.due_date) : undefined,
        progress: 0,
        task_count: 0,
        completed_task_count: 0,
        owner_id: input.owner_id,
        team_members: input.team_members || [],
        created_at: new Date(),
        updated_at: new Date(),
    };
    const doc = new ProjectModel(projectData);
    await doc.save();
    logger.info('project_created', { id, userId });
    return documentToProject(doc);
}
/**
 * Get project by ID
 */
export async function getProjectById(projectId, userId) {
    logger.info('get_project', { projectId, userId });
    const doc = await ProjectModel.findOne({ id: projectId, user_id: userId }).exec();
    if (!doc)
        return null;
    return documentToProject(doc);
}
/**
 * List projects with pagination
 */
export async function listProjects(userId, query) {
    logger.info('list_projects', { userId, query });
    const { page, pageSize, status, priority, tags, sort_by, order } = query;
    const skip = (page - 1) * pageSize;
    const filter = { user_id: userId };
    if (status)
        filter.status = status;
    if (priority)
        filter.priority = priority;
    if (tags && tags.length > 0)
        filter.tags = { $all: tags };
    const sort = {};
    sort[sort_by] = order === 'asc' ? 1 : -1;
    const [docs, total] = await Promise.all([
        ProjectModel.find(filter).sort(sort).skip(skip).limit(pageSize).exec(),
        ProjectModel.countDocuments(filter).exec(),
    ]);
    return {
        projects: docs.map(documentToProject),
        total,
        page,
        pageSize,
    };
}
/**
 * Update a project
 */
export async function updateProject(projectId, userId, input) {
    logger.info('update_project', { projectId, userId });
    const doc = await ProjectModel.findOne({ id: projectId, user_id: userId }).exec();
    if (!doc)
        return null;
    if (input.name !== undefined)
        doc.name = input.name;
    if (input.description !== undefined)
        doc.description = input.description;
    if (input.status !== undefined) {
        doc.status = input.status;
        if (input.status === 'completed') {
            doc.completed_at = new Date();
        }
    }
    if (input.priority !== undefined)
        doc.priority = input.priority;
    if (input.tags !== undefined)
        doc.tags = input.tags;
    if (input.start_date !== undefined)
        doc.start_date = new Date(input.start_date);
    if (input.due_date !== undefined)
        doc.due_date = new Date(input.due_date);
    if (input.progress !== undefined)
        doc.progress = input.progress;
    await doc.save();
    logger.info('project_updated', { projectId, userId });
    return documentToProject(doc);
}
/**
 * Delete a project
 */
export async function deleteProject(projectId, userId) {
    logger.info('delete_project', { projectId, userId });
    // Delete associated tasks and milestones
    await TaskModel.deleteMany({ project_id: projectId, user_id: userId }).exec();
    await MilestoneModel.deleteMany({ project_id: projectId }).exec();
    const result = await ProjectModel.deleteOne({ id: projectId, user_id: userId }).exec();
    logger.info('project_deleted', { projectId, userId });
    return result.deletedCount > 0;
}
/**
 * Recalculate project progress
 */
export async function recalculateProjectProgress(projectId) {
    const [totalTasks, completedTasks] = await Promise.all([
        TaskModel.countDocuments({ project_id: projectId }),
        TaskModel.countDocuments({ project_id: projectId, status: 'completed' }),
    ]);
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    await ProjectModel.updateOne({ id: projectId }, { task_count: totalTasks, completed_task_count: completedTasks, progress });
    return progress;
}
// ============================================================================
// Task Operations
// ============================================================================
/**
 * Create a new task
 */
export async function createTask(userId, input) {
    logger.info('create_task', { userId, projectId: input.project_id, title: input.title });
    const id = uuidv4();
    const subtasks = (input.subtasks || []).map(st => ({
        id: st.id || uuidv4(),
        title: st.title,
        completed: st.completed,
    }));
    const taskData = {
        id,
        project_id: input.project_id,
        user_id: userId,
        title: input.title,
        description: input.description,
        status: 'pending',
        priority: input.priority || 'medium',
        tags: input.tags || [],
        assignee_id: input.assignee_id,
        due_date: input.due_date ? new Date(input.due_date) : undefined,
        estimated_hours: input.estimated_hours,
        actual_hours: 0,
        subtasks,
        recurring: input.recurring ? {
            type: input.recurring.type,
            interval: input.recurring.interval,
            end_date: input.recurring.end_date ? new Date(input.recurring.end_date) : undefined,
        } : undefined,
        dependencies: input.dependencies || [],
        created_at: new Date(),
        updated_at: new Date(),
    };
    const doc = new TaskModel(taskData);
    await doc.save();
    // Update project task count
    await recalculateProjectProgress(input.project_id);
    logger.info('task_created', { id, userId });
    return documentToTask(doc);
}
/**
 * Get task by ID
 */
export async function getTaskById(taskId, userId) {
    logger.info('get_task', { taskId, userId });
    const doc = await TaskModel.findOne({ id: taskId, user_id: userId }).exec();
    if (!doc)
        return null;
    return documentToTask(doc);
}
/**
 * List tasks with pagination
 */
export async function listTasks(userId, query) {
    logger.info('list_tasks', { userId, query });
    const { page, pageSize, project_id, status, priority, assignee_id, due_today, overdue, sort_by, order } = query;
    const skip = (page - 1) * pageSize;
    const filter = { user_id: userId };
    if (project_id)
        filter.project_id = project_id;
    if (status)
        filter.status = status;
    if (priority)
        filter.priority = priority;
    if (assignee_id)
        filter.assignee_id = assignee_id;
    // Due today filter
    if (due_today) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filter.due_date = { $gte: today, $lt: tomorrow };
    }
    // Overdue filter
    if (overdue) {
        const now = new Date();
        filter.due_date = { $lt: now };
        filter.status = { $ne: 'completed' };
    }
    const sort = {};
    sort[sort_by] = order === 'asc' ? 1 : -1;
    const [docs, total] = await Promise.all([
        TaskModel.find(filter).sort(sort).skip(skip).limit(pageSize).exec(),
        TaskModel.countDocuments(filter).exec(),
    ]);
    return {
        tasks: docs.map(documentToTask),
        total,
        page,
        pageSize,
    };
}
/**
 * Update a task
 */
export async function updateTask(taskId, userId, input) {
    logger.info('update_task', { taskId, userId });
    const doc = await TaskModel.findOne({ id: taskId, user_id: userId }).exec();
    if (!doc)
        return null;
    if (input.title !== undefined)
        doc.title = input.title;
    if (input.description !== undefined)
        doc.description = input.description;
    if (input.status !== undefined) {
        const previousStatus = doc.status;
        doc.status = input.status;
        // Auto-set completed_at
        if (input.status === 'completed' && previousStatus !== 'completed') {
            doc.completed_at = new Date();
        }
    }
    if (input.priority !== undefined)
        doc.priority = input.priority;
    if (input.tags !== undefined)
        doc.tags = input.tags;
    if (input.assignee_id !== undefined)
        doc.assignee_id = input.assignee_id;
    if (input.due_date !== undefined)
        doc.due_date = new Date(input.due_date);
    if (input.estimated_hours !== undefined)
        doc.estimated_hours = input.estimated_hours;
    if (input.actual_hours !== undefined)
        doc.actual_hours = input.actual_hours;
    if (input.subtasks !== undefined) {
        doc.subtasks = input.subtasks.map(st => ({
            id: st.id || uuidv4(),
            title: st.title,
            completed: st.completed,
        }));
    }
    if (input.recurring !== undefined) {
        doc.recurring = {
            type: input.recurring.type,
            interval: input.recurring.interval,
            end_date: input.recurring.end_date ? new Date(input.recurring.end_date) : undefined,
        };
    }
    if (input.dependencies !== undefined)
        doc.dependencies = input.dependencies;
    await doc.save();
    // Update project progress
    await recalculateProjectProgress(doc.project_id);
    logger.info('task_updated', { taskId, userId });
    return documentToTask(doc);
}
/**
 * Delete a task
 */
export async function deleteTask(taskId, userId) {
    logger.info('delete_task', { taskId, userId });
    const doc = await TaskModel.findOne({ id: taskId, user_id: userId }).exec();
    if (!doc)
        return false;
    const projectId = doc.project_id;
    const result = await TaskModel.deleteOne({ id: taskId, user_id: userId }).exec();
    // Update project progress
    await recalculateProjectProgress(projectId);
    logger.info('task_deleted', { taskId, userId });
    return result.deletedCount > 0;
}
/**
 * Get tasks for a project
 */
export async function getProjectTasks(projectId, userId) {
    logger.info('get_project_tasks', { projectId, userId });
    const docs = await TaskModel.find({ project_id: projectId, user_id: userId })
        .sort({ created_at: -1 })
        .exec();
    return docs.map(documentToTask);
}
// ============================================================================
// Milestone Operations
// ============================================================================
/**
 * Create a milestone
 */
export async function createMilestone(userId, input) {
    logger.info('create_milestone', { userId, projectId: input.project_id, name: input.name });
    const id = uuidv4();
    // Verify project exists
    const project = await ProjectModel.findOne({ id: input.project_id, user_id: userId }).exec();
    if (!project) {
        throw new Error('Project not found');
    }
    const milestoneData = {
        id,
        project_id: input.project_id,
        name: input.name,
        description: input.description,
        due_date: new Date(input.due_date),
        completed: false,
        created_at: new Date(),
    };
    const doc = new MilestoneModel(milestoneData);
    await doc.save();
    logger.info('milestone_created', { id, userId });
    return documentToMilestone(doc);
}
/**
 * Get milestones for a project
 */
export async function getProjectMilestones(projectId) {
    logger.info('get_project_milestones', { projectId });
    const docs = await MilestoneModel.find({ project_id: projectId })
        .sort({ due_date: 1 })
        .exec();
    return docs.map(documentToMilestone);
}
/**
 * Complete a milestone
 */
export async function completeMilestone(milestoneId, userId) {
    logger.info('complete_milestone', { milestoneId, userId });
    const doc = await MilestoneModel.findOne({ id: milestoneId }).exec();
    if (!doc)
        return null;
    // Verify ownership
    const project = await ProjectModel.findOne({ id: doc.project_id, user_id: userId }).exec();
    if (!project)
        return null;
    doc.completed = true;
    doc.completed_at = new Date();
    await doc.save();
    logger.info('milestone_completed', { milestoneId, userId });
    return documentToMilestone(doc);
}
/**
 * Delete a milestone
 */
export async function deleteMilestone(milestoneId, userId) {
    logger.info('delete_milestone', { milestoneId, userId });
    const doc = await MilestoneModel.findOne({ id: milestoneId }).exec();
    if (!doc)
        return false;
    // Verify ownership
    const project = await ProjectModel.findOne({ id: doc.project_id, user_id: userId }).exec();
    if (!project)
        return false;
    const result = await MilestoneModel.deleteOne({ id: milestoneId }).exec();
    logger.info('milestone_deleted', { milestoneId, userId });
    return result.deletedCount > 0;
}
// ============================================================================
// Statistics
// ============================================================================
/**
 * Get project statistics
 */
export async function getProjectStats(userId) {
    logger.info('get_project_stats', { userId });
    const now = new Date();
    const [totalProjects, activeProjects, completedProjects, totalTasks, pendingTasks, completedTasks, overdueTasks, upcomingMilestones,] = await Promise.all([
        ProjectModel.countDocuments({ user_id: userId }),
        ProjectModel.countDocuments({ user_id: userId, status: 'active' }),
        ProjectModel.countDocuments({ user_id: userId, status: 'completed' }),
        TaskModel.countDocuments({ user_id: userId }),
        TaskModel.countDocuments({ user_id: userId, status: 'pending' }),
        TaskModel.countDocuments({ user_id: userId, status: 'completed' }),
        TaskModel.countDocuments({ user_id: userId, due_date: { $lt: now }, status: { $ne: 'completed' } }),
        MilestoneModel.countDocuments({ due_date: { $gte: now }, completed: false }),
    ]);
    return {
        total_projects: totalProjects,
        active_projects: activeProjects,
        completed_projects: completedProjects,
        total_tasks: totalTasks,
        pending_tasks: pendingTasks,
        completed_tasks: completedTasks,
        overdue_tasks: overdueTasks,
        upcoming_milestones: upcomingMilestones,
    };
}
//# sourceMappingURL=projectService.js.map