/**
 * Salon Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Salon } from '../models/Salon';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Search salons
router.get('/search', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { city, category, lat, lng, radius } = req.query;

    const query: unknown = { status: 'active' };

    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }

    if (category) {
      query.categories = category;
    }

    const salons = await Salon.find(query)
      .select('-services -stylists')
      .limit(50);

    res.json({
      success: true,
      data: salons,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

// Get salon by ID
router.get('/:salonId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;

    const salon = await Salon.findOne({ salonId });

    if (!salon) {
      res.status(404).json({ success: false, error: 'Salon not found' });
      return;
    }

    res.json({
      success: true,
      data: salon,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get salon' });
  }
});

// Create salon
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const salonSchema = z.object({
      name: z.string(),
      description: z.string().optional(),
      address: z.object({
        line1: z.string(),
        city: z.string(),
        state: z.string(),
        pincode: z.string().optional(),
      }),
      phone: z.string(),
      email: z.string().email().optional(),
      categories: z.array(z.string()).optional(),
    });

    const data = salonSchema.parse(req.body);
    const salonId = `SAL${Date.now()}`;

    const salon = new Salon({
      salonId,
      ...data,
      ownerId: req.user?.sub,
      status: 'active',
    });

    await salon.save();

    res.status(201).json({
      success: true,
      data: salon,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to create salon' });
  }
});

// Update salon
router.put('/:salonId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { salonId } = req.params;

    const salon = await Salon.findOneAndUpdate(
      { salonId, ownerId: req.user?.sub },
      req.body,
      { new: true }
    );

    if (!salon) {
      res.status(404).json({ success: false, error: 'Salon not found' });
      return;
    }

    res.json({
      success: true,
      data: salon,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update salon' });
  }
});

export { router as salonRoutes };
