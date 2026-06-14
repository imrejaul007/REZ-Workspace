/**
 * Post-Mortem Router - API routes for crisis post-mortems
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { PostMortem, IPostMortem, CrisisAlert } from '../models';
import { AuthRequest } from '../middleware/auth';
import { crisisMetrics } from '../utils/metrics';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createPostMortemSchema = z.object({
  alertId: z.string().min(1),
  timeline: z
    .array(
      z.object({
        event: z.string().min(1),
        timestamp: z.string().datetime(),
        action: z.string().optional(),
      })
    )
    .min(1),
  impact: z.object({
    estimatedReach: z.number().min(0).optional(),
    sentimentShift: z.number().optional(),
    recoveryTime: z.number().min(0).optional(),
  }),
  response: z.object({
    actionsTaken: z.array(z.string()).min(1),
    effectiveness: z.string().min(1),
  }),
  learnings: z.array(z.string()).min(1),
});

const updatePostMortemSchema = z.object({
  timeline: z
    .array(
      z.object({
        event: z.string().min(1),
        timestamp: z.string().datetime(),
        action: z.string().optional(),
      })
    )
    .optional(),
  impact: z
    .object({
      estimatedReach: z.number().min(0).optional(),
      sentimentShift: z.number().optional(),
      recoveryTime: z.number().min(0).optional(),
    })
    .optional(),
  response: z
    .object({
      actionsTaken: z.array(z.string()).min(1),
      effectiveness: z.string().min(1),
    })
    .optional(),
  learnings: z.array(z.string()).optional(),
});

/**
 * GET /api/post-mortem
 * List all post-mortems
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, alertId } = req.query;

    const query: Record<string, unknown> = {};
    if (alertId) {
      query.alertId = alertId;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      PostMortem.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      PostMortem.countDocuments(query),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Failed to list post-mortems', { error });
    res.status(500).json({ success: false, error: 'Failed to list post-mortems' });
  }
});

/**
 * POST /api/post-mortem
 * Create a new post-mortem
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validation = createPostMortemSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.issues,
      });
      return;
    }

    // Verify alert exists
    const alert = await CrisisAlert.findOne({ alertId: validation.data.alertId });
    if (!alert) {
      res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
      return;
    }

    const postMortem = new PostMortem({
      postMortemId: `PM-${uuidv4().slice(0, 8).toUpperCase()}`,
      ...validation.data,
      timeline: validation.data.timeline.map((t) => ({
        ...t,
        timestamp: new Date(t.timestamp),
      })),
      createdBy: req.user?.userId || 'unknown',
    });

    await postMortem.save();

    crisisMetrics.incrementPostMortemsCreated();

    logger.info('Post-mortem created', {
      postMortemId: postMortem.postMortemId,
      alertId: postMortem.alertId,
    });

    res.status(201).json({
      success: true,
      data: postMortem,
    });
  } catch (error) {
    logger.error('Failed to create post-mortem', { error });
    res.status(500).json({ success: false, error: 'Failed to create post-mortem' });
  }
});

/**
 * GET /api/post-mortem/:id
 * Get post-mortem by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const postMortem = await PostMortem.findOne({ postMortemId: req.params.id });

    if (!postMortem) {
      res.status(404).json({ success: false, error: 'Post-mortem not found' });
      return;
    }

    // Get associated alert
    const alert = await CrisisAlert.findOne({ alertId: postMortem.alertId });

    res.json({
      success: true,
      data: {
        ...postMortem.toObject(),
        alert: alert ? { alertId: alert.alertId, title: alert.title, severity: alert.severity } : null,
      },
    });
  } catch (error) {
    logger.error('Failed to get post-mortem', { error });
    res.status(500).json({ success: false, error: 'Failed to get post-mortem' });
  }
});

/**
 * PATCH /api/post-mortem/:id
 * Update a post-mortem
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const validation = updatePostMortemSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.issues,
      });
      return;
    }

    const updateData: Record<string, unknown> = { ...validation.data };

    // Convert timestamps if timeline is being updated
    if (validation.data.timeline) {
      updateData.timeline = validation.data.timeline.map((t) => ({
        ...t,
        timestamp: new Date(t.timestamp),
      }));
    }

    const postMortem = await PostMortem.findOneAndUpdate(
      { postMortemId: req.params.id },
      { $set: updateData },
      { new: true }
    );

    if (!postMortem) {
      res.status(404).json({ success: false, error: 'Post-mortem not found' });
      return;
    }

    logger.info('Post-mortem updated', { postMortemId: postMortem.postMortemId });

    res.json({
      success: true,
      data: postMortem,
    });
  } catch (error) {
    logger.error('Failed to update post-mortem', { error });
    res.status(500).json({ success: false, error: 'Failed to update post-mortem' });
  }
});

/**
 * DELETE /api/post-mortem/:id
 * Delete a post-mortem
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await PostMortem.deleteOne({ postMortemId: req.params.id });

    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, error: 'Post-mortem not found' });
      return;
    }

    logger.info('Post-mortem deleted', { postMortemId: req.params.id });

    res.json({
      success: true,
      message: 'Post-mortem deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete post-mortem', { error });
    res.status(500).json({ success: false, error: 'Failed to delete post-mortem' });
  }
});

/**
 * GET /api/post-mortem/stats
 * Get post-mortem statistics
 */
router.get('/stats/overview', async (_req: Request, res: Response) => {
  try {
    const postMortems = await PostMortem.find({});

    const totalPostMortems = postMortems.length;

    // Calculate average recovery time
    let avgRecoveryTime = 0;
    const recoveryTimes = postMortems
      .filter((pm) => pm.impact.recoveryTime)
      .map((pm) => pm.impact.recoveryTime!);

    if (recoveryTimes.length > 0) {
      avgRecoveryTime = recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length;
    }

    // Calculate average sentiment shift
    let avgSentimentShift = 0;
    const sentimentShifts = postMortems
      .filter((pm) => pm.impact.sentimentShift !== undefined)
      .map((pm) => pm.impact.sentimentShift!);

    if (sentimentShifts.length > 0) {
      avgSentimentShift = sentimentShifts.reduce((sum, shift) => sum + shift, 0) / sentimentShifts.length;
    }

    // Top learnings
    const allLearnings = postMortems.flatMap((pm) => pm.learnings);
    const learningCounts: Record<string, number> = {};
    allLearnings.forEach((learning) => {
      const key = learning.toLowerCase();
      learningCounts[key] = (learningCounts[key] || 0) + 1;
    });

    const topLearnings = Object.entries(learningCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([learning]) => learning);

    res.json({
      success: true,
      data: {
        total: totalPostMortems,
        avgRecoveryTimeMinutes: Math.round(avgRecoveryTime),
        avgSentimentShift: Math.round(avgSentimentShift * 100) / 100,
        topLearnings,
      },
    });
  } catch (error) {
    logger.error('Failed to get post-mortem stats', { error });
    res.status(500).json({ success: false, error: 'Failed to get post-mortem stats' });
  }
});

export { router as postMortemRouter };