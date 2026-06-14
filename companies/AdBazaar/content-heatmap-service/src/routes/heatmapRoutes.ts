import { Router, Request, Response, NextFunction } from 'express';
import { heatmapService } from '../services/heatmapService';
import { segmentService } from '../services/segmentService';
import { authMiddleware, validateBody, trackEventSchema, createSegmentSchema } from '../middleware/auth';
import { logger } from 'utils/logger.js';

const router = Router();
router.use(authMiddleware);

// Track event
router.post('/:contentId/track', validateBody(trackEventSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = {
      contentId: req.params.contentId,
      contentType: req.body.contentType || 'unknown',
      sessionId: req.body.sessionId,
      userId: req.body.userId,
      eventType: req.body.eventType,
      eventData: req.body.eventData
    };
    const event = await heatmapService.trackEvent(input);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
});

// Get heatmap
router.get('/:contentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : undefined;
    const heatmap = await heatmapService.getHeatmap(req.params.contentId, date);
    if (!heatmap) return res.status(404).json({ success: false, error: 'Heatmap not found' });
    res.json({ success: true, data: heatmap });
  } catch (error) {
    next(error);
  }
});

// Get heatmap range
router.get('/:contentId/range', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);
    const heatmaps = await heatmapService.getHeatmapRange(req.params.contentId, startDate, endDate);
    res.json({ success: true, data: heatmaps });
  } catch (error) {
    next(error);
  }
});

// Get analytics
router.get('/:contentId/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'daily';
    const startDate = new Date(req.query.startDate as string || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const endDate = new Date(req.query.endDate as string || new Date());

    let analytics = await heatmapService.getAnalytics(req.params.contentId, period, startDate, endDate);

    if (!analytics) {
      const contentType = req.query.contentType as string || 'unknown';
      analytics = await heatmapService.calculateAnalytics(req.params.contentId, contentType, startDate, endDate);
    }

    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
});

// Get dashboard
router.get('/dashboard/all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboard = await heatmapService.getDashboard();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    next(error);
  }
});

// Segment routes
router.post('/segments', validateBody(createSegmentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const segment = await segmentService.create(req.body);
    res.status(201).json({ success: true, data: segment });
  } catch (error) {
    next(error);
  }
});

router.get('/segments/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const segments = await segmentService.findAll();
    res.json({ success: true, data: segments });
  } catch (error) {
    next(error);
  }
});

router.get('/segments/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const segment = await segmentService.findById(req.params.id);
    if (!segment) return res.status(404).json({ success: false, error: 'Segment not found' });
    res.json({ success: true, data: segment });
  } catch (error) {
    next(error);
  }
});

router.delete('/segments/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await segmentService.delete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Segment not found' });
    res.json({ success: true, message: 'Segment deleted' });
  } catch (error) {
    next(error);
  }
});

export const heatmapRoutes = router;