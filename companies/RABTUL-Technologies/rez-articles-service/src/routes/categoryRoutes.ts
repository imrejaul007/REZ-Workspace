import { Router, Request, Response } from 'express';

const router = Router();

// Default categories
const DEFAULT_CATEGORIES = [
  { id: 'shopping', name: 'Shopping Tips', icon: 'cart' },
  { id: 'finance', name: 'Financial Guide', icon: 'wallet' },
  { id: 'lifestyle', name: 'Lifestyle', icon: 'heart' },
  { id: 'tech', name: 'Tech & Gadgets', icon: 'phone-portrait' },
  { id: 'fashion', name: 'Fashion', icon: 'shirt' },
  { id: 'food', name: 'Food & Dining', icon: 'restaurant' },
  { id: 'travel', name: 'Travel', icon: 'airplane' },
  { id: 'beauty', name: 'Beauty', icon: 'sparkles' },
];

// GET /articles/categories - List categories
router.get('/', async (_req: Request, res: Response) => {
  try {
    res.json({ categories: DEFAULT_CATEGORIES });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
