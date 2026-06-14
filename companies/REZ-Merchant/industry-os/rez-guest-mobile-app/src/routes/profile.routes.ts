/**
 * Profile Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { GuestProfileModel } from '../models/GuestProfile';

const router = Router();

// Validation schemas
const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(10).max(20).optional(),
  avatar: z.string().url().optional(),
  preferences: z.object({
    roomPreference: z.string().optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    language: z.string().optional(),
    currency: z.string().optional(),
    notifications: z.object({
      push: z.boolean().optional(),
      email: z.boolean().optional(),
      sms: z.boolean().optional(),
      types: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
});

// GET /api/profile/:guestId - Get guest profile
router.get('/:guestId', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;

    const profile = await GuestProfileModel.findOne({ guestId }).lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Profile not found' },
      });
    }

    res.json({ success: true, data: { profile } });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get profile' },
    });
  }
});

// PUT /api/profile/:guestId - Update guest profile
router.put('/:guestId', async (req: Request, res: Response) => {
  try {
    const validated = UpdateProfileSchema.parse(req.body);
    const { guestId } = req.params;

    const profile = await GuestProfileModel.findOneAndUpdate(
      { guestId },
      { $set: validated },
      { new: true }
    ).lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Profile not found' },
      });
    }

    res.json({
      success: true,
      data: { profile },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors },
      });
    }
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to update profile' },
    });
  }
});

// GET /api/profile/:guestId/loyalty - Get loyalty status
router.get('/:guestId/loyalty', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;

    const profile = await GuestProfileModel.findOne({ guestId }).lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Profile not found' },
      });
    }

    // Calculate tier progress
    const tierThresholds = {
      bronze: 0,
      silver: 1000,
      gold: 5000,
      platinum: 15000,
    };

    const currentPoints = profile.loyaltyPoints;
    const tiers = Object.entries(tierThresholds);
    const currentTierIndex = tiers.findIndex(([tier, threshold]) => {
      const nextThreshold = tiers[tiers.indexOf([tier, threshold]) + 1];
      return currentPoints >= threshold && (!nextThreshold || currentPoints < nextThreshold[1]);
    });

    const currentTier = tiers[currentTierIndex][0];
    const nextTier = tiers[currentTierIndex + 1];
    const progress = nextTier
      ? Math.round(((currentPoints - tierThresholds[currentTier as keyof typeof tierThresholds]) /
          (nextTier[1] - tierThresholds[currentTier as keyof typeof tierThresholds])) * 100)
      : 100;

    res.json({
      success: true,
      data: {
        tier: currentTier,
        points: currentPoints,
        progress,
        nextTier: nextTier ? { name: nextTier[0], points: nextTier[1] } : null,
        benefits: getTierBenefits(currentTier),
      },
    });
  } catch (error) {
    console.error('Get loyalty error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get loyalty status' },
    });
  }
});

function getTierBenefits(tier: string): string[] {
  const benefits: Record<string, string[]> = {
    bronze: ['Earn 1 point per 10 INR'],
    silver: ['Earn 1.25 points per 10 INR', 'Early check-in (subject to availability)'],
    gold: ['Earn 1.5 points per 10 INR', 'Early check-in & late check-out', 'Room upgrades'],
    platinum: ['Earn 2 points per 10 INR', 'Complimentary breakfast', 'Airport transfers', 'Dedicated concierge'],
  };
  return benefits[tier] || benefits.bronze;
}

export default router;
