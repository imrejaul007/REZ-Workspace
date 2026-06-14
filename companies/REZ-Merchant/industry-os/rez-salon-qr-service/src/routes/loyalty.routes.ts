import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { loyaltyService } from '../services/LoyaltyService';

const router = Router();

// Validation schemas
const CreateAccountSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(10, 'Valid phone number is required'),
  birthday: z.string().datetime().optional(),
  referredBy: z.string().optional(),
});

const UpdateBirthdaySchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  birthday: z.string().datetime({ message: 'Invalid date format' }),
});

const RedeemPointsSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  points: z.number().positive('Points must be positive').int('Points must be whole number'),
});

const ValidateReferralSchema = z.object({
  referralCode: z.string().min(1, 'Referral code is required'),
});

// Validation middleware
const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }
    next(error);
  }
};

/**
 * POST /api/loyalty/account
 * Create a new loyalty account
 */
router.post('/account', validate(CreateAccountSchema), async (req: Request, res: Response) => {
  try {
    const { customerId, customerName, customerPhone, birthday, referredBy } = req.body;

    // Check if account already exists
    const existing = await loyaltyService.getLoyaltyDetails(customerId);
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'Loyalty account already exists for this customer',
        data: existing,
      });
      return;
    }

    const loyalty = await loyaltyService.createLoyaltyAccount(
      customerId,
      customerName,
      customerPhone,
      birthday ? new Date(birthday) : undefined,
      referredBy
    );

    res.status(201).json({
      success: true,
      message: 'Loyalty account created successfully',
      data: {
        loyaltyId: loyalty.loyaltyId,
        customerId: loyalty.customerId,
        referralCode: loyalty.referralCode,
        tier: loyalty.tier,
        totalPoints: loyalty.totalPoints,
      },
    });
  } catch (error) {
    console.error('Error creating loyalty account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create loyalty account',
    });
  }
});

/**
 * GET /api/loyalty/account/:customerId
 * Get loyalty account details
 */
router.get('/account/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    const loyalty = await loyaltyService.getLoyaltyDetails(customerId);

    if (!loyalty) {
      res.status(404).json({
        success: false,
        message: 'Loyalty account not found',
      });
      return;
    }

    const benefits = loyaltyService.getTierBenefits(loyalty.tier);
    const pointsValue = loyaltyService.getPointsValue(loyalty.availablePoints);
    const visitsToNextTier = loyaltyService.getVisitsToNextTier(loyalty.lifetimeVisits);

    res.json({
      success: true,
      data: {
        loyaltyId: loyalty.loyaltyId,
        customerId: loyalty.customerId,
        customerName: loyalty.customerName,
        customerPhone: loyalty.customerPhone,
        tier: loyalty.tier,
        totalPoints: loyalty.totalPoints,
        availablePoints: loyalty.availablePoints,
        pointsValue: pointsValue,
        lifetimeVisits: loyalty.lifetimeVisits,
        referralCode: loyalty.referralCode,
        referralCount: loyalty.referralCount,
        birthday: loyalty.birthday,
        lastCheckIn: loyalty.lastCheckIn,
        benefits: benefits.benefits,
        visitsToNextTier,
        tierHistory: loyalty.tierHistory,
      },
    });
  } catch (error) {
    console.error('Error getting loyalty account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get loyalty account',
    });
  }
});

/**
 * PATCH /api/loyalty/account/:customerId/birthday
 * Update birthday for birthday bonus
 */
router.patch('/account/:customerId/birthday', validate(UpdateBirthdaySchema), async (req: Request, res: Response) => {
  try {
    const { customerId, birthday } = req.body;

    const loyalty = await loyaltyService.updateBirthday(customerId, new Date(birthday));

    if (!loyalty) {
      res.status(404).json({
        success: false,
        message: 'Loyalty account not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Birthday updated successfully',
      data: {
        birthday: loyalty.birthday,
      },
    });
  } catch (error) {
    console.error('Error updating birthday:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update birthday',
    });
  }
});

/**
 * POST /api/loyalty/redeem
 * Redeem points for discount
 */
router.post('/redeem', validate(RedeemPointsSchema), async (req: Request, res: Response) => {
  try {
    const { customerId, points } = req.body;

    const result = await loyaltyService.redeemPoints(customerId, points);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
        data: result,
      });
      return;
    }

    res.json({
      success: true,
      message: result.message,
      data: {
        pointsRedeemed: points,
        discountAmount: result.discountAmount,
      },
    });
  } catch (error) {
    console.error('Error redeeming points:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to redeem points',
    });
  }
});

/**
 * GET /api/loyalty/validate-referral
 * Validate a referral code
 */
router.post('/validate-referral', validate(ValidateReferralSchema), async (req: Request, res: Response) => {
  try {
    const { referralCode } = req.body;

    const { LoyaltyPoints } = await import('../models/LoyaltyPoints');
    const loyalty = await LoyaltyPoints.findOne({ referralCode });

    if (!loyalty) {
      res.status(404).json({
        success: false,
        message: 'Invalid referral code',
        valid: false,
      });
      return;
    }

    res.json({
      success: true,
      valid: true,
      data: {
        referralCode: loyalty.referralCode,
        customerName: loyalty.customerName,
        tier: loyalty.tier,
      },
    });
  } catch (error) {
    console.error('Error validating referral:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate referral code',
    });
  }
});

/**
 * GET /api/loyalty/tiers
 * Get all tier information
 */
router.get('/tiers', async (_req: Request, res: Response) => {
  try {
    const tiers = ['Silver', 'Gold', 'Platinum'].map((tier) => {
      const benefits = loyaltyService.getTierBenefits(tier as unknown);
      return {
        name: tier,
        ...benefits,
      };
    });

    res.json({
      success: true,
      data: {
        tiers,
        redemptionRate: '100 points = $1.00',
      },
    });
  } catch (error) {
    console.error('Error getting tiers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tier information',
    });
  }
});

/**
 * GET /api/loyalty/leaderboard/:salonId
 * Get top customers by points for a salon (mock implementation)
 */
router.get('/leaderboard/:salonId', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    // In a real implementation, this would aggregate check-ins by salon
    // For now, return top customers by total points across all salons
    const { LoyaltyPoints } = await import('../models/LoyaltyPoints');

    const topCustomers = await LoyaltyPoints.find()
      .sort({ totalPoints: -1 })
      .limit(limit)
      .select('customerId customerName tier totalPoints lifetimeVisits');

    res.json({
      success: true,
      data: {
        salonId,
        leaderboard: topCustomers.map((c, index) => ({
          rank: index + 1,
          customerId: c.customerId,
          customerName: c.customerName,
          tier: c.tier,
          totalPoints: c.totalPoints,
          lifetimeVisits: c.lifetimeVisits,
        })),
      },
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
    });
  }
});

export default router;
