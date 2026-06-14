import { Router, Request, Response, NextFunction } from 'express';
import { membershipService } from '../services/MembershipService';
import { redemptionService } from '../services/RedemptionService';
import {
  createMembershipSchema,
  updateMembershipSchema,
  membershipQuerySchema,
  renewMembershipSchema,
  addFamilyMemberSchema,
  createRedemptionSchema,
} from '../schemas/membership.schemas';
import { redemptionQuerySchema } from '../schemas/redemption.schemas';
import { AppError } from '../middleware/errorHandler';
import { verifyInternalToken } from '../config/env';

const router = Router();

// Internal auth middleware
const internalAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-internal-token'] as string;
  if (!token || !verifyInternalToken(token)) {
    return next(new AppError('Unauthorized', 401));
  }
  next();
};

// ==================== MEMBERSHIP ROUTES ====================

/**
 * @route POST /api/v1/memberships
 * @desc Create a new membership
 */
router.post('/', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createMembershipSchema.parse(req.body);
    const membership = await membershipService.createMembership(validated);

    res.status(201).json({
      success: true,
      data: membership,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/memberships
 * @desc List memberships with filtering
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = membershipQuerySchema.parse(req.query);
    const result = await membershipService.listMemberships(query);

    res.json({
      success: true,
      data: result.memberships,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/memberships/expiring
 * @desc Get memberships expiring soon (for notifications)
 */
router.get('/expiring', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const memberships = await membershipService.getExpiringMemberships(days);

    res.json({
      success: true,
      data: memberships,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/memberships/auto-renewal
 * @desc Get memberships with auto-renewal enabled
 */
router.get('/auto-renewal', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberships = await membershipService.getAutoRenewingMemberships();

    res.json({
      success: true,
      data: memberships,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/memberships/user/:userId
 * @desc Get active membership for user
 */
router.get('/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const salonId = req.query.salonId as string;

    if (!salonId) {
      return next(new AppError('salonId query parameter is required', 400));
    }

    const membership = await membershipService.getActiveMembershipForUser(userId, salonId);

    res.json({
      success: true,
      data: membership,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/memberships/:membershipId
 * @desc Get membership by ID
 */
router.get('/:membershipId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const membership = await membershipService.getMembershipById(req.params.membershipId);

    res.json({
      success: true,
      data: membership,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/v1/memberships/:membershipId
 * @desc Update membership
 */
router.put('/:membershipId', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = updateMembershipSchema.parse(req.body);
    const membership = await membershipService.updateMembership(req.params.membershipId, validated);

    res.json({
      success: true,
      data: membership,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/memberships/:membershipId/renew
 * @desc Renew membership
 */
router.post('/:membershipId/renew', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = renewMembershipSchema.parse(req.body);
    const membership = await membershipService.renewMembership(
      validated.membershipId,
      validated.paymentId,
      validated.renewalType
    );

    res.json({
      success: true,
      data: membership,
      message: 'Membership renewed successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/memberships/:membershipId/cancel
 * @desc Cancel membership
 */
router.post('/:membershipId/cancel', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const membership = await membershipService.cancelMembership(req.params.membershipId, reason);

    res.json({
      success: true,
      data: membership,
      message: 'Membership cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/memberships/:membershipId/auto-renewal
 * @desc Enable/disable auto-renewal
 */
router.post('/:membershipId/auto-renewal', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return next(new AppError('enabled boolean is required', 400));
    }

    const membership = await membershipService.setAutoRenewal(req.params.membershipId, enabled);

    res.json({
      success: true,
      data: membership,
      message: `Auto-renewal ${enabled ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/memberships/:membershipId/family
 * @desc Add family member to membership
 */
router.post('/:membershipId/family', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = addFamilyMemberSchema.parse(req.body);
    const membership = await membershipService.addFamilyMember(req.params.membershipId, validated);

    res.json({
      success: true,
      data: membership,
      message: 'Family member added successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/v1/memberships/:membershipId/family/:memberName
 * @desc Remove family member from membership
 */
router.delete('/:membershipId/family/:memberName', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const membership = await membershipService.removeFamilyMember(
      req.params.membershipId,
      req.params.memberName
    );

    res.json({
      success: true,
      data: membership,
      message: 'Family member removed successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ==================== REDEMPTION ROUTES ====================

/**
 * @route POST /api/v1/memberships/redemptions
 * @desc Create a new redemption
 */
router.post('/redemptions', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createRedemptionSchema.parse(req.body);
    const redemption = await redemptionService.createRedemption(validated);

    res.status(201).json({
      success: true,
      data: redemption,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/memberships/redemptions
 * @desc List redemptions with filtering
 */
router.get('/redemptions', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = redemptionQuerySchema.parse(req.query);
    const result = await redemptionService.listRedemptions(query);

    res.json({
      success: true,
      data: result.redemptions,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/memberships/redemptions/:redemptionId
 * @desc Get redemption by ID
 */
router.get('/redemptions/:redemptionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const redemption = await redemptionService.getRedemptionById(req.params.redemptionId);

    res.json({
      success: true,
      data: redemption,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/memberships/redemptions/:redemptionId/complete
 * @desc Complete a redemption
 */
router.post('/redemptions/:redemptionId/complete', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stylistId, notes } = req.body;
    const redemption = await redemptionService.completeRedemption(req.params.redemptionId, stylistId, notes);

    res.json({
      success: true,
      data: redemption,
      message: 'Redemption completed successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/memberships/redemptions/:redemptionId/cancel
 * @desc Cancel a redemption
 */
router.post('/redemptions/:redemptionId/cancel', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return next(new AppError('reason is required', 400));
    }

    const redemption = await redemptionService.cancelRedemption(req.params.redemptionId, reason);

    res.json({
      success: true,
      data: redemption,
      message: 'Redemption cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/memberships/redemptions/:redemptionId/refund
 * @desc Refund a redemption
 */
router.post('/redemptions/:redemptionId/refund', internalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return next(new AppError('reason is required', 400));
    }

    const redemption = await redemptionService.refundRedemption(req.params.redemptionId, reason);

    res.json({
      success: true,
      data: redemption,
      message: 'Redemption refunded successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/memberships/user/:userId/redemptions
 * @desc Get user redemption history
 */
router.get('/user/:userId/redemptions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const redemptions = await redemptionService.getUserRedemptionHistory(req.params.userId, limit);

    res.json({
      success: true,
      data: redemptions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/memberships/redemptions/appointment/:appointmentId
 * @desc Get redemption by appointment ID
 */
router.get('/redemptions/appointment/:appointmentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const redemption = await redemptionService.getRedemptionByAppointment(req.params.appointmentId);

    res.json({
      success: true,
      data: redemption,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
