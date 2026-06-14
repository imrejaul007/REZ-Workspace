import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { outreachService } from '../services/outreachService';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logger } from 'utils/logger.js';

const router = Router();

// Validation schemas
const createOutreachSchema = z.object({
  influencerId: z.string(),
  campaignId: z.string().optional(),
  brandId: z.string(),
  type: z.enum(['initial', 'follow_up', 'negotiation', 'contract', 'thank_you', 'check_in']).default('initial'),
  channel: z.enum(['email', 'dm', 'whatsapp', 'sms', 'call']).default('email'),
  subject: z.string().optional(),
  content: z.string(),
  templateId: z.string().optional(),
  personalization: z.record(z.string()).optional(),
  scheduledAt: z.string().datetime().optional()
});

const createSequenceSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(z.object({
    step: z.number(),
    type: z.enum(['email', 'dm', 'whatsapp', 'sms', 'delay', 'condition']),
    subject: z.string().optional(),
    content: z.string(),
    delayDays: z.number().optional(),
    delayHours: z.number().optional()
  })),
  targetCriteria: z.object({
    minFollowers: z.number().optional(),
    maxFollowers: z.number().optional(),
    niches: z.array(z.string()).optional(),
    platforms: z.array(z.string()).optional()
  }).optional()
});

const recordResponseSchema = z.object({
  type: z.enum(['interested', 'not_interested', 'price_negotiation', 'need_more_info', 'no_response', 'out_of_office', 'callback_requested', 'custom']),
  message: z.string(),
  source: z.enum(['email', 'dm', 'whatsapp', 'sms', 'call', 'manual']).default('email'),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional()
});

// POST /api/outreach - Create outreach
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createOutreachSchema.parse(req.body);
    const outreach = await outreachService.createOutreach({
      ...validatedData,
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined,
      createdBy: req.userId
    } as any);
    logger.info('Outreach created via API', { userId: req.userId });
    res.status(201).json(outreach);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      next(error);
    }
  }
});

// GET /api/outreach/:id - Get outreach by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const outreach = await outreachService.getOutreachById(req.params.id);
    if (!outreach) {
      return res.status(404).json({ error: 'Outreach not found' });
    }
    res.json(outreach);
  } catch (error) {
    next(error);
  }
});

// POST /api/outreach/:id/send - Send outreach
router.post('/:id/send', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const outreach = await outreachService.sendOutreach(req.params.id);
    if (!outreach) {
      return res.status(404).json({ error: 'Outreach not found' });
    }
    logger.info('Outreach sent via API', { outreachId: req.params.id });
    res.json(outreach);
  } catch (error) {
    next(error);
  }
});

// GET /api/outreach/:id/responses - Get outreach responses
router.get('/:id/responses', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const responses = await outreachService.getOutreachResponses(req.params.id);
    res.json(responses);
  } catch (error) {
    next(error);
  }
});

// POST /api/outreach/:id/response - Record response
router.post('/:id/response', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = recordResponseSchema.parse(req.body);
    const outreach = await outreachService.getOutreachById(req.params.id);
    if (!outreach) {
      return res.status(404).json({ error: 'Outreach not found' });
    }
    const response = await outreachService.recordResponse(req.params.id, {
      ...validatedData,
      influencerId: outreach.influencerId.toString()
    });
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      next(error);
    }
  }
});

// GET /api/outreach/sequences - Get sequences
router.get('/sequences', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId } = req.query;
    const sequences = await outreachService.getSequences(brandId as string);
    res.json(sequences);
  } catch (error) {
    next(error);
  }
});

// POST /api/outreach/sequences - Create sequence
router.post('/sequences', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createSequenceSchema.parse(req.body);
    const sequence = await outreachService.createSequence({
      ...validatedData,
      brandId: validatedData.brandId || (req as any).companyId
    } as any);
    logger.info('Sequence created via API', { userId: req.userId });
    res.status(201).json(sequence);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      next(error);
    }
  }
});

// POST /api/outreach/sequences/:id/enroll - Enroll in sequence
router.post('/sequences/:id/enroll', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { influencerId, campaignId } = req.body;
    const outreach = await outreachService.enrollInSequence(req.params.id, influencerId, campaignId);
    if (!outreach) {
      return res.status(404).json({ error: 'Sequence not found' });
    }
    res.status(201).json(outreach);
  } catch (error) {
    next(error);
  }
});

// GET /api/outreach/analytics - Get analytics
router.get('/analytics', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId } = req.query;
    const analytics = await outreachService.getOutreachAnalytics(brandId as string);
    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

// PUT /api/outreach/:id/status - Update status
router.put('/:id/status', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, ...additionalData } = req.body;
    const outreach = await outreachService.updateOutreachStatus(req.params.id, status, additionalData);
    if (!outreach) {
      return res.status(404).json({ error: 'Outreach not found' });
    }
    res.json(outreach);
  } catch (error) {
    next(error);
  }
});

// POST /api/outreach/:id/schedule - Schedule outreach
router.post('/:id/schedule', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scheduledAt } = req.body;
    const outreach = await outreachService.scheduleOutreach(req.params.id, new Date(scheduledAt));
    if (!outreach) {
      return res.status(404).json({ error: 'Outreach not found' });
    }
    res.json(outreach);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/outreach/:id - Delete outreach
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await outreachService.deleteOutreach(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Outreach not found' });
    }
    res.json({ message: 'Outreach deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export { router as outreachRoutes };