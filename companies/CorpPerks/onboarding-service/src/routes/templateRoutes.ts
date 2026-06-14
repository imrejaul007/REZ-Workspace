import { Router } from 'express';
import {
  createTemplateHandler,
  getTemplateHandler,
  listTemplatesHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
  getTemplateStatsHandler
} from '../controllers/templateController';

const router = Router();

// POST /api/templates - Create template
router.post('/', createTemplateHandler);

// GET /api/templates - List templates
router.get('/', listTemplatesHandler);

// GET /api/templates/:templateId - Get template
router.get('/:templateId', getTemplateHandler);

// GET /api/templates/:templateId/stats - Get template stats
router.get('/:templateId/stats', getTemplateStatsHandler);

// PUT /api/templates/:templateId - Update template
router.put('/:templateId', updateTemplateHandler);

// DELETE /api/templates/:templateId - Delete template
router.delete('/:templateId', deleteTemplateHandler);

export default router;
