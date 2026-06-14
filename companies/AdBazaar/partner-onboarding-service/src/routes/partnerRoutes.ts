import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { partnerService } from '../services/partnerService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Validation schemas
const createPartnerSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['agency', 'publisher', 'reseller', 'technology', 'influencer']),
  companyDetails: z.object({
    name: z.string().min(1),
    legalName: z.string().optional(),
    website: z.string().url().optional(),
    industry: z.string().min(1),
    employeeCount: z.string().optional(),
    annualRevenue: z.string().optional(),
  }),
  contact: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(10),
    designation: z.string().min(1),
  }),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().optional(),
    pincode: z.string().min(1),
  }),
  taxInfo: z.object({
    gstin: z.string().optional(),
    pan: z.string().optional(),
    tan: z.string().optional(),
  }).optional(),
  bankDetails: z.object({
    accountHolder: z.string().min(1),
    accountNumber: z.string().min(1),
    bankName: z.string().min(1),
    branch: z.string().min(1),
    ifscCode: z.string().min(1),
    upiId: z.string().optional(),
  }).optional(),
  referralCode: z.string().optional(),
  referredBy: z.string().optional(),
});

const updatePartnerSchema = createPartnerSchema.partial();

/**
 * POST /api/partners
 * Create a new partner
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const input = createPartnerSchema.parse(req.body);
    const partner = await partnerService.createPartner(input);

    res.status(201).json({
      success: true,
      data: partner,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create partner',
    });
  }
});

/**
 * GET /api/partners
 * Get all partners
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', status, type, tier } = req.query;

    const result = await partnerService.getAllPartners({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as any,
      type: type as any,
      tier: tier as any,
    });

    res.json({
      success: true,
      data: result.partners,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch partners',
    });
  }
});

/**
 * GET /api/partners/:id
 * Get partner by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const partner = await partnerService.getPartner(req.params.id);

    if (!partner) {
      res.status(404).json({
        success: false,
        error: 'Partner not found',
      });
      return;
    }

    res.json({
      success: true,
      data: partner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch partner',
    });
  }
});

/**
 * PUT /api/partners/:id
 * Update partner
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const input = updatePartnerSchema.parse(req.body);
    const partner = await partnerService.updatePartner(req.params.id, input);

    if (!partner) {
      res.status(404).json({
        success: false,
        error: 'Partner not found',
      });
      return;
    }

    res.json({
      success: true,
      data: partner,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update partner',
    });
  }
});

/**
 * POST /api/partners/:id/verify
 * Start partner verification
 */
router.post('/:id/verify', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { verificationTypes } = req.body;
    const { verificationService } = await import('../services/verificationService');

    const verifications = [];
    for (const type of verificationTypes) {
      const verification = await verificationService.createVerification({
        partnerId: req.params.id,
        type,
        data: { value: '' },
      });
      verifications.push(verification);
    }

    // Update partner status to under_review
    await partnerService.updatePartnerStatus(req.params.id, 'under_review');

    res.json({
      success: true,
      data: verifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start verification',
    });
  }
});

/**
 * GET /api/partners/:id/status
 * Get partner status and onboarding progress
 */
router.get('/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const status = await partnerService.getPartnerStatus(req.params.id);

    if (!status) {
      res.status(404).json({
        success: false,
        error: 'Partner not found',
      });
      return;
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch partner status',
    });
  }
});

/**
 * PATCH /api/partners/:id/tier
 * Update partner tier
 */
router.patch('/:id/tier', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { tier } = req.body;
    const partner = await partnerService.updatePartnerTier(req.params.id, tier);

    if (!partner) {
      res.status(404).json({
        success: false,
        error: 'Partner not found',
      });
      return;
    }

    res.json({
      success: true,
      data: partner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update partner tier',
    });
  }
});

export default router;