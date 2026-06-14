import { Router } from 'express';
import { templateController } from '../controllers';

const router = Router();

// Create template
router.post(
  '/',
  templateController.create.bind(templateController)
);

// Get all templates
router.get(
  '/',
  templateController.list.bind(templateController)
);

// Get template categories
router.get(
  '/categories',
  templateController.getCategories.bind(templateController)
);

// Get template by ID
router.get(
  '/:id',
  templateController.getById.bind(templateController)
);

// Get template by name
router.get(
  '/name/:name',
  templateController.getByName.bind(templateController)
);

// Update template
router.patch(
  '/:id',
  templateController.update.bind(templateController)
);

// Delete template
router.delete(
  '/:id',
  templateController.delete.bind(templateController)
);

export default router;
