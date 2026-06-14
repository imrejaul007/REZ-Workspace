import { Router, Response } from 'express';
import {
  predictDelay,
  detectRisks,
  forecastDelivery,
  detectBottlenecks,
  getEmployeeProductivity
} from '../services/aiIntelligence.js';
import { getProject, getProjects } from '../services/projectService.js';
import { asyncHandler, AuthenticatedRequest } from '../middleware/index.js';

const router = Router();

// GET /api/analytics/delay-prediction/:projectId - AI delay prediction
router.get('/delay-prediction/:projectId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = req.params;

  const project = await getProject(projectId);
  if (!project) {
    res.status(404).json({
      success: false,
      error: 'Project not found'
    });
    return;
  }

  const prediction = await predictDelay(projectId);

  res.json({
    success: true,
    data: prediction
  });
}));

// GET /api/analytics/risks/:projectId - Get project risks
router.get('/risks/:projectId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = req.params;

  const risks = await detectRisks(projectId);

  res.json({
    success: true,
    data: risks
  });
}));

// GET /api/analytics/bottlenecks - Team bottlenecks
router.get('/bottlenecks', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { departmentId } = req.query;

  const bottlenecks = await detectBottlenecks(departmentId as string | undefined);

  res.json({
    success: true,
    data: bottlenecks
  });
}));

// GET /api/analytics/delivery-forecast/:projectId - Delivery forecast
router.get('/delivery-forecast/:projectId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = req.params;

  const project = await getProject(projectId);
  if (!project) {
    res.status(404).json({
      success: false,
      error: 'Project not found'
    });
    return;
  }

  const forecast = await forecastDelivery(projectId);

  res.json({
    success: true,
    data: forecast
  });
}));

// GET /api/analytics/productivity/:employeeId - Employee productivity
router.get('/productivity/:employeeId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { employeeId } = req.params;

  const productivity = await getEmployeeProductivity(employeeId);

  res.json({
    success: true,
    data: productivity
  });
}));

// GET /api/analytics/portfolio - Portfolio overview
router.get('/portfolio', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { managerId } = req.query;

  const query: Record<string, unknown> = {};
  if (managerId) query.managerId = managerId;

  const projects = await getProjects(query, 1, 100);

  // Calculate portfolio metrics
  const totalProjects = projects.projects.length;
  const activeProjects = projects.projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.projects.filter(p => p.status === 'completed').length;
  const atRiskProjects = projects.projects.filter(p => p.health < 60).length;

  const totalBudget = projects.projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.projects.reduce((sum, p) => sum + p.spentAmount, 0);
  const avgHealth = totalProjects > 0
    ? Math.round(projects.projects.reduce((sum, p) => sum + p.health, 0) / totalProjects)
    : 0;

  // Status breakdown
  const statusBreakdown = projects.projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Health distribution
  const healthDistribution = {
    healthy: projects.projects.filter(p => p.health >= 80).length,
    moderate: projects.projects.filter(p => p.health >= 50 && p.health < 80).length,
    atRisk: projects.projects.filter(p => p.health < 50).length
  };

  res.json({
    success: true,
    data: {
      overview: {
        totalProjects,
        activeProjects,
        completedProjects,
        atRiskProjects,
        totalBudget,
        totalSpent,
        budgetUtilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
        averageHealth: avgHealth
      },
      statusBreakdown,
      healthDistribution,
      projects: projects.projects.slice(0, 10).map(p => ({
        projectId: p.projectId,
        name: p.name,
        status: p.status,
        health: p.health,
        completionPercentage: p.completionPercentage,
        budget: p.budget,
        spentAmount: p.spentAmount,
        endDate: p.endDate
      }))
    }
  });
}));

// GET /api/analytics/trends - Project trends over time
router.get('/trends', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { projectId, weeks = '8' } = req.query;

  const numWeeks = parseInt(weeks as string, 10);

  // For this implementation, we'll generate synthetic trend data
  // In production, this would query historical snapshots
  const trends: {
    week: string;
    completedTasks: number;
    addedTasks: number;
    health: number;
  }[] = [];

  const now = new Date();

  for (let i = numWeeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Synthetic data - in production, calculate from actual data
    trends.push({
      week: weekStart.toISOString().split('T')[0],
      completedTasks: Math.floor(Math.random() * 10) + 2,
      addedTasks: Math.floor(Math.random() * 8) + 1,
      health: Math.max(0, Math.min(100, 70 + Math.floor(Math.random() * 20)))
    });
  }

  res.json({
    success: true,
    data: {
      projectId: projectId as string || 'all',
      weeks: numWeeks,
      trends
    }
  });
}));

// GET /api/analytics/team-performance - Team performance metrics
router.get('/team-performance', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { departmentId } = req.query;

  // Get all active projects
  const query: Record<string, unknown> = { status: 'active' };
  if (departmentId) query.departmentId = departmentId;

  const { projects } = await getProjects(query, 1, 100);

  // Aggregate team member performance
  const teamMetrics: Record<string, {
    employeeId: string;
    employeeName: string;
    tasksCompleted: number;
    tasksInProgress: number;
    tasksOverdue: number;
    utilization: number;
  }> = {};

  for (const project of projects) {
    for (const memberId of project.teamMembers) {
      if (!teamMetrics[memberId]) {
        teamMetrics[memberId] = {
          employeeId: memberId,
          employeeName: memberId,
          tasksCompleted: 0,
          tasksInProgress: 0,
          tasksOverdue: 0,
          utilization: 0
        };
      }
    }
  }

  res.json({
    success: true,
    data: {
      totalTeamMembers: Object.keys(teamMetrics).length,
      totalActiveProjects: projects.length,
      teamMetrics: Object.values(teamMetrics)
    }
  });
}));

export default router;
