import { Router, Request, Response, NextFunction } from 'express';
import { sessionService } from '../services/sessionService';
import { exitService } from '../services/exitService';

const router = Router();

// Error handling wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * POST /api/sessions
 * Create a new checkout session
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId, deviceId, customerId } = req.body;

    if (!storeId || !deviceId) {
      res.status(400).json({
        success: false,
        error: 'storeId and deviceId are required',
      });
      return;
    }

    const session = await sessionService.createSession({
      storeId,
      deviceId,
      customerId,
    });

    res.status(201).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        storeId: session.storeId,
        deviceId: session.deviceId,
        status: session.status,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
      },
    });
  })
);

/**
 * GET /api/sessions/:sessionId
 * Get a session by ID
 */
router.get(
  '/:sessionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    const session = await sessionService.getSession(sessionId);

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        storeId: session.storeId,
        deviceId: session.deviceId,
        status: session.status,
        items: session.items,
        subtotal: session.subtotal,
        tax: session.tax,
        total: session.total,
        paymentStatus: session.paymentStatus,
        paymentMethod: session.paymentMethod,
        transactionId: session.transactionId,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        expiresAt: session.expiresAt,
        exitCode: session.exitCode,
        exitValidatedAt: session.exitValidatedAt,
      },
    });
  })
);

/**
 * GET /api/sessions/:sessionId/active
 * Get an active session (throws if not found or expired)
 */
router.get(
  '/:sessionId/active',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    const session = await sessionService.getActiveSession(sessionId);

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        storeId: session.storeId,
        deviceId: session.deviceId,
        status: session.status,
        items: session.items,
        subtotal: session.subtotal,
        tax: session.tax,
        total: session.total,
        paymentStatus: session.paymentStatus,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
      },
    });
  })
);

/**
 * POST /api/sessions/:sessionId/items
 * Add an item to the session
 */
router.post(
  '/:sessionId/items',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { productId, sku, name, barcode, quantity, unitPrice } = req.body;

    if (!productId || !barcode || !name || quantity === undefined || unitPrice === undefined) {
      res.status(400).json({
        success: false,
        error: 'productId, barcode, name, quantity, and unitPrice are required',
      });
      return;
    }

    if (quantity < 1) {
      res.status(400).json({
        success: false,
        error: 'Quantity must be at least 1',
      });
      return;
    }

    const session = await sessionService.addItem({
      sessionId,
      productId,
      sku: sku || productId,
      name,
      barcode,
      quantity,
      unitPrice,
    });

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        items: session.items,
        subtotal: session.subtotal,
        tax: session.tax,
        total: session.total,
        itemCount: session.items.length,
      },
    });
  })
);

/**
 * PATCH /api/sessions/:sessionId/items/:productId
 * Update item quantity
 */
router.patch(
  '/:sessionId/items/:productId',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId, productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 1) {
      res.status(400).json({
        success: false,
        error: 'Quantity must be at least 1',
      });
      return;
    }

    const session = await sessionService.updateQuantity({
      sessionId,
      productId,
      quantity,
    });

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        items: session.items,
        subtotal: session.subtotal,
        tax: session.tax,
        total: session.total,
        itemCount: session.items.length,
      },
    });
  })
);

/**
 * DELETE /api/sessions/:sessionId/items/:productId
 * Remove an item from the session
 */
router.delete(
  '/:sessionId/items/:productId',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId, productId } = req.params;

    const session = await sessionService.removeItem({
      sessionId,
      productId,
    });

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        items: session.items,
        subtotal: session.subtotal,
        tax: session.tax,
        total: session.total,
        itemCount: session.items.length,
      },
    });
  })
);

/**
 * POST /api/sessions/:sessionId/complete
 * Complete the session (after successful payment)
 */
router.post(
  '/:sessionId/complete',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { paymentMethod, transactionId } = req.body;

    if (!paymentMethod || !transactionId) {
      res.status(400).json({
        success: false,
        error: 'paymentMethod and transactionId are required',
      });
      return;
    }

    const session = await sessionService.completeSession(sessionId, {
      paymentMethod,
      transactionId,
    });

    // Generate exit code
    const exitCode = await exitService.generateExitCode(sessionId);

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        status: session.status,
        paymentStatus: session.paymentStatus,
        transactionId: session.transactionId,
        total: session.total,
        itemCount: session.items.length,
        exitCode,
        message: 'Payment successful. Please proceed to the exit gate.',
      },
    });
  })
);

/**
 * POST /api/sessions/:sessionId/cancel
 * Cancel the session
 */
router.post(
  '/:sessionId/cancel',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    const session = await sessionService.cancelSession(sessionId);

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        status: session.status,
        message: 'Session cancelled successfully',
      },
    });
  })
);

/**
 * GET /api/sessions/device/:storeId/:deviceId
 * Get all active sessions for a device
 */
router.get(
  '/device/:storeId/:deviceId',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId, deviceId } = req.params;

    const sessions = await sessionService.getActiveSessionsForDevice(storeId, deviceId);

    res.json({
      success: true,
      data: sessions.map((session) => ({
        sessionId: session.sessionId,
        status: session.status,
        itemCount: session.items.length,
        subtotal: session.subtotal,
        total: session.total,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
      })),
    });
  })
);

export default router;
