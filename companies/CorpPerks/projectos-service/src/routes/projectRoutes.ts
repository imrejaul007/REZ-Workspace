import { Router, Response } from 'express';
import { z } from 'zod';
import {
  createProject,
  getProject,
  getProjects,
  updateProject,
  deleteProject,
  getProjectTeamUtilization,
  getProjectRisks,
  getManagerDashboard,
  createMilestone,
  getProjectMilestones,
  refreshProjectHealth
} from '../services/projectService.js';
import { asyncHandler, AuthenticatedRequest } from '../middleware/index.js';
import type { ProjectStatus, ProjectPriority } from '../types/index.js';

const router = Router();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  departmentId: z.string().min(1),
  managerId: z.string().min(1),
  teamMembers: z.array(z.string()).optional().default([]),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  budget: z.number().min(0).optional().default(0),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  tags: z.array(z.string()).optional().default([])
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  teamMembers: z.array(z.string()).optional(),
  status: z.enum(['planning', 'active', 'paused', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  budget: z.number().min(0).optional(),
  spentAmount: z.number().min(0).optional(),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  tags: z.array(z.string()).optional()
});

const createMilestoneSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().default(''),
  dueDate: z.string().datetime().or(z.date()),
  deliverables: z.array(z.string()).optional().default([])
});

// GET /api/projects - List projects
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    status,
    priority,
    departmentId,
    managerId,
    teamMemberId,
    clientId,
    search,
    startDate,
    endDate,
    page = '1',
    limit = '20'
  } = req.query;

  const filters = {
    status: status as ProjectStatus | undefined,
    priority: priority as ProjectPriority | undefined,
    departmentId: departmentId as string | undefined,
    managerId: managerId as string | undefined,
    teamMemberId: teamMemberId as string | undefined,
    clientId: clientId as string | undefined,
    search: search as string | undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined
  };

  const pageNum = parseInt(page as string, 10);
  const limitNum = Math.min(parseInt(limit as string, 10), 100);

  const { projects, total } = await getProjects(filters, pageNum, limitNum);

  res.json({
    success: true,
    data: projects,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
}));

// GET /api/projects/dashboard - Manager dashboard
router.get('/dashboard', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const managerId = req.query.managerId as string || req.user?.employeeId;

  if (!managerId) {
    res.status(400).json({
      success: false,
      error: 'Manager ID required'
    });
    return;
  }

  const dashboard = await getManagerDashboard(managerId);

  res.json({
    success: true,
    data: dashboard
  });
}));

// GET /api/projects/:id - Get project
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const project = await getProject(id);

  if (!project) {
    res.status(404).json({
      success: false,
      error: 'Project not found'
    });
    return;
  }

  res.json({
    success: true,
    data: project
  });
}));

// POST /api/projects - Create project
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validationResult = createProjectSchema.safeParse(req.body);

  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationResult.error.errors
    });
    return;
  }

  const project = await createProject(validationResult.data);

  res.status(201).json({
    success: true,
    data: project,
    message: 'Project created successfully'
  });
}));

// PATCH /api/projects/:id - Update project
router.patch('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const validationResult = updateProjectSchema.safeParse(req.body);

  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationResult.error.errors
    });
    return;
  }

  const data = validationResult.data;
  const project = await updateProject(id, {
    ...data,
    startDate: data.startDate ? new Date(data.startDate) : undefined,
    endDate: data.endDate ? new Date(data.endDate) : undefined
  });

  if (!project) {
    res.status(404).json({
      success: false,
      error: 'Project not found'
    });
    return;
  }

  res.json({
    success: true,
    data: project,
    message: 'Project updated successfully'
  });
}));

// DELETE /api/projects/:id - Delete project
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const deleted = await deleteProject(id);

  if (!deleted) {
    res.status(404).json({
      success: false,
      error: 'Project not found'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Project deleted successfully'
  });
}));

// GET /api/projects/:id/team - Get team utilization
router.get('/:id/team', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const utilization = await getProjectTeamUtilization(id);

  res.json({
    success: true,
    data: utilization
  });
}));

// GET /api/projects/:id/risks - Get AI risks
router.get('/:id/risks', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const risks = await getProjectRisks(id);

  res.json({
    success: true,
    data: risks
  });
}));

// GET /api/projects/:id/health - Refresh and get health
router.get('/:id/health', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const health = await refreshProjectHealth(id);

  res.json({
    success: true,
    data: { health }
  });
}));

// GET /api/projects/:id/milestones - Get milestones
router.get('/:id/milestones', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const milestones = await getProjectMilestones(id);

  res.json({
    success: true,
    data: milestones
  });
}));

// POST /api/projects/:id/milestones - Create milestone
router.post('/:id/milestones', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const validationResult = createMilestoneSchema.safeParse(req.body);

  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validationResult.error.errors
    });
    return;
  }

  const data = validationResult.data;
  const milestone = await createMilestone(id, {
    name: data.name,
    description: data.description,
    dueDate: new Date(data.dueDate),
    deliverables: data.deliverables
  });

  res.status(201).json({
    success: true,
    data: milestone,
    message: 'Milestone created successfully'
  });
}));

export default router;
