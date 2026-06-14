import { Router, Response } from 'express';
import { z } from 'zod';
import { Sprint, Task } from '../models/index.js';
import {
  createSprint,
  startSprint,
  completeSprint
} from '../services/projectService.js';
import { asyncHandler, AuthenticatedRequest } from '../middleware/index.js';

const router = Router();

// Validation schemas
const createSprintSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(100),
  goal: z.string().max(500).optional().default(''),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date())
});

// GET /api/sprints - List sprints
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { projectId, status, page = '1', limit = '20' } = req.query;

  const query: Record<string, unknown> = {};
  if (projectId) query.projectId = projectId;
  if (status) query.status = status;

  const pageNum = parseInt(page as string, 10);
  const limitNum = Math.min(parseInt(limit as string, 10), 50);

  const [sprints, total] = await Promise.all([
    Sprint.find(query)
      .sort({ startDate: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Sprint.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: sprints,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
}));

// GET /api/sprints/:id - Get sprint with tasks
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const sprint = await Sprint.findOne({ sprintId: id });

  if (!sprint) {
    res.status(404).json({
      success: false,
      error: 'Sprint not found'
    });
    return;
  }

  // Get tasks for this sprint
  const tasks = await Task.find({ sprintId: id })
    .sort({ priority: 1, dueDate: 1 });

  // Calculate burndown data
  const burndownData = await calculateBurndown(sprint);

  res.json({
    success: true,
    data: {
      ...sprint.toObject(),
      tasks,
      burndownData
    }
  });
}));

// POST /api/sprints - Create sprint
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validationResult = createSprintSchema.safeParse(req.body);

  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationResult.error.errors
    });
    return;
  }

  const data = validationResult.data;
  const sprint = await createSprint({
    projectId: data.projectId,
    name: data.name,
    goal: data.goal,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate)
  });

  res.status(201).json({
    success: true,
    data: sprint,
    message: 'Sprint created successfully'
  });
}));

// PATCH /api/sprints/:id - Update sprint
router.patch('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const sprint = await Sprint.findOneAndUpdate(
    { sprintId: id },
    { $set: updates },
    { new: true }
  );

  if (!sprint) {
    res.status(404).json({
      success: false,
      error: 'Sprint not found'
    });
    return;
  }

  res.json({
    success: true,
    data: sprint,
    message: 'Sprint updated successfully'
  });
}));

// POST /api/sprints/:id/start - Start sprint
router.post('/:id/start', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const sprint = await startSprint(id);

  if (!sprint) {
    res.status(404).json({
      success: false,
      error: 'Sprint not found or already started'
    });
    return;
  }

  res.json({
    success: true,
    data: sprint,
    message: 'Sprint started'
  });
}));

// POST /api/sprints/:id/complete - Complete sprint
router.post('/:id/complete', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const sprint = await completeSprint(id);

  if (!sprint) {
    res.status(404).json({
      success: false,
      error: 'Sprint not found'
    });
    return;
  }

  res.json({
    success: true,
    data: sprint,
    message: 'Sprint completed'
  });
}));

// GET /api/sprints/:id/burndown - Get burndown chart data
router.get('/:id/burndown', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const sprint = await Sprint.findOne({ sprintId: id });

  if (!sprint) {
    res.status(404).json({
      success: false,
      error: 'Sprint not found'
    });
    return;
  }

  const burndownData = await calculateBurndown(sprint);

  res.json({
    success: true,
    data: burndownData
  });
}));

// GET /api/sprints/:id/velocity - Get velocity chart data
router.get('/:id/velocity', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const sprint = await Sprint.findOne({ sprintId: id });

  if (!sprint) {
    res.status(404).json({
      success: false,
      error: 'Sprint not found'
    });
    return;
  }

  // Get historical sprints for velocity comparison
  const historicalSprints = await Sprint.find({
    projectId: sprint.projectId,
    status: 'completed',
    velocity: { $gt: 0 }
  })
    .sort({ endDate: -1 })
    .limit(5);

  const velocityData = historicalSprints.map(s => ({
    sprintId: s.sprintId,
    name: s.name,
    velocity: s.velocity,
    plannedPoints: s.plannedPoints,
    completedPoints: s.completedPoints
  }));

  res.json({
    success: true,
    data: {
      currentSprint: {
        sprintId: sprint.sprintId,
        name: sprint.name,
        plannedPoints: sprint.plannedPoints,
        completedPoints: sprint.completedPoints
      },
      historical: velocityData.reverse()
    }
  });
}));

// Helper function to calculate burndown data
async function calculateBurndown(sprint: InstanceType<typeof Sprint>) {
  const startDate = new Date(sprint.startDate);
  const endDate = new Date(sprint.endDate);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalPoints = sprint.plannedPoints || 0;

  // Get completed tasks by date
  const tasks = await Task.find({
    sprintId: sprint.sprintId
  });

  const completedByDate: Record<string, number> = {};

  for (const task of tasks.filter(t => t.completionDate)) {
    const dateKey = new Date(task.completionDate!).toISOString().split('T')[0];
    completedByDate[dateKey] = (completedByDate[dateKey] || 0) + (task.storyPoints || 0);
  }

  // Build burndown data
  const burndownData: { date: string; ideal: number; actual: number | undefined }[] = [];
  const now = new Date();

  for (let i = 0; i <= totalDays; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateKey = currentDate.toISOString().split('T')[0];

    const idealRemaining = totalPoints - (totalPoints / totalDays) * i;
    let actualRemaining: number = totalPoints;

    if (currentDate <= now) {
      // Sum up completed points up to this date
      for (const [date, points] of Object.entries(completedByDate)) {
        if (date <= dateKey && points !== undefined) {
          actualRemaining -= points;
        }
      }
      actualRemaining = Math.max(0, actualRemaining);
    }

    burndownData.push({
      date: dateKey,
      ideal: Math.round(idealRemaining * 10) / 10,
      actual: sprint.status !== 'active' ? actualRemaining : (i < totalDays ? actualRemaining : undefined)
    });
  }

  return {
    totalPoints,
    totalDays,
    startDate: sprint.startDate.toISOString().split('T')[0],
    endDate: sprint.endDate.toISOString().split('T')[0],
    data: burndownData
  };
}

export default router;
