import { Router, Request, Response } from 'express';
import { taskService } from '../services/task.service';
import { ApiResponse, Task } from '../types';

const router = Router();

const getTenantId = (req: Request): string => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  return tenantId;
};

// Create task
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const task = await taskService.create(tenantId, req.body);
    const response: ApiResponse<Task> = {
      success: true,
      data: task,
      message: 'Task created successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task',
    };
    res.status(400).json(response);
  }
});

// Get all tasks
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const activeOnly = req.query.activeOnly === 'true';
    const tasks = await taskService.findAll(tenantId, { activeOnly });
    const response: ApiResponse<Task[]> = {
      success: true,
      data: tasks,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tasks',
    };
    res.status(500).json(response);
  }
});

// Get tasks by project
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const activeOnly = req.query.activeOnly === 'true';
    const tasks = await taskService.findByProject(tenantId, req.params.projectId, { activeOnly });
    const response: ApiResponse<Task[]> = {
      success: true,
      data: tasks,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tasks',
    };
    res.status(500).json(response);
  }
});

// Get task by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const task = await taskService.findById(tenantId, req.params.id);
    if (!task) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Task not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<Task> = {
      success: true,
      data: task,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch task',
    };
    res.status(500).json(response);
  }
});

// Update task
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const task = await taskService.update(tenantId, req.params.id, req.body);
    if (!task) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Task not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<Task> = {
      success: true,
      data: task,
      message: 'Task updated successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update task',
    };
    res.status(400).json(response);
  }
});

// Toggle task active status
router.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { isActive } = req.body;
    const task = await taskService.toggleActive(tenantId, req.params.id, isActive);
    if (!task) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Task not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<Task> = {
      success: true,
      data: task,
      message: `Task ${isActive ? 'activated' : 'deactivated'}`,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle task',
    };
    res.status(400).json(response);
  }
});

// Delete task
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const deleted = await taskService.delete(tenantId, req.params.id);
    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Task not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<null> = {
      success: true,
      message: 'Task deleted successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete task',
    };
    res.status(500).json(response);
  }
});

export default router;
