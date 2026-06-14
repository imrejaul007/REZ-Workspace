/**
 * Stylist Routes - Staff management for salon services
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Stylist } from '../models/Stylist';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Validation schema for stylist
const stylistSchema = z.object({
  salonId: z.string().min(1),
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15),
  avatar: z.string().url().optional(),
  specialties: z.array(z.string()).default([]),
  bio: z.string().max(500).optional(),
  experience: z.number().min(0).optional(),
  schedule: z.record(z.object({
    start: z.string(),
    end: z.string(),
    breakStart: z.string().optional(),
    breakEnd: z.string().optional(),
  })).optional(),
});

// GET /api/stylists - List all stylists (with optional filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { salonId, active, specialization, page = '1', limit = '20' } = req.query;

    const query: Record<string, unknown> = {};
    if (salonId) query.salonId = salonId;
    if (active !== undefined) query.isActive = active === 'true';
    if (specialization) query.specialties = { $in: [specialization] };

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [stylists, total] = await Promise.all([
      Stylist.find(query).skip(skip).limit(limitNum).sort({ createdAt: -1 }),
      Stylist.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: stylists,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching stylists:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stylists' });
  }
});

// GET /api/stylists/:stylistId - Get stylist by ID
router.get('/:stylistId', async (req: Request, res: Response) => {
  try {
    const { stylistId } = req.params;
    const stylist = await Stylist.findOne({ stylistId });

    if (!stylist) {
      res.status(404).json({ success: false, error: 'Stylist not found' });
      return;
    }

    res.json({ success: true, data: stylist });
  } catch (error) {
    console.error('Error fetching stylist:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stylist' });
  }
});

// POST /api/stylists - Create new stylist
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const validationResult = stylistSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const data = validationResult.data;
    const stylistId = `STY${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const stylist = new Stylist({
      stylistId,
      ...data,
      rating: 0,
      reviewCount: 0,
    });

    await stylist.save();

    res.status(201).json({ success: true, data: stylist });
  } catch (error) {
    console.error('Error creating stylist:', error);
    res.status(500).json({ success: false, error: 'Failed to create stylist' });
  }
});

// PUT /api/stylists/:stylistId - Update stylist
router.put('/:stylistId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { stylistId } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.stylistId;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.rating;
    delete updates.reviewCount;

    const stylist = await Stylist.findOneAndUpdate(
      { stylistId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!stylist) {
      res.status(404).json({ success: false, error: 'Stylist not found' });
      return;
    }

    res.json({ success: true, data: stylist });
  } catch (error) {
    console.error('Error updating stylist:', error);
    res.status(500).json({ success: false, error: 'Failed to update stylist' });
  }
});

// DELETE /api/stylists/:stylistId - Soft delete stylist (set inactive)
router.delete('/:stylistId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { stylistId } = req.params;

    const stylist = await Stylist.findOneAndUpdate(
      { stylistId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!stylist) {
      res.status(404).json({ success: false, error: 'Stylist not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Stylist deactivated successfully',
      data: stylist
    });
  } catch (error) {
    console.error('Error deleting stylist:', error);
    res.status(500).json({ success: false, error: 'Failed to delete stylist' });
  }
});

// GET /api/stylists/salon/:salonId - Get stylists by salon
router.get('/salon/:salonId', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { specialization } = req.query;

    const query: Record<string, unknown> = { salonId, isActive: true };
    if (specialization) {
      query.specialties = { $in: [specialization] };
    }

    const stylists = await Stylist.find(query).sort({ rating: -1, name: 1 });

    res.json({ success: true, data: stylists });
  } catch (error) {
    console.error('Error fetching salon stylists:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stylists' });
  }
});

export { router as stylistRoutes };
