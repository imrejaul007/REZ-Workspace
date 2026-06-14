import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { checkoutService } from '../services/checkoutService.js';
import { fraudService } from '../services/fraudService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const checkoutSchema = z.object({
  paymentMethod: z.enum(['upi', 'wallet', 'card', 'split']),
  coinsToRedeem: z.number().optional().default(0),
  exitLocation: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

const verifyExitSchema = z.object({
  exitCode: z.string().optional(),
});

/**
 * POST /api/checkout/:sessionId
 * Process checkout
 */
router.post('/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.body.userId;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validated = checkoutSchema.parse(req.body);
    const result = await checkoutService.checkout({
      sessionId,
      userId,
      paymentMethod: validated.paymentMethod,
      coinsToRedeem: validated.coinsToRedeem,
      exitLocation: validated.exitLocation,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      payment: result.payment,
      cashback: result.cashback,
      receipt: result.receipt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Checkout error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Checkout failed' });
  }
});

/**
 * POST /api/checkout/:sessionId/exit-verify
 * Verify exit
 */
router.post('/:sessionId/exit-verify', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.body.userId;
    const { sessionId } = req.params;
    const { exitCode } = verifyExitSchema.parse(req.body);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await checkoutService.verifyExit(sessionId, userId, exitCode);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      verified: result.verified,
      exitToken: result.exitToken,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Exit verify error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Exit verification failed' });
  }
});

/**
 * GET /api/checkout/:sessionId/exit-qr
 * Get exit QR code
 */
router.get('/:sessionId/exit-qr', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.query.userId as string;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { qrData, expiresAt } = await checkoutService.generateExitQR(sessionId, userId);

    res.json({
      success: true,
      qrData,
      expiresAt,
    });
  } catch (error) {
    console.error('Exit QR error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate exit QR' });
  }
});

/**
 * POST /api/checkout/verify-exit-qr
 * Verify exit QR code
 */
router.post('/verify-exit-qr', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { exitQR } = req.body;

    if (!exitQR) {
      return res.status(400).json({ error: 'exitQR is required' });
    }

    const result = await checkoutService.verifyExitQR(exitQR);

    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      sessionId: result.sessionId,
    });
  } catch (error) {
    console.error('Verify exit QR error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to verify exit QR' });
  }
});

/**
 * GET /api/checkout/:sessionId/receipt
 * Get receipt
 */
router.get('/:sessionId/receipt', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.query.userId as string;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const receipt = await checkoutService.getReceipt(sessionId, userId);

    res.json({
      success: true,
      receipt,
    });
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get receipt' });
  }
});

/**
 * GET /api/checkout/:sessionId/fraud-score
 * Get fraud score
 */
router.get('/:sessionId/fraud-score', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { realtime } = req.query;

    let result;
    if (realtime === 'true') {
      result = await fraudService.realtimeCheck(sessionId);
    } else {
      result = await fraudService.calculateFraudScore(sessionId);
    }

    res.json({
      success: true,
      fraudScore: result.score,
      risk: result.risk,
      requiresAudit: result.requiresAudit,
      factors: result.factors,
      recommendations: result.recommendations,
    });
  } catch (error) {
    console.error('Fraud score error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to calculate fraud score' });
  }
});

export default router;
