import { Router, Request, Response, NextFunction } from 'express';
import { metadataService } from '../services/metadataService';
import { authMiddleware, validateBody, createMetadataSchema, updateMetadataSchema } from '../middleware/auth';
import { logger } from 'utils/logger.js';

const router = Router();
router.use(authMiddleware);

router.post('/', validateBody(createMetadataSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metadata = await metadataService.create(req.body);
    res.status(201).json({ success: true, data: metadata });
  } catch (error) {
    next(error);
  }
});

router.get('/:contentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metadata = await metadataService.findByContentId(req.params.contentId);
    if (!metadata) return res.status(404).json({ success: false, error: 'Metadata not found' });
    res.json({ success: true, data: metadata });
  } catch (error) {
    next(error);
  }
});

router.put('/:contentId', validateBody(updateMetadataSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metadata = await metadataService.update(req.params.contentId, req.body);
    if (!metadata) return res.status(404).json({ success: false, error: 'Metadata not found' });
    logger.info('Metadata updated via API', { contentId: req.params.contentId });
    res.json({ success: true, data: metadata });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      categories: req.query.categories ? (req.query.categories as string).split(',') : undefined,
      language: req.query.language as string,
      region: req.query.region as string,
      visibility: req.query.visibility as string,
      contentType: req.query.contentType as string,
      query: req.query.query as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };
    const result = await metadataService.search(filters);
    res.json({
      success: true,
      data: result.results,
      pagination: { total: result.total, page: filters.page, limit: filters.limit, pages: Math.ceil(result.total / filters.limit) }
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:contentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await metadataService.delete(req.params.contentId);
    if (!deleted) return res.status(404).json({ success: false, error: 'Metadata not found' });
    res.json({ success: true, message: 'Metadata deleted' });
  } catch (error) {
    next(error);
  }
});

export const metadataRoutes = router;