import { Router } from 'express';
import { templateController } from '../controllers';

const router = Router();

/**
 * POST /api/templates
 * Create a new template
 */
router.post('/', templateController.createTemplate);

/**
 * GET /api/templates
 * Get templates with filters
 */
router.get('/', templateController.getTemplates);

/**
 * GET /api/templates/type/:type
 * Get templates by type
 */
router.get('/type/:type', templateController.getTemplatesByType);

/**
 * GET /api/templates/:id
 * Get template by ID
 */
router.get('/:id', templateController.getTemplateById);

/**
 * PATCH /api/templates/:id
 * Update a template
 */
router.patch('/:id', templateController.updateTemplate);

/**
 * DELETE /api/templates/:id
 * Delete a template
 */
router.delete('/:id', templateController.deleteTemplate);

/**
 * POST /api/templates/:id/duplicate
 * Duplicate a template
 */
router.post('/:id/duplicate', templateController.duplicateTemplate);

/**
 * POST /api/templates/:id/set-default
 * Set template as default
 */
router.post('/:id/set-default', templateController.setDefaultTemplate);

/**
 * PATCH /api/templates/bulk/status
 * Bulk update template status
 */
router.patch('/bulk/status', templateController.bulkUpdateStatus);

export default router;
