import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { verificationService } from '../services/verificationService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Validation schemas
const createVerificationSchema = z.object({
  partnerId: z.string().min(1),
  type: z.enum(['email', 'phone', 'gstin', 'pan', 'bank', 'address', 'document', 'kyc']),
  data: z.object({
    value: z.string().min(1),
    referenceNumber: z.string().optional(),
  }),
  verificationMethod: z.enum(['automated', 'manual', 'third_party', 'otp']).optional(),
});

const completeVerificationSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  verifiedBy: z.string().optional(),
});

/**
 * POST /api/verifications
 * Create a new verification
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const input = createVerificationSchema.parse(req.body);
    const verification = await verificationService.createVerification(input);

    res.status(201).json({
      success: true,
      data: verification,
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
      error: 'Failed to create verification',
    });
  }
});

/**
 * GET /api/verifications/:id
 * Get verification by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const verification = await verificationService.getVerification(req.params.id);

    if (!verification) {
      res.status(404).json({
        success: false,
        error: 'Verification not found',
      });
      return;
    }

    res.json({
      success: true,
      data: verification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch verification',
    });
  }
});

/**
 * POST /api/verifications/:id/start
 * Start verification process
 */
router.post('/:id/start', authMiddleware, async (req: Request, res: Response) => {
  try {
    const verification = await verificationService.startVerification(req.params.id);

    if (!verification) {
      res.status(404).json({
        success: false,
        error: 'Verification not found or already started',
      });
      return;
    }

    res.json({
      success: true,
      data: verification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start verification',
    });
  }
});

/**
 * POST /api/verifications/:id/complete
 * Complete verification
 */
router.post('/:id/complete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const input = completeVerificationSchema.parse(req.body);
    const verification = await verificationService.completeVerification(req.params.id, input);

    if (!verification) {
      res.status(404).json({
        success: false,
        error: 'Verification not found',
      });
      return;
    }

    res.json({
      success: true,
      data: verification,
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
      error: 'Failed to complete verification',
    });
  }
});

/**
 * POST /api/verifications/:id/send-otp
 * Send OTP for verification
 */
router.post('/:id/send-otp', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await verificationService.sendOTP(req.params.id);

    res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP',
    });
  }
});

/**
 * POST /api/verifications/:id/verify-otp
 * Verify OTP
 */
router.post('/:id/verify-otp', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;
    const result = await verificationService.verifyOTP(req.params.id, otp);

    res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP',
    });
  }
});

/**
 * GET /api/verifications/partner/:partnerId
 * Get verifications for a partner
 */
router.get('/partner/:partnerId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { type, status } = req.query;
    const verifications = await verificationService.getVerificationsByPartner(req.params.partnerId, {
      type: type as any,
      status: status as any,
    });

    res.json({
      success: true,
      data: verifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch verifications',
    });
  }
});

/**
 * GET /api/verifications/partner/:partnerId/summary
 * Get verification summary for a partner
 */
router.get('/partner/:partnerId/summary', authMiddleware, async (req: Request, res: Response) => {
  try {
    const summary = await verificationService.getVerificationSummary(req.params.partnerId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch verification summary',
    });
  }
});

export default router;