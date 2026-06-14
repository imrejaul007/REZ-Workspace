import { Router, Response } from 'express';
import { ContentService, contentService } from '../services';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { createServiceLogger } from 'utils/logger.js';

const router = Router();
const logger = createServiceLogger('ContentRoutes');
router.use(authMiddleware);
const service: ContentService = contentService;

// POST /api/content - Create content
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const content = await service.createContent({ ...req.body, createdBy: req.userId || 'system', companyId: req.companyId || 'adb_company_001' });
    res.status(201).json({ success: true, data: content });
  } catch (error) {
    logger.error('Failed to create content', { error });
    res.status(500).json({ success: false, error: 'Failed to create content' });
  }
});

// GET /api/content/:id - Get content by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const content = await service.getContentById(req.params.id);
    if (!content) return res.status(404).json({ success: false, error: 'Content not found' });
    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get content' });
  }
});

// PUT /api/content/:id - Update content
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const content = await service.updateContent(req.params.id, req.body);
    if (!content) return res.status(404).json({ success: false, error: 'Content not found' });
    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update content' });
  }
});

// POST /api/content/:id/personalize - Personalize content
router.post('/:id/personalize', async (req: AuthRequest, res: Response) => {
  try {
    const { userId, context } = req.body;
    const personalization = await service.personalizeContent(req.params.id, userId, req.companyId || 'adb_company_001', context);
    res.json({ success: true, data: personalization });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to personalize content' });
  }
});

// GET /api/content/:id/preview - Preview content
router.get('/:id/preview', async (req: AuthRequest, res: Response) => {
  try {
    const variationId = req.query.variationId as string;
    const content = await service.previewContent(req.params.id, variationId);
    if (!content) return res.status(404).json({ success: false, error: 'Content not found' });
    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to preview content' });
  }
});

// GET /api/content - Get all content
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.query.companyId as string || 'adb_company_001';
    const status = req.query.status as string;
    const content = await service.getAllContent(companyId, status);
    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get content' });
  }
});

// POST /api/content/:id/variations - Create variation
router.post('/:id/variations', async (req: AuthRequest, res: Response) => {
  try {
    const variation = await service.createVariation(req.params.id, req.body);
    res.status(201).json({ success: true, data: variation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create variation' });
  }
});

// GET /api/content/:id/variations - Get variations
router.get('/:id/variations', async (req: AuthRequest, res: Response) => {
  try {
    const variations = await service.getVariationsByContent(req.params.id);
    res.json({ success: true, data: variations });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get variations' });
  }
});

// GET /api/content/:id/stats - Get content stats
router.get('/:id/stats', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await service.getContentStats(req.params.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

// POST /api/content/:id/click - Track click
router.post('/:id/click', async (req: AuthRequest, res: Response) => {
  try {
    const { variationId } = req.body;
    await service.trackClick(req.params.id, variationId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to track click' });
  }
});

export default router;