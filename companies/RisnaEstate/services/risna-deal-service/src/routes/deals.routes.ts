import { Router, Request, Response } from 'express';
import { dealController } from '../controllers/deal.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { writeLimiter, bulkLimiter } from '../middleware/rate-limiter.middleware';
import {
  createDealSchema,
  updateDealSchema,
  updateStageSchema,
  createOfferSchema,
  updateOfferSchema,
  addPaymentMilestoneSchema,
  updatePaymentMilestoneSchema,
  addHandoverItemSchema,
  completeHandoverItemSchema,
  queryDealsSchema,
  pipelineQuerySchema,
  aiScoreSchema,
  bulkStageUpdateSchema,
  bulkStatusUpdateSchema,
  analyticsQuerySchema,
} from '../schemas/deal.validation';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ==============================================
// DEAL CRUD
// ==============================================

/**
 * @route POST /api/v1/deals
 * @desc Create a new deal
 * @access Private
 */
router.post(
  '/',
  writeLimiter,
  validateBody(createDealSchema),
  asyncHandler(async (req, res) => dealController.createDeal(req, res))
);

/**
 * @route GET /api/v1/deals
 * @desc Query deals with filters and pagination
 * @access Private
 */
router.get(
  '/',
  validateQuery(queryDealsSchema),
  asyncHandler(async (req, res) => dealController.queryDeals(req, res))
);

/**
 * @route GET /api/v1/deals/pipeline
 * @desc Get deals organized by pipeline stage
 * @access Private
 */
router.get(
  '/pipeline',
  validateQuery(pipelineQuerySchema),
  asyncHandler(async (req, res) => dealController.getPipeline(req, res))
);

/**
 * @route GET /api/v1/deals/stats
 * @desc Get deal statistics
 * @access Private
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => dealController.getStats(req, res))
);

/**
 * @route GET /api/v1/deals/analytics
 * @desc Get deal analytics
 * @access Private
 */
router.get(
  '/analytics',
  validateQuery(analyticsQuerySchema),
  asyncHandler(async (req, res) => dealController.getAnalytics(req, res))
);

/**
 * @route GET /api/v1/deals/:dealId
 * @desc Get deal by ID
 * @access Private
 */
router.get(
  '/:dealId',
  asyncHandler(async (req, res) => dealController.getDeal(req, res))
);

/**
 * @route PATCH /api/v1/deals/:dealId
 * @desc Update deal
 * @access Private
 */
router.patch(
  '/:dealId',
  writeLimiter,
  validateBody(updateDealSchema),
  asyncHandler(async (req, res) => dealController.updateDeal(req, res))
);

/**
 * @route DELETE /api/v1/deals/:dealId
 * @desc Delete deal (soft delete)
 * @access Private (Admin only)
 */
router.delete(
  '/:dealId',
  writeLimiter,
  requireRole('admin', 'superadmin'),
  asyncHandler(async (req, res) => dealController.deleteDeal(req, res))
);

// ==============================================
// STAGE MANAGEMENT
// ==============================================

/**
 * @route PATCH /api/v1/deals/:dealId/stage
 * @desc Update deal stage
 * @access Private
 */
router.patch(
  '/:dealId/stage',
  writeLimiter,
  validateBody(updateStageSchema),
  asyncHandler(async (req, res) => dealController.updateStage(req, res))
);

// ==============================================
// OFFER MANAGEMENT
// ==============================================

/**
 * @route POST /api/v1/deals/:dealId/offers
 * @desc Add offer to deal
 * @access Private
 */
router.post(
  '/:dealId/offers',
  writeLimiter,
  validateBody(createOfferSchema),
  asyncHandler(async (req, res) => dealController.addOffer(req, res))
);

/**
 * @route PATCH /api/v1/deals/:dealId/offers/:offerId
 * @desc Update offer status
 * @access Private
 */
router.patch(
  '/:dealId/offers/:offerId',
  writeLimiter,
  validateBody(updateOfferSchema),
  asyncHandler(async (req, res) => dealController.updateOffer(req, res))
);

// ==============================================
// PAYMENT MILESTONE MANAGEMENT
// ==============================================

/**
 * @route POST /api/v1/deals/:dealId/milestones
 * @desc Add payment milestone
 * @access Private
 */
router.post(
  '/:dealId/milestones',
  writeLimiter,
  validateBody(addPaymentMilestoneSchema),
  asyncHandler(async (req, res) => dealController.addPaymentMilestone(req, res))
);

/**
 * @route PATCH /api/v1/deals/:dealId/milestones/:milestoneId
 * @desc Update payment milestone
 * @access Private
 */
router.patch(
  '/:dealId/milestones/:milestoneId',
  writeLimiter,
  validateBody(updatePaymentMilestoneSchema),
  asyncHandler(async (req, res) => dealController.updatePaymentMilestone(req, res))
);

// ==============================================
// HANDOVER MANAGEMENT
// ==============================================

/**
 * @route POST /api/v1/deals/:dealId/handover
 * @desc Add handover checklist item
 * @access Private
 */
router.post(
  '/:dealId/handover',
  writeLimiter,
  validateBody(addHandoverItemSchema),
  asyncHandler(async (req, res) => dealController.addHandoverItem(req, res))
);

/**
 * @route PATCH /api/v1/deals/:dealId/handover/:itemId
 * @desc Update handover checklist item
 * @access Private
 */
router.patch(
  '/:dealId/handover/:itemId',
  writeLimiter,
  validateBody(completeHandoverItemSchema),
  asyncHandler(async (req, res) => dealController.completeHandoverItem(req, res))
);

// ==============================================
// TIMELINE
// ==============================================

/**
 * @route GET /api/v1/deals/:dealId/timeline
 * @desc Get deal timeline
 * @access Private
 */
router.get(
  '/:dealId/timeline',
  asyncHandler(async (req, res) => dealController.getTimeline(req, res))
);

// ==============================================
// AI SCORING
// ==============================================

/**
 * @route POST /api/v1/deals/:dealId/score
 * @desc Calculate AI score for deal
 * @access Private
 */
router.post(
  '/:dealId/score',
  validateBody(aiScoreSchema),
  asyncHandler(async (req, res) => dealController.scoreDeal(req, res))
);

/**
 * @route POST /api/v1/deals/batch-score
 * @desc Batch score deals
 * @access Private
 */
router.post(
  '/batch-score',
  bulkLimiter,
  asyncHandler(async (req, res) => dealController.batchScoreDeals(req, res))
);

// ==============================================
// BULK OPERATIONS
// ==============================================

/**
 * @route PATCH /api/v1/deals/bulk/stage
 * @desc Bulk update deal stages
 * @access Private (Admin/Broker Manager)
 */
router.patch(
  '/bulk/stage',
  bulkLimiter,
  validateBody(bulkStageUpdateSchema),
  requireRole('admin', 'broker_manager'),
  asyncHandler(async (req, res) => dealController.bulkUpdateStage(req, res))
);

/**
 * @route PATCH /api/v1/deals/bulk/status
 * @desc Bulk update deal status
 * @access Private (Admin/Broker Manager)
 */
router.patch(
  '/bulk/status',
  bulkLimiter,
  validateBody(bulkStatusUpdateSchema),
  requireRole('admin', 'broker_manager'),
  asyncHandler(async (req, res) => dealController.bulkUpdateStatus(req, res))
);

export default router;