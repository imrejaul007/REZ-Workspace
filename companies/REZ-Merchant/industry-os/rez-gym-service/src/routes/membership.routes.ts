/**
 * Membership Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Membership } from '../models/Membership';

const router = Router();

// Validation schema
const membershipSchema = z.object({
  userId: z.string().min(1),
  gymId: z.string().min(1),
  tier: z.enum(['basic', 'standard', 'premium', 'vip', 'corporate']),
  startDate: z.string(),
  endDate: z.string(),
  autoRenew: z.boolean().default(false),
  benefits: z.array(z.string()).default([]),
  maxClassesPerWeek: z.number().optional(),
  personalTrainingSessions: z.number().default(0),
});

// GET /api/memberships - List memberships
router.get('/', async (req: Request, res: Response) => {
  try {
    const { gymId, userId, status, tier } = req.query;

    const query: Record<string, unknown> = {};
    if (gymId) query.gymId = gymId;
    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (tier) query.tier = tier;

    const memberships = await Membership.find(query).sort({ createdAt: -1 });

    res.json({ success: true, data: memberships });
  } catch (error) {
    console.error('Error fetching memberships:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch memberships' });
  }
});

// GET /api/memberships/:membershipId - Get membership by ID
router.get('/:membershipId', async (req: Request, res: Response) => {
  try {
    const { membershipId } = req.params;
    const membership = await Membership.findOne({ membershipId });

    if (!membership) {
      res.status(404).json({ success: false, error: 'Membership not found' });
      return;
    }

    res.json({ success: true, data: membership });
  } catch (error) {
    console.error('Error fetching membership:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch membership' });
  }
});

// POST /api/memberships - Create membership
router.post('/', async (req: Request, res: Response) => {
  try {
    const validationResult = membershipSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
      return;
    }

    const data = validationResult.data;
    const membershipId = `GYM${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const membership = new Membership({
      membershipId,
      ...data,
      status: 'pending',
      totalPaid: 0,
      personalTrainingUsed: 0,
    });

    await membership.save();

    res.status(201).json({ success: true, data: membership });
  } catch (error) {
    console.error('Error creating membership:', error);
    res.status(500).json({ success: false, error: 'Failed to create membership' });
  }
});

// PUT /api/memberships/:membershipId - Update membership
router.put('/:membershipId', async (req: Request, res: Response) => {
  try {
    const { membershipId } = req.params;
    const updates = req.body;

    delete updates.membershipId;
    delete updates.createdAt;
    delete updates.updatedAt;

    const membership = await Membership.findOneAndUpdate(
      { membershipId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!membership) {
      res.status(404).json({ success: false, error: 'Membership not found' });
      return;
    }

    res.json({ success: true, data: membership });
  } catch (error) {
    console.error('Error updating membership:', error);
    res.status(500).json({ success: false, error: 'Failed to update membership' });
  }
});

// POST /api/memberships/:membershipId/activate - Activate membership
router.post('/:membershipId/activate', async (req: Request, res: Response) => {
  try {
    const { membershipId } = req.params;

    const membership = await Membership.findOneAndUpdate(
      { membershipId },
      { $set: { status: 'active' } },
      { new: true }
    );

    if (!membership) {
      res.status(404).json({ success: false, error: 'Membership not found' });
      return;
    }

    res.json({ success: true, data: membership, message: 'Membership activated' });
  } catch (error) {
    console.error('Error activating membership:', error);
    res.status(500).json({ success: false, error: 'Failed to activate membership' });
  }
});

// POST /api/memberships/:membershipId/freeze - Freeze membership
router.post('/:membershipId/freeze', async (req: Request, res: Response) => {
  try {
    const { membershipId } = req.params;
    const { freezeStartDate, freezeEndDate } = req.body;

    const membership = await Membership.findOneAndUpdate(
      { membershipId },
      {
        $set: {
          status: 'frozen',
          freezeStartDate,
          freezeEndDate,
        },
      },
      { new: true }
    );

    if (!membership) {
      res.status(404).json({ success: false, error: 'Membership not found' });
      return;
    }

    res.json({ success: true, data: membership, message: 'Membership frozen' });
  } catch (error) {
    console.error('Error freezing membership:', error);
    res.status(500).json({ success: false, error: 'Failed to freeze membership' });
  }
});

// POST /api/memberships/:membershipId/cancel - Cancel membership
router.post('/:membershipId/cancel', async (req: Request, res: Response) => {
  try {
    const { membershipId } = req.params;

    const membership = await Membership.findOneAndUpdate(
      { membershipId },
      { $set: { status: 'cancelled' } },
      { new: true }
    );

    if (!membership) {
      res.status(404).json({ success: false, error: 'Membership not found' });
      return;
    }

    res.json({ success: true, data: membership, message: 'Membership cancelled' });
  } catch (error) {
    console.error('Error cancelling membership:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel membership' });
  }
});

export { router as membershipRoutes };
