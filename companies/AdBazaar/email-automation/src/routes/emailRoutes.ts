import { Router, Response } from 'express';
import { z } from 'zod';
import { emailService } from '../services/EmailService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

const createSequenceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  trigger: z.object({
    type: z.enum(['campaign_signup', 'trial_start', 'purchase', 'manual', 'segment']),
    conditions: z.record(z.unknown()).optional(),
  }),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateSequenceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const addStepSchema = z.object({
  name: z.string().min(1),
  emailSubject: z.string().min(1),
  emailBody: z.string().min(1),
  delayDays: z.number().min(0).optional(),
  delayHours: z.number().min(0).optional(),
  conditions: z.object({
    action: z.enum(['opened', 'clicked', 'replied', 'bounced']).optional(),
    waitDays: z.number().optional(),
    skipIf: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const enrollSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  variables: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

router.post('/sequences', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createSequenceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const sequence = await emailService.createSequence({
      ...parsed.data,
      ownerId: req.userId!,
    });

    res.status(201).json(sequence);
  } catch (error) {
    logger.error('Error creating sequence', { error });
    res.status(500).json({ error: 'Failed to create sequence' });
  }
});

router.get('/sequences', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, tags, page = '1', limit = '50' } = req.query;
    const result = await emailService.getSequencesByOwner(req.userId!, {
      status: status as string,
      tags: tags ? (tags as string).split(',') : undefined,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });

    res.json({
      sequences: result.sequences,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total: result.total,
      },
    });
  } catch (error) {
    logger.error('Error fetching sequences', { error });
    res.status(500).json({ error: 'Failed to fetch sequences' });
  }
});

router.get('/sequences/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sequence = await emailService.getSequence(req.params.id);
    if (!sequence) {
      res.status(404).json({ error: 'Sequence not found' });
      return;
    }
    res.json(sequence);
  } catch (error) {
    logger.error('Error fetching sequence', { error });
    res.status(500).json({ error: 'Failed to fetch sequence' });
  }
});

router.put('/sequences/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = updateSequenceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const sequence = await emailService.updateSequence(req.params.id, parsed.data);
    if (!sequence) {
      res.status(404).json({ error: 'Sequence not found' });
      return;
    }
    res.json(sequence);
  } catch (error) {
    logger.error('Error updating sequence', { error });
    res.status(500).json({ error: 'Failed to update sequence' });
  }
});

router.delete('/sequences/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await emailService.deleteSequence(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Sequence not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting sequence', { error });
    res.status(500).json({ error: 'Failed to delete sequence' });
  }
});

router.post('/sequences/:id/steps', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = addStepSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const step = await emailService.addStep(req.params.id, parsed.data);
    res.status(201).json(step);
  } catch (error) {
    logger.error('Error adding step', { error });
    res.status(500).json({ error: 'Failed to add step' });
  }
});

router.put('/sequences/:id/steps/reorder', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { stepIds } = req.body;
    if (!Array.isArray(stepIds)) {
      res.status(400).json({ error: 'stepIds must be an array' });
      return;
    }

    await emailService.reorderSteps(req.params.id, stepIds);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error reordering steps', { error });
    res.status(500).json({ error: 'Failed to reorder steps' });
  }
});

router.post('/sequences/:id/enroll', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = enrollSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const enrollment = await emailService.enrollUser({
      sequenceId: req.params.id,
      ...parsed.data,
    });

    res.status(201).json(enrollment);
  } catch (error) {
    logger.error('Error enrolling user', { error });
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/sequences/:id/enrollments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '50' } = req.query;
    const result = await emailService.getEnrollmentsBySequence(req.params.id, {
      status: status as string,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });

    res.json({
      enrollments: result.enrollments,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total: result.total,
      },
    });
  } catch (error) {
    logger.error('Error fetching enrollments', { error });
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

router.get('/sequences/:id/analytics', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analytics = await emailService.getSequenceAnalytics(req.params.id);
    res.json(analytics);
  } catch (error) {
    logger.error('Error fetching analytics', { error });
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.post('/track/:enrollmentId/:action', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { enrollmentId, action } = req.params;
    const validActions = ['opened', 'clicked', 'bounced', 'replied'];

    if (!validActions.includes(action)) {
      res.status(400).json({ error: 'Invalid action type' });
      return;
    }

    await emailService.trackEmailAction({
      enrollmentId,
      actionType: action as 'opened' | 'clicked' | 'bounced' | 'replied',
      metadata: req.body,
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error tracking email action', { error });
    res.status(500).json({ error: 'Failed to track action' });
  }
});

export default router;