/**
 * Onboarding Routes - API endpoints
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { onboardingService } from '../services/onboardingService';
import { checklistService } from '../services/checklistService';
import { logger } from 'utils/logger.js';

const router = Router();

// Validation schemas
const createOnboardingSchema = z.object({
  customerId: z.string().min(1),
  type: z.enum(['standard', 'enterprise', 'agency', 'publisher', 'creator']),
  dueDate: z.string().datetime().or(z.date()),
  assignedTo: z.string().optional(),
});

const updateProgressSchema = z.object({
  action: z.enum(['start', 'complete', 'skip']),
  completedBy: z.string().min(1),
  notes: z.string().optional(),
});

// POST /api/onboarding - Create new onboarding
router.post('/', async (req: Request, res: Response) => {
  try {
    const parseResult = createOnboardingSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parseResult.error.errors,
      });
      return;
    }

    const data = parseResult.data;
    const onboarding = await onboardingService.createOnboarding({
      customerId: data.customerId,
      type: data.type,
      dueDate: new Date(data.dueDate),
      assignedTo: data.assignedTo,
    });

    res.status(201).json({
      success: true,
      data: onboarding,
    });
  } catch (error) {
    logger.error('Error creating onboarding', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// GET /api/onboarding/:id - Get onboarding by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const onboarding = await onboardingService.getOnboarding(req.params.id);

    if (!onboarding) {
      res.status(404).json({
        success: false,
        error: 'Onboarding not found',
      });
      return;
    }

    res.json({
      success: true,
      data: onboarding,
    });
  } catch (error) {
    logger.error('Error getting onboarding', { error, params: req.params });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// PUT /api/onboarding/:id - Update onboarding
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { status, assignedTo, dueDate } = req.body;
    const updates: Record<string, unknown> = {};

    if (status) updates.status = status;
    if (assignedTo) updates.assignedTo = assignedTo;
    if (dueDate) updates.dueDate = new Date(dueDate);

    const onboarding = await onboardingService.updateOnboarding(req.params.id, updates as any);

    if (!onboarding) {
      res.status(404).json({
        success: false,
        error: 'Onboarding not found',
      });
      return;
    }

    res.json({
      success: true,
      data: onboarding,
    });
  } catch (error) {
    logger.error('Error updating onboarding', { error, params: req.params });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/onboarding/:id/progress - Update task progress
router.post('/:id/progress', async (req: Request, res: Response) => {
  try {
    const { taskId, action, completedBy, notes } = req.body;

    if (!taskId || !action || !completedBy) {
      res.status(400).json({
        success: false,
        error: 'taskId, action, and completedBy are required',
      });
      return;
    }

    const parseResult = updateProgressSchema.safeParse({ action, completedBy, notes });
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parseResult.error.errors,
      });
      return;
    }

    const result = await onboardingService.updateProgress(
      req.params.id,
      taskId,
      action,
      completedBy,
      notes
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error updating progress', { error, params: req.params });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// GET /api/onboarding/:id/checklist - Get checklist for onboarding
router.get('/:id/checklist', async (req: Request, res: Response) => {
  try {
    const checklist = await onboardingService.getChecklist(req.params.id);

    res.json({
      success: true,
      data: checklist,
    });
  } catch (error) {
    logger.error('Error getting checklist', { error, params: req.params });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// GET /api/onboarding - Get all onboardings
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      assignedTo: req.query.assignedTo as string,
      type: req.query.type as string,
    };

    const onboardings = await onboardingService.getAllOnboardings(filters);

    res.json({
      success: true,
      data: {
        count: onboardings.length,
        onboardings,
      },
    });
  } catch (error) {
    logger.error('Error getting onboardings', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;