/**
 * Trial Routes
 */
import { Router, Request, Response } from 'express';
import { TrialModel } from '../models';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();

// Get all trials (with optional filtering)
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      category,
      lat,
      lng,
      radius = '10', // km
      limit = '20',
      page = '1',
    } = req.query;

    const query: any = { isActive: true };

    if (category) {
      query.category = category;
    }

    const trials = await TrialModel.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .limit(parseInt(limit as string));

    const total = await TrialModel.countDocuments(query);

    res.json({
      success: true,
      data: trials,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    logger.error('Error fetching trials:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch trials' });
  }
});

// Get trial by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const trial = await TrialModel.findById(req.params.id);

    if (!trial) {
      return res.status(404).json({ success: false, error: 'Trial not found' });
    }

    res.json({ success: true, data: trial });
  } catch (error) {
    logger.error('Error fetching trial:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch trial' });
  }
});

// Get trials near location
router.get('/nearby/:lat/:lng', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.params;
    const { radius = '10' } = req.query;

    // Simple bounding box calculation
    const latDelta = parseFloat(radius as string) / 111; // 1 degree ~ 111km
    const lngDelta = parseFloat(radius as string) / (111 * Math.cos(parseFloat(lat)));

    const trials = await TrialModel.find({
      isActive: true,
      'location.lat': {
        $gte: parseFloat(lat) - latDelta,
        $lte: parseFloat(lat) + latDelta,
      },
      'location.lng': {
        $gte: parseFloat(lng) - lngDelta,
        $lte: parseFloat(lng) + lngDelta,
      },
    }).sort({ rating: -1 });

    res.json({ success: true, data: trials });
  } catch (error) {
    logger.error('Error fetching nearby trials:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch nearby trials' });
  }
});

// Get trial categories
router.get('/meta/categories', async (req: Request, res: Response) => {
  try {
    const categories = await TrialModel.distinct('category', { isActive: true });

    res.json({
      success: true,
      data: categories.map((cat) => ({
        key: cat.toLowerCase(),
        label: cat,
        emoji: getCategoryEmoji(cat),
      })),
    });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    beauty: '💅',
    food: '☕',
    fitness: '💪',
    home: '🏠',
    healthcare: '🏥',
    products: '📦',
  };
  return emojiMap[category.toLowerCase()] || '✨';
}

export default router;
