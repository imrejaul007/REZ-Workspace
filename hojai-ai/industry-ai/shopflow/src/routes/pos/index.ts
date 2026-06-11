import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { checkoutAgent } from '../../services';
import { posSaleSchema } from '../../utils/validators';
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { posLimiter } from '../../middleware/rateLimit';

const router = Router();

const refundSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  })).optional(),
});

// POST /api/pos/sale - Quick POS sale
router.post('/sale', posLimiter, validate(posSaleSchema), async (req: Request, res: Response) => {
  try {
    const { customerId, items, paymentMethod, discountCode } = req.body;

    logger.info('POS sale initiated', { customerId, items: items.length, paymentMethod });

    const result = await checkoutAgent.processSale(
      items,
      customerId,
      paymentMethod,
      0, // No loyalty points by default in quick sale
      discountCode
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
        code: result.code,
      });
      return;
    }

    res.json({
      success: true,
      data: result.receipt,
      message: 'Sale completed successfully',
    });
  } catch (error: any) {
    logger.error('POS sale failed', { error });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process sale',
      code: 'POS_SALE_ERROR',
    });
  }
});

// POST /api/pos/session - Create checkout session
router.post('/session', posLimiter, async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;

    const session = await checkoutAgent.createSession(customerId);

    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    logger.error('Create session failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create session',
    });
  }
});

// POST /api/pos/session/:id/add - Add item to session
router.post('/session/:id/add', posLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { productId, quantity } = req.body;

    const session = await checkoutAgent.addToSession(id, productId, quantity);

    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    logger.error('Add to session failed', { error });
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/pos/session/:id/remove - Remove item from session
router.post('/session/:id/remove', posLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { productId } = req.body;

    const session = await checkoutAgent.removeFromSession(id, productId);

    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    logger.error('Remove from session failed', { error });
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/pos/session/:id - Get session
router.get('/session/:id', posLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = checkoutAgent.getSession(id);

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found or expired',
        code: 'SESSION_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    logger.error('Get session failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get session',
    });
  }
});

// POST /api/pos/session/:id/complete - Complete session
router.post('/session/:id/complete', posLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const result = await checkoutAgent.completeSession(id, paymentMethod);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
        code: result.code,
      });
      return;
    }

    res.json({
      success: true,
      data: result.receipt,
      message: 'Sale completed successfully',
    });
  } catch (error: any) {
    logger.error('Complete session failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to complete sale',
    });
  }
});

// POST /api/pos/refund - Refund sale
router.post('/refund/:saleId', posLimiter, validate(refundSchema), async (req: Request, res: Response) => {
  try {
    const { saleId } = req.params;
    const { items } = req.body;

    const result = await checkoutAgent.refundSale(saleId, items);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.message,
        code: 'REFUND_ERROR',
      });
      return;
    }

    logger.info('Refund processed', { saleId, amount: result.refundAmount });

    res.json({
      success: true,
      data: {
        refundAmount: result.refundAmount,
        message: result.message,
      },
    });
  } catch (error: any) {
    logger.error('Refund failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to process refund',
    });
  }
});

export default router;