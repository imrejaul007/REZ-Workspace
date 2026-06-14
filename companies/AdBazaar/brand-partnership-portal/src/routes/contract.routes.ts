/**
 * Contract Routes
 */

import { Router, Response } from 'express';
import { contractService } from '../services';
import { verifyAuth, AuthenticatedRequest, asyncHandler, AppError } from '../middleware';
import { validateBody } from '../middleware';
import { contractCreateSchema } from '../utils/validation';
import logger from 'utils/logger.js';

const router = Router();

/**
 * POST /api/contracts
 * Create contract
 */
router.post('/',
  verifyAuth,
  validateBody(contractCreateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const contract = await contractService.createContract(req.body);
    res.status(201).json({
      success: true,
      data: contract
    });
  })
);

/**
 * GET /api/contracts/:id
 * Get contract by ID
 */
router.get('/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const contract = await contractService.getContractById(req.params.id);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }
    res.json({
      success: true,
      data: contract
    });
  })
);

/**
 * POST /api/contracts/:id/sign
 * Sign contract
 */
router.post('/:id/sign',
  verifyAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const contract = await contractService.getContractById(req.params.id);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    const signedBy = req.body.signedBy || 'brand';
    const signedContract = await contractService.signContract(req.params.id, signedBy);
    res.json({
      success: true,
      data: signedContract,
      message: 'Contract signed successfully'
    });
  })
);

/**
 * POST /api/contracts/:id/complete
 * Complete contract
 */
router.post('/:id/complete',
  verifyAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const contract = await contractService.completeContract(req.params.id);
    res.json({
      success: true,
      data: contract,
      message: 'Contract completed'
    });
  })
);

/**
 * POST /api/contracts/:id/cancel
 * Cancel contract
 */
router.post('/:id/cancel',
  verifyAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { reason } = req.body;
    const contract = await contractService.cancelContract(req.params.id, reason);
    res.json({
      success: true,
      data: contract,
      message: 'Contract cancelled'
    });
  })
);

/**
 * POST /api/contracts/:id/deliverable/:index/complete
 * Mark deliverable as completed
 */
router.post('/:id/deliverable/:index/complete',
  verifyAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const index = parseInt(req.params.index);
    const contract = await contractService.completeDeliverable(req.params.id, index);
    res.json({
      success: true,
      data: contract,
      message: 'Deliverable marked as completed'
    });
  })
);

/**
 * POST /api/contracts/:id/payment/:index/complete
 * Mark payment as completed
 */
router.post('/:id/payment/:index/complete',
  verifyAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const index = parseInt(req.params.index);
    const contract = await contractService.completePayment(req.params.id, index);
    res.json({
      success: true,
      data: contract,
      message: 'Payment marked as completed'
    });
  })
);

/**
 * GET /api/contracts/proposal/:proposalId
 * Get contracts by proposal ID
 */
router.get('/proposal/:proposalId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const contracts = await contractService.getContractsByProposalId(req.params.proposalId);
    res.json({
      success: true,
      data: contracts
    });
  })
);

/**
 * GET /api/contracts/campaign/:campaignId
 * Get contracts by campaign ID
 */
router.get('/campaign/:campaignId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const contracts = await contractService.getContractsByCampaignId(req.params.campaignId);
    res.json({
      success: true,
      data: contracts
    });
  })
);

/**
 * GET /api/contracts/influencer/:influencerId
 * Get contracts by influencer ID
 */
router.get('/influencer/:influencerId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const contracts = await contractService.getContractsByInfluencerId(req.params.influencerId);
    res.json({
      success: true,
      data: contracts
    });
  })
);

export default router;