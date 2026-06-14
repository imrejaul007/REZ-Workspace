import { Router, Request, Response } from 'express';
import { timeEntryService } from '../services/time-entry.service';
import { ApiResponse, TimeEntry, ActiveTimer } from '../types';

const router = Router();

const getTenantId = (req: Request): string => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  return tenantId;
};

const getUserId = (req: Request): string => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    throw new Error('User ID is required');
  }
  return userId;
};

// Start timer
router.post('/timer/start', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const timer = await timeEntryService.startTimer(tenantId, userId, req.body);
    const response: ApiResponse<ActiveTimer> = {
      success: true,
      data: timer,
      message: 'Timer started',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start timer',
    };
    res.status(400).json(response);
  }
});

// Stop timer
router.post('/timer/stop', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const entry = await timeEntryService.stopTimer(tenantId, userId);
    if (!entry) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'No active timer found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<TimeEntry> = {
      success: true,
      data: entry,
      message: 'Timer stopped',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop timer',
    };
    res.status(400).json(response);
  }
});

// Get active timer
router.get('/timer/active', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const timer = await timeEntryService.getActiveTimer(tenantId, userId);
    const response: ApiResponse<ActiveTimer | null> = {
      success: true,
      data: timer,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get timer',
    };
    res.status(500).json(response);
  }
});

// Create manual time entry
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const entry = await timeEntryService.create(tenantId, userId, req.body);
    const response: ApiResponse<TimeEntry> = {
      success: true,
      data: entry,
      message: 'Time entry created',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create time entry',
    };
    res.status(400).json(response);
  }
});

// Get all time entries
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.query.userId as string | undefined;
    const projectId = req.query.projectId as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const billableOnly = req.query.billableOnly === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

    const entries = await timeEntryService.findAll(tenantId, {
      userId,
      projectId,
      startDate,
      endDate,
      billableOnly,
      limit,
      offset,
    });

    const response: ApiResponse<TimeEntry[]> = {
      success: true,
      data: entries,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch entries',
    };
    res.status(500).json(response);
  }
});

// Get time entry by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const entry = await timeEntryService.findById(tenantId, req.params.id);
    if (!entry) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Time entry not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<TimeEntry> = {
      success: true,
      data: entry,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch entry',
    };
    res.status(500).json(response);
  }
});

// Update time entry
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const entry = await timeEntryService.update(tenantId, req.params.id, userId, req.body);
    if (!entry) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Time entry not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<TimeEntry> = {
      success: true,
      data: entry,
      message: 'Time entry updated',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update entry',
    };
    res.status(400).json(response);
  }
});

// Delete time entry
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const deleted = await timeEntryService.delete(tenantId, req.params.id);
    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Time entry not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<null> = {
      success: true,
      message: 'Time entry deleted',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete entry',
    };
    res.status(500).json(response);
  }
});

// Get total time for user
router.get('/user/:userId/total', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const totals = await timeEntryService.getTotalTime(tenantId, req.params.userId, {
      startDate,
      endDate,
    });

    const response: ApiResponse<typeof totals> = {
      success: true,
      data: totals,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get totals',
    };
    res.status(500).json(response);
  }
});

export default router;
