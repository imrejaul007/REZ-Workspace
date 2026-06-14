/**
 * Proposal Routes
 */

import { Router, Response } from 'express';
import { proposalService } from '../services';
import { verifyAuth, AuthenticatedRequest, asyncHandler, AppError } from '../middleware';
import { validateBody } from '../middleware';
import { proposalCreateSchema, proposalUpdateSchema, proposalActionSchema } from '../utils/validation';
import logger from 'utils/logger.js';

const router = Router();

/**
 * GET /api/proposals
 * List proposals
 */
router.get('/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit, campaignId, influencerId, brandId, status } = req.query as any;
    const result = await proposalService.listProposals({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      campaignId,
      influencerId,
      brandId,
      status
    });

    res.json({
      success: true,
      data: result.proposals,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages
      }
    });
  })
);

/**
 * POST /api/proposals
 * Submit proposal
 */
router.post('/',
  verifyAuth,
  validateBody(proposalCreateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const proposal = await proposalService.createProposal(req.body);
    res.status(201).json({
      success: true,
      data: proposal
    });
  })
);

/**
 * GET /api/proposals/:id
 * Get proposal by ID
 */
router.get('/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const proposal = await proposalService.getProposalById(req.params.id);
    if (!proposal) {
      throw new AppError('Proposal not found', 404);
    }
    res.json({
      success: true,
      data: proposal
    });
  })
);

/**
 * PATCH /api/proposals/:id
 * Update proposal
 */
router.patch('/:id',
  verifyAuth,
  validateBody(proposalUpdateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const proposal = await proposalService.getProposalById(req.params.id);
    if (!proposal) {
      throw new AppError('Proposal not found', 404);
    }

    // Only influencer can update their proposal
    if (proposal.influencerId !== req.userId && !req.isInternal) {
      throw new AppError('Access denied', 403);
    }

    const updatedProposal = await proposalService.updateProposal(req.params.id, req.body);
    res.json({
      success: true,
      data: updatedProposal
    });
  })
);

/**
 * POST /api/proposals/:id/accept
 * Accept proposal
 */
router.post('/:id/accept',
  verifyAuth,
  validateBody(proposalActionSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const proposal = await proposalService.getProposalById(req.params.id);
    if (!proposal) {
      throw new AppError('Proposal not found', 404);
    }

    const result = await proposalService.acceptProposal(req.params.id);
    res.json({
      success: true,
      data: {
        proposal: result.proposal,
        contractId: result.contractId
      },
      message: 'Proposal accepted successfully'
    });
  })
);

/**
 * POST /api/proposals/:id/reject
 * Reject proposal
 */
router.post('/:id/reject',
  verifyAuth,
  validateBody(proposalActionSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const proposal = await proposalService.getProposalById(req.params.id);
    if (!proposal) {
      throw new AppError('Proposal not found', 404);
    }

    const { reason } = req.body;
    const rejectedProposal = await proposalService.rejectProposal(req.params.id, reason);
    res.json({
      success: true,
      data: rejectedProposal,
      message: 'Proposal rejected'
    });
  })
);

/**
 * GET /api/proposals/campaign/:campaignId
 * Get proposals by campaign ID
 */
router.get('/campaign/:campaignId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const proposals = await proposalService.getProposalsByCampaignId(req.params.campaignId);
    res.json({
      success: true,
      data: proposals
    });
  })
);

/**
 * GET /api/proposals/influencer/:influencerId
 * Get proposals by influencer ID
 */
router.get('/influencer/:influencerId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const proposals = await proposalService.getProposalsByInfluencerId(req.params.influencerId);
    res.json({
      success: true,
      data: proposals
    });
  })
);

export default router;