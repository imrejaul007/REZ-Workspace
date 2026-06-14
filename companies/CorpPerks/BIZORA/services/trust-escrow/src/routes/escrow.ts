import { Router, Response } from 'express';
import { z } from 'zod';
import { escrowService } from '../services/escrowService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createEscrowSchema = z.object({
  buyerId: z.string().min(1, 'Buyer ID is required'),
  sellerId: z.string().min(1, 'Seller ID is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().optional().default('INR'),
  description: z.string().min(1, 'Description is required'),
  conditions: z.array(z.object({
    type: z.enum(['delivery', 'approval', 'milestone', 'custom']),
    description: z.string().min(1, 'Condition description is required')
  })).optional().default([]),
  milestones: z.array(z.object({
    name: z.string().min(1),
    amount: z.number().positive()
  })).optional().default([]),
  feeConfig: z.object({
    percentage: z.number().min(0).max(100).optional(),
    fixed: z.number().min(0).optional(),
    chargedTo: z.enum(['buyer', 'seller', 'split']).optional()
  }).optional(),
  arbiterId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional()
});

const releaseEscrowSchema = z.object({
  releasedBy: z.string().min(1),
  role: z.enum(['buyer', 'seller', 'arbiter']),
  reason: z.string().optional(),
  milestoneName: z.string().optional()
});

const refundEscrowSchema = z.object({
  refundedBy: z.string().min(1),
  reason: z.string().min(1, 'Refund reason is required')
});

const disputeEscrowSchema = z.object({
  disputedBy: z.string().min(1),
  reason: z.string().min(1, 'Dispute reason is required')
});

const resolveDisputeSchema = z.object({
  resolvedBy: z.string().min(1),
  resolution: z.enum(['release_to_seller', 'refund_to_buyer', 'split']),
  splitPercentage: z.number().min(0).max(100).optional()
});

const completeConditionSchema = z.object({
  completedBy: z.string().min(1),
  role: z.enum(['buyer', 'seller', 'arbiter']),
  conditionIndex: z.number().int().min(0)
});

const fundEscrowSchema = z.object({
  funderId: z.string().min(1, 'Funder ID is required')
});

// Response helper
const sendError = (res: Response, statusCode: number, error: string, message: string) => {
  res.status(statusCode).json({
    success: false,
    error,
    message
  });
};

const sendSuccess = (res: Response, data: unknown, message = 'Success') => {
  res.json({
    success: true,
    message,
    data
  });
};

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/escrow/create
 * Create a new escrow
 */
router.post('/create', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createEscrowSchema.parse(req.body);

    const escrow = await escrowService.createEscrow({
      buyerId: validatedData.buyerId,
      sellerId: validatedData.sellerId,
      amount: validatedData.amount,
      currency: validatedData.currency,
      description: validatedData.description,
      conditions: validatedData.conditions,
      milestones: validatedData.milestones,
      feeConfig: validatedData.feeConfig,
      arbiterId: validatedData.arbiterId,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
      metadata: validatedData.metadata
    });

    logger.info('Escrow created via API', {
      escrowId: escrow.escrowId,
      createdBy: req.user?.userId
    });

    sendSuccess(res, {
      escrowId: escrow.escrowId,
      status: escrow.status,
      amount: escrow.amount,
      currency: escrow.currency,
      buyerId: escrow.buyerId,
      sellerId: escrow.sellerId,
      createdAt: escrow.createdAt
    }, 'Escrow created successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors.map(e => e.message).join(', '));
      return;
    }

    logger.error('Error creating escrow', { error });
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create escrow');
  }
});

/**
 * GET /api/escrow/:id
 * Get escrow details
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const escrow = await escrowService.getEscrowById(id);

    if (!escrow) {
      sendError(res, 404, 'NOT_FOUND', 'Escrow not found');
      return;
    }

    // Check if user is part of this escrow
    if (![escrow.buyerId, escrow.sellerId, escrow.arbiterId].includes(userId)) {
      // In production, check for admin role
      sendError(res, 403, 'FORBIDDEN', 'You are not authorized to view this escrow');
      return;
    }

    sendSuccess(res, {
      escrowId: escrow.escrowId,
      buyerId: escrow.buyerId,
      sellerId: escrow.sellerId,
      arbiterId: escrow.arbiterId,
      amount: escrow.amount,
      currency: escrow.currency,
      description: escrow.description,
      status: escrow.status,
      conditions: escrow.conditions,
      milestones: escrow.milestones,
      feeConfig: escrow.feeConfig,
      platformFee: escrow.platformFee,
      documents: escrow.documents,
      dispute: escrow.dispute,
      auditLog: escrow.auditLog,
      metadata: escrow.metadata,
      createdAt: escrow.createdAt,
      updatedAt: escrow.updatedAt,
      fundedAt: escrow.fundedAt,
      releasedAt: escrow.releasedAt,
      refundedAt: escrow.refundedAt,
      expiresAt: escrow.expiresAt
    });
  } catch (error) {
    logger.error('Error fetching escrow', { error, escrowId: req.params.id });
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch escrow');
  }
});

/**
 * POST /api/escrow/:id/fund
 * Fund an escrow
 */
router.post('/:id/fund', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = fundEscrowSchema.parse(req.body);

    const escrow = await escrowService.fundEscrow(id, validatedData.funderId);

    sendSuccess(res, {
      escrowId: escrow.escrowId,
      status: escrow.status,
      fundedAt: escrow.fundedAt
    }, 'Escrow funded successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors.map(e => e.message).join(', '));
      return;
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to fund escrow';
    const statusCode = errorMessage.includes('NOT_FOUND') ? 404 :
                      errorMessage.includes('ONLY_BUYER') ? 403 :
                      errorMessage.includes('EXPIRED') ? 410 : 400;

    logger.error('Error funding escrow', { error, escrowId: id });
    sendError(res, statusCode, 'FUND_ERROR', errorMessage);
  }
});

/**
 * POST /api/escrow/:id/release
 * Release funds to seller
 */
router.post('/:id/release', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = releaseEscrowSchema.parse(req.body);

    const escrow = await escrowService.releaseEscrow({
      escrowId: id,
      releasedBy: validatedData.releasedBy,
      role: validatedData.role,
      reason: validatedData.reason,
      milestoneName: validatedData.milestoneName
    });

    logger.info('Escrow released via API', {
      escrowId: id,
      releasedBy: validatedData.releasedBy
    });

    sendSuccess(res, {
      escrowId: escrow.escrowId,
      status: escrow.status,
      releasedAt: escrow.releasedAt
    }, 'Funds released successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors.map(e => e.message).join(', '));
      return;
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to release escrow';
    const statusCode = errorMessage.includes('NOT_FOUND') ? 404 :
                      errorMessage.includes('UNAUTHORIZED') ? 403 :
                      errorMessage.includes('CONDITIONS') ? 400 : 500;

    logger.error('Error releasing escrow', { error, escrowId: id });
    sendError(res, statusCode, 'RELEASE_ERROR', errorMessage);
  }
});

/**
 * POST /api/escrow/:id/refund
 * Refund funds to buyer
 */
router.post('/:id/refund', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = refundEscrowSchema.parse(req.body);

    const escrow = await escrowService.refundEscrow({
      escrowId: id,
      refundedBy: validatedData.refundedBy,
      reason: validatedData.reason
    });

    logger.info('Escrow refunded via API', {
      escrowId: id,
      refundedBy: validatedData.refundedBy
    });

    sendSuccess(res, {
      escrowId: escrow.escrowId,
      status: escrow.status,
      refundedAt: escrow.refundedAt
    }, 'Funds refunded successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors.map(e => e.message).join(', '));
      return;
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to refund escrow';
    const statusCode = errorMessage.includes('NOT_FOUND') ? 404 :
                      errorMessage.includes('ONLY_BUYER') ? 403 : 400;

    logger.error('Error refunding escrow', { error, escrowId: id });
    sendError(res, statusCode, 'REFUND_ERROR', errorMessage);
  }
});

/**
 * GET /api/escrow/:id/status
 * Check escrow status
 */
router.get('/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const status = await escrowService.getEscrowStatus(id);

    sendSuccess(res, status);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get status';

    if (errorMessage.includes('NOT_FOUND')) {
      sendError(res, 404, 'NOT_FOUND', 'Escrow not found');
      return;
    }

    logger.error('Error getting escrow status', { error, escrowId: id });
    sendError(res, 500, 'INTERNAL_ERROR', errorMessage);
  }
});

/**
 * POST /api/escrow/:id/dispute
 * File a dispute
 */
router.post('/:id/dispute', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = disputeEscrowSchema.parse(req.body);

    const escrow = await escrowService.disputeEscrow({
      escrowId: id,
      disputedBy: validatedData.disputedBy,
      reason: validatedData.reason
    });

    logger.info('Dispute filed via API', {
      escrowId: id,
      disputedBy: validatedData.disputedBy
    });

    sendSuccess(res, {
      escrowId: escrow.escrowId,
      status: escrow.status,
      dispute: escrow.dispute
    }, 'Dispute filed successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors.map(e => e.message).join(', '));
      return;
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to file dispute';
    const statusCode = errorMessage.includes('NOT_FOUND') ? 404 :
                      errorMessage.includes('UNAUTHORIZED') ? 403 : 400;

    logger.error('Error filing dispute', { error, escrowId: id });
    sendError(res, statusCode, 'DISPUTE_ERROR', errorMessage);
  }
});

/**
 * POST /api/escrow/:id/resolve
 * Resolve a dispute
 */
router.post('/:id/resolve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = resolveDisputeSchema.parse(req.body);

    const escrow = await escrowService.resolveDispute(
      id,
      validatedData.resolvedBy,
      validatedData.resolution,
      validatedData.splitPercentage
    );

    logger.info('Dispute resolved via API', {
      escrowId: id,
      resolvedBy: validatedData.resolvedBy
    });

    sendSuccess(res, {
      escrowId: escrow.escrowId,
      status: escrow.status,
      dispute: escrow.dispute
    }, 'Dispute resolved successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors.map(e => e.message).join(', '));
      return;
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to resolve dispute';
    const statusCode = errorMessage.includes('NOT_FOUND') ? 404 :
                      errorMessage.includes('ONLY_ARBITER') ? 403 :
                      errorMessage.includes('NOT_UNDER_DISPUTE') ? 400 : 500;

    logger.error('Error resolving dispute', { error, escrowId: id });
    sendError(res, statusCode, 'RESOLVE_ERROR', errorMessage);
  }
});

/**
 * POST /api/escrow/:id/condition
 * Mark a condition as completed
 */
router.post('/:id/condition', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = completeConditionSchema.parse(req.body);

    const escrow = await escrowService.completeCondition(
      id,
      validatedData.conditionIndex,
      validatedData.completedBy,
      validatedData.role
    );

    logger.info('Condition completed via API', {
      escrowId: id,
      conditionIndex: validatedData.conditionIndex
    });

    sendSuccess(res, {
      escrowId: escrow.escrowId,
      conditions: escrow.conditions
    }, 'Condition marked as completed');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors.map(e => e.message).join(', '));
      return;
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to complete condition';
    sendError(res, 400, 'CONDITION_ERROR', errorMessage);
  }
});

/**
 * GET /api/escrow/user/:userId
 * List escrows for a user
 */
router.get('/user/:userId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { status, limit, skip } = req.query;

    const result = await escrowService.listEscrowsByUser(userId, {
      status: status as any,
      limit: limit ? parseInt(limit as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined
    });

    sendSuccess(res, result);
  } catch (error) {
    logger.error('Error listing escrows', { error });
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to list escrows');
  }
});

export default router;