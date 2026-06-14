import { Router, Response } from 'express';
import { TenantRequest, requireTenant } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/index.js';
import { proposalService } from '../services/index.js';

const router = Router();

// All routes require tenant context
router.use(requireTenant);

// Create a new proposal
router.post(
  '/',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const createdBy = req.userId || 'system';
    const proposal = await proposalService.create(req.body, req.tenantId!, createdBy);
    res.status(201).json({
      success: true,
      data: proposal,
      message: 'Proposal created successfully',
    });
  })
);

// Get all proposals
router.get(
  '/',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const { proposals, total, page, limit } = await proposalService.findAll(req.tenantId!, req.query);
    res.json({
      success: true,
      data: proposals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// Get a single proposal by ID
router.get(
  '/:id',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const proposal = await proposalService.findById(req.tenantId!, req.params.id);
    if (!proposal) {
      res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
      return;
    }
    res.json({
      success: true,
      data: proposal,
    });
  })
);

// Update a proposal
router.patch(
  '/:id',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const updatedBy = req.userId || 'system';
    const proposal = await proposalService.update(req.tenantId!, req.params.id, req.body, updatedBy);
    if (!proposal) {
      res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
      return;
    }
    res.json({
      success: true,
      data: proposal,
      message: 'Proposal updated successfully',
    });
  })
);

// Send proposal to client
router.post(
  '/:id/send',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const sentBy = req.userId || 'system';
    const proposal = await proposalService.send(req.tenantId!, req.params.id, sentBy);
    if (!proposal) {
      res.status(404).json({
        success: false,
        error: 'Proposal not found or already sent',
      });
      return;
    }
    res.json({
      success: true,
      data: proposal,
      message: 'Proposal sent successfully',
    });
  })
);

// Get proposal for signature
router.get(
  '/:id/sign',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const proposal = await proposalService.getForSignature(req.tenantId!, req.params.id);
    if (!proposal) {
      res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
      return;
    }
    res.json({
      success: true,
      data: proposal,
    });
  })
);

// Accept proposal with signature
router.post(
  '/:id/accept',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const { signatureData } = req.body;
    const acceptedBy = req.userId || 'system';
    const proposal = await proposalService.accept(req.tenantId!, req.params.id, signatureData, acceptedBy);
    if (!proposal) {
      res.status(404).json({
        success: false,
        error: 'Proposal not found or cannot be accepted',
      });
      return;
    }
    res.json({
      success: true,
      data: proposal,
      message: 'Proposal accepted successfully',
    });
  })
);

// Reject proposal
router.post(
  '/:id/reject',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const rejectedBy = req.userId || 'system';
    const proposal = await proposalService.reject(req.tenantId!, req.params.id, rejectedBy);
    if (!proposal) {
      res.status(404).json({
        success: false,
        error: 'Proposal not found or cannot be rejected',
      });
      return;
    }
    res.json({
      success: true,
      data: proposal,
      message: 'Proposal rejected',
    });
  })
);

export default router;
