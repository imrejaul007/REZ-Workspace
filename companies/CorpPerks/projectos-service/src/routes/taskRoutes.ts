import { Router, Response } from 'express';
import { z } from 'zod';
import {
  createTask,
  getTask,
  getTasks,
  updateTask,
  deleteTask,
  startTask,
  completeTask,
  blockTask,
  unblockTask,
  moveToReview,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  addComment,
  updateComment,
  deleteComment,
  assignTask,
  bulkUpdateTasks
} from '../services/taskService.js';
import { asyncHandler, AuthenticatedRequest } from '../middleware/index.js';
import type { TaskStatus, TaskPriority } from '../types/index.js';

const router = Router();

// Validation schemas
const createTaskSchema = z.object({
  projectId: z.string().min(1),
  milestoneId: z.string().optional(),
  sprintId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  assigneeId: z.string().min(1),
  assigneeName: z.string().min(1),
  estimatedHours: z.number().min(0).optional().default(0),
  dueDate: z.string().datetime().or(z.date()),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  dependencies: z.array(z.string()).optional().default([]),
  storyPoints: z.number().min(0).optional(),
  tags: z.array(z.string()).optional().default([])
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().optional(),
  assigneeName: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'blocked']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  dueDate: z.string().datetime().or(z.date()).optional(),
  completionProof: z.string().optional(),
  storyPoints: z.number().min(0).optional(),
  tags: z.array(z.string()).optional()
});

const addCommentSchema = z.object({
  authorId: z.string().min(1),
  authorName: z.string().min(1),
  content: z.string().min(1).max(1000)
});

const addSubtaskSchema = z.object({
  title: z.string().min(1).max(200)
});

const bulkUpdateSchema = z.object({
  taskIds: z.array(z.string()).min(1),
  updates: updateTaskSchema.partial()
});

// GET /api/tasks - List tasks
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    projectId,
    assigneeId,
    status,
    priority,
    sprintId,
    search,
    overdue,
    page = '1',
    limit = '50'
  } = req.query;

  const filters = {
    projectId: projectId as string | undefined,
    assigneeId: assigneeId as string | undefined,
    status: status as TaskStatus | undefined,
    priority: priority as TaskPriority | undefined,
    sprintId: sprintId as string | undefined,
    search: search as string | undefined,
    overdue: overdue === 'true'
  };

  const pageNum = parseInt(page as string, 10);
  const limitNum = Math.min(parseInt(limit as string, 10), 100);

  const { tasks, total } = await getTasks(filters, pageNum, limitNum);

  res.json({
    success: true,
    data: tasks,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
}));

// GET /api/tasks/:id - Get task
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const task = await getTask(id);

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task not found'
    });
    return;
  }

  res.json({
    success: true,
    data: task
  });
}));

// POST /api/tasks - Create task
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validationResult = createTaskSchema.safeParse(req.body);

  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationResult.error.errors
    });
    return;
  }

  const data = validationResult.data;
  const task = await createTask({
    ...data,
    dueDate: new Date(data.dueDate)
  });

  res.status(201).json({
    success: true,
    data: task,
    message: 'Task created successfully'
  });
}));

// PATCH /api/tasks/:id - Update task
router.patch('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const validationResult = updateTaskSchema.safeParse(req.body);

  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationResult.error.errors
    });
    return;
  }

  const data = validationResult.data;
  const task = await updateTask(id, {
    ...data,
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined
  });

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task not found'
    });
    return;
  }

  res.json({
    success: true,
    data: task,
    message: 'Task updated successfully'
  });
}));

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const deleted = await deleteTask(id);

  if (!deleted) {
    res.status(404).json({
      success: false,
      error: 'Task not found'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
}));

// POST /api/tasks/:id/start - Start task
router.post('/:id/start', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const task = await startTask(id);

    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found'
      });
      return;
    }

    res.json({
      success: true,
      data: task,
      message: 'Task started'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start task';
    res.status(400).json({
      success: false,
      error: message
    });
  }
}));

// POST /api/tasks/:id/complete - Complete task
router.post('/:id/complete', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { completionProof } = req.body;

  const task = await completeTask(id, completionProof);

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task not found'
    });
    return;
  }

  res.json({
    success: true,
    data: task,
    message: 'Task completed'
  });
}));

// POST /api/tasks/:id/block - Block task
router.post('/:id/block', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const task = await blockTask(id, reason || 'No reason provided');

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task not found'
    });
    return;
  }

  res.json({
    success: true,
    data: task,
    message: 'Task blocked'
  });
}));

// POST /api/tasks/:id/unblock - Unblock task
router.post('/:id/unblock', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const task = await unblockTask(id);

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task not found or not blocked'
    });
    return;
  }

  res.json({
    success: true,
    data: task,
    message: 'Task unblocked'
  });
}));

// POST /api/tasks/:id/review - Move to review
router.post('/:id/review', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { completionProof } = req.body;

  const task = await moveToReview(id, completionProof);

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task not found or not in progress'
    });
    return;
  }

  res.json({
    success: true,
    data: task,
    message: 'Task moved to review'
  });
}));

// POST /api/tasks/:id/assign - Assign task
router.post('/:id/assign', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { assigneeId, assigneeName } = req.body;

  if (!assigneeId || !assigneeName) {
    res.status(400).json({
      success: false,
      error: 'assigneeId and assigneeName required'
    });
    return;
  }

  const task = await assignTask(id, assigneeId, assigneeName);

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task not found'
    });
    return;
  }

  res.json({
    success: true,
    data: task,
    message: 'Task assigned'
  });
}));

// POST /api/tasks/:id/comment - Add comment
router.post('/:id/comment', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const validationResult = addCommentSchema.safeParse(req.body);

  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationResult.error.errors
    });
    return;
  }

  const task = await addComment(id, validationResult.data);

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task not found'
    });
    return;
  }

  res.status(201).json({
    success: true,
    data: task,
    message: 'Comment added'
  });
}));

// PATCH /api/tasks/:id/comment/:commentId - Update comment
router.patch('/:id/comment/:commentId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id, commentId } = req.params;
  const { content } = req.body;

  if (!content) {
    res.status(400).json({
      success: false,
      error: 'Content required'
    });
    return;
  }

  const task = await updateComment(id, commentId, content);

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task or comment not found'
    });
    return;
  }

  res.json({
    success: true,
    data: task,
    message: 'Comment updated'
  });
}));

// DELETE /api/tasks/:id/comment/:commentId - Delete comment
router.delete('/:id/comment/:commentId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id, commentId } = req.params;

  const task = await deleteComment(id, commentId);

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task or comment not found'
    });
    return;
  }

  res.json({
    success: true,
    data: task,
    message: 'Comment deleted'
  });
}));

// POST /api/tasks/:id/subtask - Add subtask
router.post('/:id/subtask', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const validationResult = addSubtaskSchema.safeParse(req.body);

  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationResult.error.errors
    });
    return;
  }

  const task = await addSubtask(id, validationResult.data.title);

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task not found'
    });
    return;
  }

  res.status(201).json({
    success: true,
    data: task,
    message: 'Subtask added'
  });
}));

// PATCH /api/tasks/:id/subtask/:subtaskId - Toggle subtask
router.patch('/:id/subtask/:subtaskId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id, subtaskId } = req.params;

  const task = await toggleSubtask(id, subtaskId);

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task or subtask not found'
    });
    return;
  }

  res.json({
    success: true,
    data: task,
    message: 'Subtask toggled'
  });
}));

// DELETE /api/tasks/:id/subtask/:subtaskId - Delete subtask
router.delete('/:id/subtask/:subtaskId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id, subtaskId } = req.params;

  const task = await deleteSubtask(id, subtaskId);

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task or subtask not found'
    });
    return;
  }

  res.json({
    success: true,
    data: task,
    message: 'Subtask deleted'
  });
}));

// POST /api/tasks/bulk-update - Bulk update tasks
router.post('/bulk-update', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validationResult = bulkUpdateSchema.safeParse(req.body);

  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationResult.error.errors
    });
    return;
  }

  const { taskIds, updates } = validationResult.data;
  const count = await bulkUpdateTasks(taskIds, updates);

  res.json({
    success: true,
    data: { updated: count },
    message: `${count} tasks updated`
  });
}));

export default router;
