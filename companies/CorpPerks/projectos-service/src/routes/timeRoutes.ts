import { Router, Response } from 'express';
import { z } from 'zod';
import {
  createTimeEntry,
  getTimeEntry,
  getTimeEntries,
  getEmployeeTimeEntries,
  updateTimeEntry,
  deleteTimeEntry,
  getEmployeeTimeSummary,
  getProjectTimeSummary,
  createWorkLog,
  getEmployeeWorkLogs,
  getWorkLog,
  getTodayWorkLogs,
  checkOvertimeAlerts
} from '../services/timeService.js';
import { asyncHandler, AuthenticatedRequest } from '../middleware/index.js';

const router = Router();

// Validation schemas
const createTimeEntrySchema = z.object({
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  projectId: z.string().min(1),
  projectName: z.string().min(1),
  taskId: z.string().optional(),
  taskTitle: z.string().optional(),
  date: z.string().datetime().or(z.date()),
  hours: z.number().min(0.1).max(24),
  description: z.string().max(500).optional().default(''),
  type: z.enum(['project', 'client', 'meeting', 'admin', 'overtime']).optional().default('project')
});

const updateTimeEntrySchema = createTimeEntrySchema.partial();

const createWorkLogSchema = z.object({
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  date: z.string().datetime().or(z.date()),
  completed: z.string().min(1).max(2000),
  blockers: z.string().max(1000).optional().default(''),
  tomorrowPlan: z.string().max(1000).optional().default(''),
  tasksWorkedOn: z.array(z.object({
    taskId: z.string(),
    taskTitle: z.string(),
    status: z.string()
  })).optional().default([])
});

// ============================================================================
// TIME ENTRIES
// ============================================================================

// GET /api/time - List time entries
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    employeeId,
    projectId,
    taskId,
    type,
    startDate,
    endDate,
    page = '1',
    limit = '50'
  } = req.query;

  const filters = {
    employeeId: employeeId as string,
    projectId: projectId as string,
    taskId: taskId as string,
    type: type as z.infer<typeof createTimeEntrySchema>['type'],
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined
  };

  const pageNum = parseInt(page as string, 10);
  const limitNum = Math.min(parseInt(limit as string, 10), 100);

  const { entries, total } = await getTimeEntries(filters, pageNum, limitNum);

  res.json({
    success: true,
    data: entries,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
}));

// GET /api/time/employee/:id - Employee time entries
router.get('/employee/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  const entries = await getEmployeeTimeEntries(
    id,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );

  res.json({
    success: true,
    data: entries
  });
}));

// GET /api/time/employee/:id/summary - Employee time summary
router.get('/employee/:id/summary', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  const now = new Date();
  const start = startDate
    ? new Date(startDate as string)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endDate
    ? new Date(endDate as string)
    : now;

  const summary = await getEmployeeTimeSummary(id, start, end);

  res.json({
    success: true,
    data: summary
  });
}));

// GET /api/time/employee/:id/alerts - Check overtime alerts
router.get('/employee/:id/alerts', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const alerts = await checkOvertimeAlerts(id);

  res.json({
    success: true,
    data: alerts
  });
}));

// GET /api/time/project/:id - Project time summary
router.get('/project/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const summary = await getProjectTimeSummary(id);

  res.json({
    success: true,
    data: summary
  });
}));

// GET /api/time/entry/:id - Get single entry
router.get('/entry/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const entry = await getTimeEntry(id);

  if (!entry) {
    res.status(404).json({
      success: false,
      error: 'Time entry not found'
    });
    return;
  }

  res.json({
    success: true,
    data: entry
  });
}));

// POST /api/time - Create time entry
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validationResult = createTimeEntrySchema.safeParse(req.body);

  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationResult.error.errors
    });
    return;
  }

  const data = validationResult.data;
  const entry = await createTimeEntry({
    ...data,
    date: new Date(data.date)
  });

  res.status(201).json({
    success: true,
    data: entry,
    message: 'Time entry created'
  });
}));

// PATCH /api/time/entry/:id - Update time entry
router.patch('/entry/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const validationResult = updateTimeEntrySchema.safeParse(req.body);

  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationResult.error.errors
    });
    return;
  }

  const data = validationResult.data;
  const entry = await updateTimeEntry(id, {
    ...data,
    date: data.date ? new Date(data.date) : undefined
  });

  if (!entry) {
    res.status(404).json({
      success: false,
      error: 'Time entry not found'
    });
    return;
  }

  res.json({
    success: true,
    data: entry,
    message: 'Time entry updated'
  });
}));

// DELETE /api/time/entry/:id - Delete time entry
router.delete('/entry/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const deleted = await deleteTimeEntry(id);

  if (!deleted) {
    res.status(404).json({
      success: false,
      error: 'Time entry not found'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Time entry deleted'
  });
}));

// ============================================================================
// WORK LOGS
// ============================================================================

// GET /api/time/worklog/today - Today's work logs
router.get('/worklog/today', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const logs = await getTodayWorkLogs();

  res.json({
    success: true,
    data: logs
  });
}));

// GET /api/time/worklog/employee/:id - Employee work logs
router.get('/worklog/employee/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { limit = '30' } = req.query;

  const logs = await getEmployeeWorkLogs(id, parseInt(limit as string, 10));

  res.json({
    success: true,
    data: logs
  });
}));

// GET /api/time/worklog/employee/:id/date/:date - Get work log for specific date
router.get('/worklog/employee/:id/date/:date', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id, date } = req.params;

  const log = await getWorkLog(id, new Date(date));

  if (!log) {
    res.status(404).json({
      success: false,
      error: 'Work log not found'
    });
    return;
  }

  res.json({
    success: true,
    data: log
  });
}));

// POST /api/time/worklog - Create work log
router.post('/worklog', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validationResult = createWorkLogSchema.safeParse(req.body);

  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationResult.error.errors
    });
    return;
  }

  const data = validationResult.data;
  const log = await createWorkLog({
    employeeId: data.employeeId,
    employeeName: data.employeeName,
    date: new Date(data.date),
    completed: data.completed,
    blockers: data.blockers || '',
    tomorrowPlan: data.tomorrowPlan || '',
    tasksWorkedOn: data.tasksWorkedOn || []
  });

  res.status(201).json({
    success: true,
    data: log,
    message: 'Work log submitted'
  });
}));

export default router;
