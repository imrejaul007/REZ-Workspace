import { Router, Response } from 'express';
import { z } from 'zod';
import { broadcastService } from '../services/BroadcastService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import logger from 'utils/logger.js';

const router = Router();

const createBroadcastSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().optional(),
  content: z.string().min(1),
  channel: z.enum(['email', 'sms', 'push', 'inApp']),
  segmentId: z.string().optional(),
  segmentCriteria: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateBroadcastSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subject: z.string().optional(),
  content: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const sendBroadcastSchema = z.object({
  recipients: z.array(z.object({
    userId: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    pushToken: z.string().optional(),
    variables: z.record(z.unknown()).optional(),
  })).min(1),
});

const scheduleBroadcastSchema = z.object({
  scheduledAt: z.string().datetime(),
});

const createSegmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  criteria: z.object({
    filters: z.array(z.object({
      field: z.string(),
      operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains']),
      value: z.unknown(),
    })),
    logic: z.enum(['and', 'or']).optional(),
  }),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

router.post('/broadcasts', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createBroadcastSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const broadcast = await broadcastService.createBroadcast({
      ...parsed.data,
      ownerId: req.userId!,
    });

    res.status(201).json(broadcast);
  } catch (error) {
    logger.error('Error creating broadcast', { error });
    res.status(500).json({ error: 'Failed to create broadcast' });
  }
});

router.get('/broadcasts', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, channel, page = '1', limit = '50' } = req.query;
    const result = await broadcastService.getBroadcastsByOwner(req.userId!, {
      status: status as string,
      channel: channel as string,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });

    res.json({
      broadcasts: result.broadcasts,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total: result.total,
      },
    });
  } catch (error) {
    logger.error('Error fetching broadcasts', { error });
    res.status(500).json({ error: 'Failed to fetch broadcasts' });
  }
});

router.get('/broadcasts/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const broadcast = await broadcastService.getBroadcast(req.params.id);
    if (!broadcast) {
      res.status(404).json({ error: 'Broadcast not found' });
      return;
    }
    res.json(broadcast);
  } catch (error) {
    logger.error('Error fetching broadcast', { error });
    res.status(500).json({ error: 'Failed to fetch broadcast' });
  }
});

router.put('/broadcasts/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = updateBroadcastSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const broadcast = await broadcastService.updateBroadcast(req.params.id, parsed.data);
    if (!broadcast) {
      res.status(404).json({ error: 'Broadcast not found' });
      return;
    }
    res.json(broadcast);
  } catch (error) {
    logger.error('Error updating broadcast', { error });
    res.status(500).json({ error: 'Failed to update broadcast' });
  }
});

router.delete('/broadcasts/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await broadcastService.deleteBroadcast(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Broadcast not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting broadcast', { error });
    res.status(500).json({ error: 'Failed to delete broadcast' });
  }
});

router.post('/broadcasts/:id/schedule', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = scheduleBroadcastSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const broadcast = await broadcastService.scheduleBroadcast(
      req.params.id,
      new Date(parsed.data.scheduledAt)
    );

    if (!broadcast) {
      res.status(404).json({ error: 'Broadcast not found' });
      return;
    }
    res.json(broadcast);
  } catch (error) {
    logger.error('Error scheduling broadcast', { error });
    res.status(500).json({ error: 'Failed to schedule broadcast' });
  }
});

router.post('/broadcasts/:id/send', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = sendBroadcastSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const result = await broadcastService.sendBroadcast(req.params.id, parsed.data.recipients);
    res.json({ message: 'Broadcast queued', ...result });
  } catch (error) {
    logger.error('Error sending broadcast', { error });
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/broadcasts/:id/pause', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const broadcast = await broadcastService.pauseBroadcast(req.params.id);
    if (!broadcast) {
      res.status(404).json({ error: 'Broadcast not found' });
      return;
    }
    res.json(broadcast);
  } catch (error) {
    logger.error('Error pausing broadcast', { error });
    res.status(500).json({ error: 'Failed to pause broadcast' });
  }
});

router.post('/broadcasts/:id/resume', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const broadcast = await broadcastService.resumeBroadcast(req.params.id);
    if (!broadcast) {
      res.status(404).json({ error: 'Broadcast not found' });
      return;
    }
    res.json(broadcast);
  } catch (error) {
    logger.error('Error resuming broadcast', { error });
    res.status(500).json({ error: 'Failed to resume broadcast' });
  }
});

router.get('/broadcasts/:id/analytics', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analytics = await broadcastService.getBroadcastAnalytics(req.params.id);
    res.json(analytics);
  } catch (error) {
    logger.error('Error fetching analytics', { error });
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.post('/segments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createSegmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const segment = await broadcastService.createSegment({
      ...parsed.data,
      ownerId: req.userId!,
    });

    res.status(201).json(segment);
  } catch (error) {
    logger.error('Error creating segment', { error });
    res.status(500).json({ error: 'Failed to create segment' });
  }
});

router.get('/segments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const segments = await broadcastService.getSegmentsByOwner(req.userId!);
    res.json(segments);
  } catch (error) {
    logger.error('Error fetching segments', { error });
    res.status(500).json({ error: 'Failed to fetch segments' });
  }
});

router.get('/segments/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const segment = await broadcastService.getSegment(req.params.id);
    if (!segment) {
      res.status(404).json({ error: 'Segment not found' });
      return;
    }
    res.json(segment);
  } catch (error) {
    logger.error('Error fetching segment', { error });
    res.status(500).json({ error: 'Failed to fetch segment' });
  }
});

router.delete('/segments/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await broadcastService.deleteSegment(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Segment not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting segment', { error });
    res.status(500).json({ error: 'Failed to delete segment' });
  }
});

export default router;