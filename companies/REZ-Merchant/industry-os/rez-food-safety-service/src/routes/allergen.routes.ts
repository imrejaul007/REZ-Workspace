/**
 * Allergen Routes
 */

import { Router, Request, Response } from 'express';
import { AllergenProfile } from '../models';

const router = Router();

const COMMON_ALLERGENS = [
  'peanuts', 'tree-nuts', 'milk', 'eggs', 'fish', 'shellfish',
  'soy', 'wheat', 'gluten', 'sesame', 'mustard', 'celery', 'lupin', 'molluscs', 'sulphites'
];

const DIETARY_LABELS = [
  'vegetarian', 'vegan', 'jain', 'halal', 'kosher',
  'gluten-free', 'dairy-free', 'nut-free'
];

router.get('/reference', (_req: Request, res: Response) => {
  res.json({ success: true, data: { allergens: COMMON_ALLERGENS, dietary: DIETARY_LABELS } });
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { merchantId, restaurantId, itemId, itemName, allergens, dietaryFlags, updatedBy } = req.body;
    const profile = await AllergenProfile.findOneAndUpdate(
      { itemId },
      { merchantId, restaurantId, itemId, itemName, allergens, dietaryFlags, lastUpdated: new Date(), updatedBy },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to set profile' });
  }
});

router.get('/:itemId', async (req: Request, res: Response) => {
  try {
    const profile = await AllergenProfile.findOne({ itemId: req.params.itemId });
    if (!profile) {
      res.status(404).json({ success: false, error: 'Profile not found' });
      return;
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

router.get('/search/safe', async (req: Request, res: Response) => {
  try {
    const { restaurantId, exclude } = req.query;
    const excludeAllergens = (exclude as string)?.split(',') || [];
    const profiles = await AllergenProfile.find({ restaurantId });
    const safeItems = profiles.filter((profile) => {
      const profileAllergens = profile.allergens.map((a) => a.type);
      return !excludeAllergens.some((allergen: string) => profileAllergens.includes(allergen));
    });
    res.json({ success: true, data: safeItems });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to search' });
  }
});

router.get('/dietary/:restaurantId', async (req: Request, res: Response) => {
  try {
    const { diet } = req.query;
    const profiles = await AllergenProfile.find({ restaurantId: req.params.restaurantId, dietaryFlags: diet });
    res.json({ success: true, data: profiles });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch dietary items' });
  }
});

export { router as allergenRoutes };
