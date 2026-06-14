/**
 * Analytics Routes - Express routes for analytics operations
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { analyticsService } from '../services/analyticsService';
import { Dashboard } from '../models/Dashboard';
import logger from '../utils/logger';

export const analyticsRoutes = Router();

// Validation schemas
const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

const createDashboardSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  ownerType: z.enum(['team', 'agent', 'admin']),
  teamId: z.string().optional(),
  isDefault: z.boolean().optional(),
  widgets: z.array(z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    config: z.record(z.unknown()),
    position: z.object({
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number(),
    }),
  })).optional(),
  filters: z.object({
    dateRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }),
    teams: z.array(z.string()).optional(),
    agents: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
  }).optional(),
});

const updateDashboardSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  widgets: z.array(z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    config: z.record(z.unknown()),
    position: z.object({
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number(),
    }),
  })).optional(),
  filters: z.object({
    dateRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }),
    teams: z.array(z.string()).optional(),
    agents: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * GET /api/analytics/overview
 * Get analytics overview
 */
analyticsRoutes.get('/overview', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const overview = await analyticsService.getOverview(start, end);
    res.json({ success: true, data: overview });
  } catch (error) {
    logger.error('Failed to get overview', { error });
    res.status(500).json({ success: false, error: 'Failed to get analytics overview' });
  }
});

/**
 * GET /api/analytics/team/:teamId
 * Get team analytics
 */
analyticsRoutes.get('/team/:teamId', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const { teamId } = req.params;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const teamStats = await analyticsService.getTeamAnalytics(teamId, start, end);
    res.json({ success: true, data: teamStats });
  } catch (error) {
    logger.error('Failed to get team analytics', { error, teamId: req.params.teamId });
    res.status(500).json({ success: false, error: 'Failed to get team analytics' });
  }
});

/**
 * GET /api/analytics/agent/:agentId
 * Get agent analytics
 */
analyticsRoutes.get('/agent/:agentId', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const { agentId } = req.params;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const agentStats = await analyticsService.getAgentAnalytics(agentId, start, end);
    res.json({ success: true, data: agentStats });
  } catch (error) {
    logger.error('Failed to get agent analytics', { error, agentId: req.params.agentId });
    res.status(500).json({ success: false, error: 'Failed to get agent analytics' });
  }
});

/**
 * GET /api/analytics/trends
 * Get trend data
 */
analyticsRoutes.get('/trends', async (req: Request, res: Response) => {
  try {
    const { metric, startDate, endDate, granularity = 'daily' } = req.query;

    if (!metric) {
      res.status(400).json({ success: false, error: 'Metric name is required' });
      return;
    }

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const trends = await analyticsService.getTrends(
      metric as string,
      start,
      end,
      granularity as 'daily' | 'weekly' | 'monthly'
    );
    res.json({ success: true, data: trends });
  } catch (error) {
    logger.error('Failed to get trends', { error });
    res.status(500).json({ success: false, error: 'Failed to get trends' });
  }
});

/**
 * GET /api/analytics/dashboard
 * Get dashboards for owner
 */
analyticsRoutes.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { ownerId, ownerType = 'admin' } = req.query;

    if (!ownerId) {
      res.status(400).json({ success: false, error: 'ownerId is required' });
      return;
    }

    const dashboards = await analyticsService.getDashboards(
      ownerId as string,
      ownerType as 'team' | 'agent' | 'admin'
    );
    res.json({ success: true, data: dashboards });
  } catch (error) {
    logger.error('Failed to get dashboards', { error });
    res.status(500).json({ success: false, error: 'Failed to get dashboards' });
  }
});

/**
 * GET /api/analytics/dashboard/:id
 * Get dashboard by ID
 */
analyticsRoutes.get('/dashboard/:id', async (req: Request, res: Response) => {
  try {
    const dashboard = await analyticsService.getDashboard(req.params.id);
    if (!dashboard) {
      res.status(404).json({ success: false, error: 'Dashboard not found' });
      return;
    }
    res.json({ success: true, data: dashboard });
  } catch (error) {
    logger.error('Failed to get dashboard', { error, dashboardId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to get dashboard' });
  }
});

/**
 * POST /api/analytics/dashboard
 * Create a new dashboard
 */
analyticsRoutes.post('/dashboard', async (req: Request, res: Response) => {
  try {
    const validated = createDashboardSchema.parse(req.body);
    validated.ownerId = req.body.ownerId || 'system';
    const dashboard = await analyticsService.createDashboard(validated);
    res.status(201).json({ success: true, data: dashboard });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      return;
    }
    logger.error('Failed to create dashboard', { error });
    res.status(500).json({ success: false, error: 'Failed to create dashboard' });
  }
});

/**
 * PUT /api/analytics/dashboard/:id
 * Update dashboard
 */
analyticsRoutes.put('/dashboard/:id', async (req: Request, res: Response) => {
  try {
    const validated = updateDashboardSchema.parse(req.body);
    const dashboard = await analyticsService.updateDashboard(req.params.id, validated);
    if (!dashboard) {
      res.status(404).json({ success: false, error: 'Dashboard not found' });
      return;
    }
    res.json({ success: true, data: dashboard });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      return;
    }
    logger.error('Failed to update dashboard', { error, dashboardId: req.params.id });
    res.status(500).json({ success: false, error: 'Failed to update dashboard' });
  }
});

/**
 * GET /api/analytics/metrics
 * Get aggregated metrics
 */
analyticsRoutes.get('/metrics', async (req: Request, res: Response) => {
  try {
    const { type, dimension, dimensionValue, period = 'daily' } = req.query;

    const query: Record<string, unknown> = {};
    if (type) query.type = type;
    if (dimension) query.dimension = dimension;
    if (dimensionValue) query.dimensionValue = dimensionValue;

    const { Analytics } = await import('../models/Analytics');
    const analytics = await Analytics.find(query).sort({ periodStart: -1 }).limit(100).exec();
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('Failed to get metrics', { error });
    res.status(500).json({ success: false, error: 'Failed to get metrics' });
  }
});

export default analyticsRoutes;