import { Router, Response } from 'express';
import { z } from 'zod';
import { sequenceService, enrollmentService, analyticsService } from '../services';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { createChildLogger } from 'utils/logger.js';

const logger = createChildLogger('SequenceRoutes');
const router = Router();

const createSequenceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  steps: z.array(z.object({
    order: z.number(),
    type: z.enum(['email', 'notification', 'sms', 'delay', 'condition', 'webhook', 'task']),
    name: z.string(),
    config: z.object({
      templateId: z.string().optional(),
      content: z.string().optional(),
      subject: z.string().optional(),
      channel: z.string().optional(),
      delay: z.number().optional(),
      condition: z.object({
        field: z.string(),
        operator: z.string(),
        value: z.unknown()
      }).optional(),
      webhookUrl: z.string().optional(),
      webhookMethod: z.string().optional(),
      webhookHeaders: z.record(z.string()).optional()
    }),
    isActive: z.boolean().optional()
  })),
  entryCriteria: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.unknown()
  })).optional(),
  exitCriteria: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.unknown()
  })).optional(),
  settings: z.object({
    enrollmentCap: z.number().optional(),
    allowReEnrollment: z.boolean().optional(),
    trackOpens: z.boolean().optional(),
    trackClicks: z.boolean().optional(),
    goalTracking: z.boolean().optional()
  }).optional()
});

const enrollSchema = z.object({
  contactId: z.string(),
  contactEmail: z.string().email().optional(),
  contactName: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

// Create sequence
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = createSequenceSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const sequence = await sequenceService.create({
      userId: req.userId!,
      ...validation.data
    });

    res.status(201).json(sequence);
  } catch (error) {
    logger.error('Error creating sequence', { error });
    res.status(500).json({ error: 'Failed to create sequence' });
  }
});

// Get sequence by ID
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sequence = await sequenceService.findById(req.params.id);

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

// Get all sequences
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, isTemplate } = req.query;
    const sequences = await sequenceService.findByUser(req.userId!, {
      status: status as string,
      isTemplate: isTemplate === 'true'
    });

    res.json(sequences);
  } catch (error) {
    logger.error('Error fetching sequences', { error });
    res.status(500).json({ error: 'Failed to fetch sequences' });
  }
});

// Update sequence
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sequence = await sequenceService.update(req.params.id, req.body);

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

// Activate sequence
router.post('/:id/activate', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sequence = await sequenceService.updateStatus(req.params.id, 'active');

    if (!sequence) {
      res.status(404).json({ error: 'Sequence not found' });
      return;
    }

    res.json(sequence);
  } catch (error) {
    logger.error('Error activating sequence', { error });
    res.status(500).json({ error: 'Failed to activate sequence' });
  }
});

// Pause sequence
router.post('/:id/pause', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sequence = await sequenceService.updateStatus(req.params.id, 'paused');

    if (!sequence) {
      res.status(404).json({ error: 'Sequence not found' });
      return;
    }

    res.json(sequence);
  } catch (error) {
    logger.error('Error pausing sequence', { error });
    res.status(500).json({ error: 'Failed to pause sequence' });
  }
});

// Enroll contact in sequence
router.post('/:id/enroll', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = enrollSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const enrollment = await enrollmentService.enroll({
      sequenceId: req.params.id,
      userId: req.userId!,
      ...validation.data
    });

    res.status(201).json(enrollment);
  } catch (error) {
    logger.error('Error enrolling contact', { error });
    const message = error instanceof Error ? error.message : 'Failed to enroll contact';
    res.status(400).json({ error: message });
  }
});

// Pause enrollment
router.post('/:id/pause', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { enrollmentId } = req.body;
    if (!enrollmentId) {
      res.status(400).json({ error: 'enrollmentId is required' });
      return;
    }

    const enrollment = await enrollmentService.pause(enrollmentId);

    if (!enrollment) {
      res.status(404).json({ error: 'Enrollment not found' });
      return;
    }

    res.json(enrollment);
  } catch (error) {
    logger.error('Error pausing enrollment', { error });
    res.status(500).json({ error: 'Failed to pause enrollment' });
  }
});

// Get sequence analytics
router.get('/:id/analytics', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analytics = await analyticsService.getSequenceAnalytics(req.params.id);

    if (!analytics) {
      res.status(404).json({ error: 'Sequence not found' });
      return;
    }

    res.json(analytics);
  } catch (error) {
    logger.error('Error fetching sequence analytics', { error });
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get enrollments for sequence
router.get('/:id/enrollments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, limit } = req.query;
    const enrollments = await enrollmentService.findBySequence(req.params.id, {
      status: status as string,
      limit: limit ? parseInt(limit as string) : 50
    });

    res.json(enrollments);
  } catch (error) {
    logger.error('Error fetching enrollments', { error });
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Delete sequence
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await sequenceService.delete(req.params.id);

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

// Duplicate sequence
router.post('/:id/duplicate', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sequence = await sequenceService.duplicateSequence(req.params.id, req.userId!);
    res.status(201).json(sequence);
  } catch (error) {
    logger.error('Error duplicating sequence', { error });
    res.status(500).json({ error: 'Failed to duplicate sequence' });
  }
});

// Get sequence stats
router.get('/stats/summary', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await sequenceService.getSequenceStats(req.userId!);
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching sequence stats', { error });
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;