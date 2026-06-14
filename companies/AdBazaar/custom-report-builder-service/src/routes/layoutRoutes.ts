import { Router, Response } from 'express';
import { z } from 'zod';
import { layoutService } from '../services/LayoutService.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

const CreateLayoutSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  columns: z.number().min(1).max(24).default(12),
  rowHeight: z.number().min(50).default(100),
  gap: z.number().min(0).default(10),
  breakpoints: z.object({
    lg: z.object({ columns: z.number() }).optional(),
    md: z.object({ columns: z.number() }).optional(),
    sm: z.object({ columns: z.number() }).optional()
  }).optional(),
  theme: z.object({
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    primaryColor: z.string().optional(),
    borderRadius: z.number().optional()
  }).optional(),
  isDefault: z.boolean().optional()
});

const UpdateLayoutSchema = CreateLayoutSchema.partial();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';

    const layouts = await layoutService.getLayouts(orgId);

    res.json({
      success: true,
      data: layouts,
      count: layouts.length
    });
  } catch (error: any) {
    logger.error('Error getting layouts:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/default', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';

    const layout = await layoutService.getDefaultLayout(orgId);

    if (!layout) {
      res.status(404).json({ success: false, error: 'No default layout found' });
      return;
    }

    res.json({
      success: true,
      data: layout
    });
  } catch (error: any) {
    logger.error('Error getting default layout:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = CreateLayoutSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const layout = await layoutService.createLayout({
      ...validated,
      organizationId: orgId
    });

    res.status(201).json({
      success: true,
      data: layout
    });
  } catch (error: any) {
    logger.error('Error creating layout:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const layout = await layoutService.getLayoutById(id, orgId);

    if (!layout) {
      res.status(404).json({ success: false, error: 'Layout not found' });
      return;
    }

    res.json({
      success: true,
      data: layout
    });
  } catch (error: any) {
    logger.error(`Error getting layout ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validated = UpdateLayoutSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const layout = await layoutService.updateLayout(id, validated, orgId);

    if (!layout) {
      res.status(404).json({ success: false, error: 'Layout not found' });
      return;
    }

    res.json({
      success: true,
      data: layout
    });
  } catch (error: any) {
    logger.error(`Error updating layout ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const deleted = await layoutService.deleteLayout(id, orgId);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Layout not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Layout deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error deleting layout ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;