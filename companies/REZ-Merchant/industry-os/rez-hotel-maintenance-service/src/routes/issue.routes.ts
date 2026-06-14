/**
 * Issue Routes
 *
 * Maintenance issue management endpoints
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { MaintenanceIssue, MaintenanceLog } from '../models/MaintenanceIssue';

const router = Router();

// Validation schemas
const CreateIssueSchema = z.object({
  hotelId: z.string().min(1),
  roomId: z.string().min(1),
  roomNumber: z.string().min(1),
  category: z.enum(['plumbing', 'electrical', 'hvac', 'furniture', 'appliances', 'structural', 'cleaning', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  reportedBy: z.string().min(1),
  images: z.array(z.string()).optional(),
});

const UpdateIssueSchema = z.object({
  status: z.enum(['open', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  resolution: z.string().optional(),
});

const AddLogSchema = z.object({
  action: z.string().min(1),
  performedBy: z.string().min(1),
  notes: z.string().optional(),
});

// GET /api/issues - List issues
router.get('/', async (req: Request, res: Response) => {
  try {
    const { hotelId, roomId, status, priority, category } = req.query;
    const filter: any = {};

    if (hotelId) filter.hotelId = hotelId;
    if (roomId) filter.roomId = roomId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const issues = await MaintenanceIssue.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      data: { issues },
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get issues' },
    });
  }
});

// GET /api/issues/:issueId - Get single issue
router.get('/:issueId', async (req: Request, res: Response) => {
  try {
    const issue = await MaintenanceIssue.findOne({ issueId: req.params.issueId }).lean();

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Issue not found' },
      });
    }

    const logs = await MaintenanceLog.find({ issueId: req.params.issueId })
      .sort({ timestamp: 1 })
      .lean();

    res.json({
      success: true,
      data: { issue, logs },
    });
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get issue' },
    });
  }
});

// POST /api/issues - Create issue
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = CreateIssueSchema.parse(req.body);

    const issue = {
      issueId: `MI${Date.now().toString(36).toUpperCase()}`,
      ...validated,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await MaintenanceIssue.create(issue);

    res.status(201).json({
      success: true,
      data: { issue },
      message: 'Maintenance issue created',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors },
      });
    }
    console.error('Create issue error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to create issue' },
    });
  }
});

// PUT /api/issues/:issueId - Update issue
router.put('/:issueId', async (req: Request, res: Response) => {
  try {
    const validated = UpdateIssueSchema.parse(req.body);

    const issue = await MaintenanceIssue.findOneAndUpdate(
      { issueId: req.params.issueId },
      { $set: { ...validated, updatedAt: new Date() } },
      { new: true }
    ).lean();

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Issue not found' },
      });
    }

    res.json({
      success: true,
      data: { issue },
      message: 'Issue updated',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors },
      });
    }
    console.error('Update issue error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to update issue' },
    });
  }
});

// POST /api/issues/:issueId/logs - Add log entry
router.post('/:issueId/logs', async (req: Request, res: Response) => {
  try {
    const validated = AddLogSchema.parse(req.body);

    const log = {
      logId: `ML${Date.now().toString(36).toUpperCase()}`,
      issueId: req.params.issueId,
      ...validated,
      timestamp: new Date(),
    };

    await MaintenanceLog.create(log);

    res.status(201).json({
      success: true,
      data: { log },
      message: 'Log entry added',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors },
      });
    }
    console.error('Add log error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to add log' },
    });
  }
});

// PATCH /api/issues/:issueId/assign - Assign issue
router.patch('/:issueId/assign', async (req: Request, res: Response) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'assignedTo is required' },
      });
    }

    const issue = await MaintenanceIssue.findOneAndUpdate(
      { issueId: req.params.issueId },
      {
        $set: {
          assignedTo,
          status: 'assigned',
          updatedAt: new Date(),
        },
      },
      { new: true }
    ).lean();

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Issue not found' },
      });
    }

    // Add log entry
    await MaintenanceLog.create({
      logId: `ML${Date.now().toString(36).toUpperCase()}`,
      issueId: req.params.issueId,
      action: `Assigned to ${assignedTo}`,
      performedBy: 'system',
      timestamp: new Date(),
    });

    res.json({
      success: true,
      data: { issue },
      message: 'Issue assigned',
    });
  } catch (error) {
    console.error('Assign issue error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to assign issue' },
    });
  }
});

// PATCH /api/issues/:issueId/complete - Complete issue
router.patch('/:issueId/complete', async (req: Request, res: Response) => {
  try {
    const { resolution, performedBy } = req.body;

    const issue = await MaintenanceIssue.findOneAndUpdate(
      { issueId: req.params.issueId },
      {
        $set: {
          status: 'completed',
          resolution: resolution || 'Completed',
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { new: true }
    ).lean();

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Issue not found' },
      });
    }

    // Add log entry
    await MaintenanceLog.create({
      logId: `ML${Date.now().toString(36).toUpperCase()}`,
      issueId: req.params.issueId,
      action: `Completed: ${resolution || 'Issue resolved'}`,
      performedBy: performedBy || 'system',
      timestamp: new Date(),
    });

    res.json({
      success: true,
      data: { issue },
      message: 'Issue completed',
    });
  } catch (error) {
    console.error('Complete issue error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to complete issue' },
    });
  }
});

// GET /api/issues/stats/:hotelId - Get statistics
router.get('/stats/:hotelId', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;

    const issues = await MaintenanceIssue.find({ hotelId }).lean();

    const stats = {
      total: issues.length,
      open: issues.filter(i => i.status === 'open').length,
      assigned: issues.filter(i => i.status === 'assigned').length,
      inProgress: issues.filter(i => i.status === 'in_progress').length,
      completed: issues.filter(i => i.status === 'completed').length,
      byPriority: {
        low: issues.filter(i => i.priority === 'low').length,
        medium: issues.filter(i => i.priority === 'medium').length,
        high: issues.filter(i => i.priority === 'high').length,
        urgent: issues.filter(i => i.priority === 'urgent').length,
      },
      byCategory: {} as Record<string, number>,
    };

    issues.forEach(i => {
      if (!stats.byCategory[i.category]) stats.byCategory[i.category] = 0;
      stats.byCategory[i.category]++;
    });

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get stats' },
    });
  }
});

export default router;
