import { Task } from '../models/index.js';
import { generateTaskId, generateCommentId, generateSubtaskId } from '../utils/idGenerator.js';
import { refreshProjectHealth } from './projectService.js';
import { createLogger } from '../utils/logger.js';
import type {
  TaskCreateInput,
  TaskUpdateInput,
  TaskFilters,
  Comment,
  SubTask
} from '../types/index.js';

const logger = createLogger('task-service');

// Helper to convert string dates to Date objects
function toDate(value: Date | string | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return new Date(value);
}

// ============================================================================
// TASK CRUD
// ============================================================================

export async function createTask(input: TaskCreateInput): Promise<typeof Task.prototype> {
  try {
    const taskId = generateTaskId();

    const task = new Task({
      projectId: input.projectId,
      milestoneId: input.milestoneId,
      sprintId: input.sprintId,
      title: input.title,
      description: input.description || '',
      assigneeId: input.assigneeId,
      assigneeName: input.assigneeName,
      estimatedHours: input.estimatedHours || 0,
      dueDate: toDate(input.dueDate),
      priority: input.priority || 'medium',
      storyPoints: input.storyPoints,
      taskId,
      status: 'todo',
      actualHours: 0,
      subtasks: [],
      attachments: [],
      comments: [],
      dependencies: input.dependencies || [],
      tags: input.tags || []
    });

    await task.save();

    // Update project completion percentage
    await refreshProjectHealth(input.projectId);

    logger.info(`Created task: ${taskId} - ${input.title}`);
    return task;
  } catch (error) {
    logger.error('Error creating task:', error);
    throw error;
  }
}

export async function getTask(taskId: string): Promise<typeof Task.prototype | null> {
  try {
    const task = await Task.findOne({ taskId });
    return task;
  } catch (error) {
    logger.error('Error getting task:', error);
    throw error;
  }
}

export async function getTasks(
  filters: TaskFilters = {},
  page: number = 1,
  limit: number = 50
): Promise<{ tasks: typeof Task.prototype[]; total: number }> {
  try {
    const query: Record<string, unknown> = {};

    if (filters.projectId) query.projectId = filters.projectId;
    if (filters.assigneeId) query.assigneeId = filters.assigneeId;
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.sprintId) query.sprintId = filters.sprintId;
    if (filters.overdue) {
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: 'done' };
    }

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .sort({ priority: 1, dueDate: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Task.countDocuments(query)
    ]);

    return { tasks, total };
  } catch (error) {
    logger.error('Error getting tasks:', error);
    throw error;
  }
}

export async function updateTask(
  taskId: string,
  input: TaskUpdateInput
): Promise<typeof Task.prototype | null> {
  try {
    const task = await Task.findOneAndUpdate(
      { taskId },
      { $set: input },
      { new: true, runValidators: true }
    );

    if (task) {
      // Update project health if status changed
      if (input.status) {
        await refreshProjectHealth(task.projectId);
      }
      logger.info(`Updated task: ${taskId}`);
    }

    return task;
  } catch (error) {
    logger.error('Error updating task:', error);
    throw error;
  }
}

export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    const task = await Task.findOne({ taskId });
    if (!task) {
      return false;
    }

    const result = await Task.deleteOne({ taskId });

    // Remove from dependency lists of other tasks
    await Task.updateMany(
      { dependencies: taskId },
      { $pull: { dependencies: taskId } }
    );

    // Update project health
    await refreshProjectHealth(task.projectId);

    logger.info(`Deleted task: ${taskId}`);
    return result.deletedCount > 0;
  } catch (error) {
    logger.error('Error deleting task:', error);
    throw error;
  }
}

// ============================================================================
// TASK ACTIONS
// ============================================================================

export async function startTask(taskId: string): Promise<typeof Task.prototype | null> {
  try {
    const task = await Task.findOne({ taskId });

    if (!task) {
      return null;
    }

    // Check if dependencies are met
    if (task.dependencies.length > 0) {
      const dependencyTasks = await Task.find({
        taskId: { $in: task.dependencies }
      });

      const incompleteDeps = dependencyTasks.filter(t => t.status !== 'done');
      if (incompleteDeps.length > 0) {
        throw new Error(`Cannot start task: ${incompleteDeps.length} dependencies not completed`);
      }
    }

    const updatedTask = await Task.findOneAndUpdate(
      { taskId },
      { status: 'in_progress' },
      { new: true }
    );

    if (updatedTask) {
      await refreshProjectHealth(task.projectId);
      logger.info(`Started task: ${taskId}`);
    }

    return updatedTask;
  } catch (error) {
    logger.error('Error starting task:', error);
    throw error;
  }
}

export async function completeTask(
  taskId: string,
  completionProof?: string
): Promise<typeof Task.prototype | null> {
  try {
    const task = await Task.findOne({ taskId });

    if (!task) {
      return null;
    }

    const updatedTask = await Task.findOneAndUpdate(
      { taskId },
      {
        status: 'done',
        completionDate: new Date(),
        completionProof: completionProof || task.completionProof
      },
      { new: true }
    );

    if (updatedTask) {
      await refreshProjectHealth(task.projectId);
      logger.info(`Completed task: ${taskId}`);
    }

    return updatedTask;
  } catch (error) {
    logger.error('Error completing task:', error);
    throw error;
  }
}

export async function blockTask(taskId: string, reason: string): Promise<typeof Task.prototype | null> {
  try {
    const task = await Task.findOneAndUpdate(
      { taskId },
      {
        status: 'blocked'
      },
      { new: true }
    );

    if (task) {
      // Add comment about block reason
      await addComment(taskId, {
        authorId: 'system',
        authorName: 'System',
        content: `Task blocked: ${reason}`
      });

      await refreshProjectHealth(task.projectId);
      logger.info(`Blocked task: ${taskId}`);
    }

    return task;
  } catch (error) {
    logger.error('Error blocking task:', error);
    throw error;
  }
}

export async function unblockTask(taskId: string): Promise<typeof Task.prototype | null> {
  try {
    const task = await Task.findOneAndUpdate(
      { taskId, status: 'blocked' },
      { status: 'todo' },
      { new: true }
    );

    if (task) {
      await refreshProjectHealth(task.projectId);
      logger.info(`Unblocked task: ${taskId}`);
    }

    return task;
  } catch (error) {
    logger.error('Error unblocking task:', error);
    throw error;
  }
}

export async function moveToReview(
  taskId: string,
  completionProof?: string
): Promise<typeof Task.prototype | null> {
  try {
    const updatedTask = await Task.findOneAndUpdate(
      { taskId, status: 'in_progress' },
      {
        status: 'review',
        completionProof: completionProof || undefined
      },
      { new: true }
    );

    if (updatedTask) {
      await refreshProjectHealth(updatedTask.projectId);
      logger.info(`Moved task to review: ${taskId}`);
    }

    return updatedTask;
  } catch (error) {
    logger.error('Error moving task to review:', error);
    throw error;
  }
}

// ============================================================================
// SUBTASKS
// ============================================================================

export async function addSubtask(
  taskId: string,
  title: string
): Promise<typeof Task.prototype | null> {
  try {
    const subtask: SubTask = {
      _id: generateSubtaskId(),
      title,
      completed: false
    };

    const task = await Task.findOneAndUpdate(
      { taskId },
      { $push: { subtasks: subtask } },
      { new: true }
    );

    if (task) {
      logger.info(`Added subtask to ${taskId}: ${title}`);
    }

    return task;
  } catch (error) {
    logger.error('Error adding subtask:', error);
    throw error;
  }
}

export async function toggleSubtask(
  taskId: string,
  subtaskId: string
): Promise<typeof Task.prototype | null> {
  try {
    const task = await Task.findOne({ taskId });
    if (!task) {
      return null;
    }

    const subtask = task.subtasks.find(s => s._id === subtaskId);
    if (!subtask) {
      return null;
    }

    subtask.completed = !subtask.completed;

    await task.save();

    logger.info(`Toggled subtask ${subtaskId} in ${taskId}: ${subtask.completed}`);
    return task;
  } catch (error) {
    logger.error('Error toggling subtask:', error);
    throw error;
  }
}

export async function deleteSubtask(
  taskId: string,
  subtaskId: string
): Promise<typeof Task.prototype | null> {
  try {
    const task = await Task.findOneAndUpdate(
      { taskId },
      { $pull: { subtasks: { _id: subtaskId } } },
      { new: true }
    );

    if (task) {
      logger.info(`Deleted subtask ${subtaskId} from ${taskId}`);
    }

    return task;
  } catch (error) {
    logger.error('Error deleting subtask:', error);
    throw error;
  }
}

// ============================================================================
// COMMENTS
// ============================================================================

export async function addComment(
  taskId: string,
  comment: Omit<Comment, '_id' | 'createdAt' | 'updatedAt'>
): Promise<typeof Task.prototype | null> {
  try {
    const newComment: Comment = {
      _id: generateCommentId(),
      ...comment,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const task = await Task.findOneAndUpdate(
      { taskId },
      {
        $push: { comments: newComment },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    );

    if (task) {
      logger.info(`Added comment to ${taskId} by ${comment.authorName}`);
    }

    return task;
  } catch (error) {
    logger.error('Error adding comment:', error);
    throw error;
  }
}

export async function updateComment(
  taskId: string,
  commentId: string,
  content: string
): Promise<typeof Task.prototype | null> {
  try {
    const task = await Task.findOne({ taskId });
    if (!task) {
      return null;
    }

    const comment = task.comments.find(c => c._id === commentId);
    if (!comment) {
      return null;
    }

    comment.content = content;
    comment.updatedAt = new Date();

    await task.save();

    logger.info(`Updated comment ${commentId} in ${taskId}`);
    return task;
  } catch (error) {
    logger.error('Error updating comment:', error);
    throw error;
  }
}

export async function deleteComment(
  taskId: string,
  commentId: string
): Promise<typeof Task.prototype | null> {
  try {
    const task = await Task.findOneAndUpdate(
      { taskId },
      { $pull: { comments: { _id: commentId } } },
      { new: true }
    );

    if (task) {
      logger.info(`Deleted comment ${commentId} from ${taskId}`);
    }

    return task;
  } catch (error) {
    logger.error('Error deleting comment:', error);
    throw error;
  }
}

// ============================================================================
// TASK ASSIGNMENTS
// ============================================================================

export async function assignTask(
  taskId: string,
  assigneeId: string,
  assigneeName: string
): Promise<typeof Task.prototype | null> {
  try {
    const task = await Task.findOneAndUpdate(
      { taskId },
      { assigneeId, assigneeName },
      { new: true }
    );

    if (task) {
      logger.info(`Assigned task ${taskId} to ${assigneeName}`);
    }

    return task;
  } catch (error) {
    logger.error('Error assigning task:', error);
    throw error;
  }
}

export async function reassignTasks(
  fromEmployeeId: string,
  toEmployeeId: string,
  toEmployeeName: string,
  taskIds?: string[]
): Promise<number> {
  try {
    const query: Record<string, unknown> = { assigneeId: fromEmployeeId };
    if (taskIds && taskIds.length > 0) {
      query.taskId = { $in: taskIds };
    }

    const result = await Task.updateMany(
      query,
      { assigneeId: toEmployeeId, assigneeName: toEmployeeName }
    );

    logger.info(`Reassigned ${result.modifiedCount} tasks from ${fromEmployeeId} to ${toEmployeeName}`);
    return result.modifiedCount;
  } catch (error) {
    logger.error('Error reassigning tasks:', error);
    throw error;
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export async function bulkUpdateTasks(
  taskIds: string[],
  updates: Partial<TaskUpdateInput>
): Promise<number> {
  try {
    const result = await Task.updateMany(
      { taskId: { $in: taskIds } },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    // Update health for affected projects
    const tasks = await Task.find({ taskId: { $in: taskIds } });
    const projectIds = [...new Set(tasks.map(t => t.projectId))];
    for (const projectId of projectIds) {
      await refreshProjectHealth(projectId);
    }

    logger.info(`Bulk updated ${result.modifiedCount} tasks`);
    return result.modifiedCount;
  } catch (error) {
    logger.error('Error bulk updating tasks:', error);
    throw error;
  }
}

export async function bulkAssignTasks(
  taskIds: string[],
  assigneeId: string,
  assigneeName: string
): Promise<number> {
  return bulkUpdateTasks(taskIds, { assigneeId, assigneeName });
}
