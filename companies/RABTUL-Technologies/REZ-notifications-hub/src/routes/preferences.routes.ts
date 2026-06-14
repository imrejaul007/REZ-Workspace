import { Router } from 'express';
import { preferencesController } from '../controllers';

const router = Router();

// Get user preferences
router.get(
  '/:userId',
  preferencesController.get.bind(preferencesController)
);

// Update user preferences
router.patch(
  '/:userId',
  preferencesController.update.bind(preferencesController)
);

// Get user category preferences
router.get(
  '/:userId/categories',
  preferencesController.getCategoryPreferences.bind(preferencesController)
);

// Update user category preferences
router.patch(
  '/:userId/categories',
  preferencesController.updateCategoryPreferences.bind(preferencesController)
);

// Delete user preferences
router.delete(
  '/:userId',
  preferencesController.delete.bind(preferencesController)
);

export default router;
