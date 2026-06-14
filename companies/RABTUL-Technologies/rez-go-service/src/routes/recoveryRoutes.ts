/**
 * REZ Go Checkout Recovery Routes
 *
 * Handles cart transfer when checkout fails:
 * - Move to counter
 * - Auto-recovery
 * - Staff rescue
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RecoveryTransfer } from '../models/CheckoutRecovery.js';
import { sessionService } from '../services/sessionService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Transfer expiration time (30 minutes)
const TRANSFER_EXPIRY_MS = 30 * 60 * 1000;

/**
 * POST /api/recovery/initiate
 * Initiate cart transfer to counter
 */
router.post('/initiate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.body.userId;
    const { sessionId, reason, notes } = req.body;

    if (!userId || !sessionId) {
      return res.status(400).json({ error: 'userId and sessionId are required' });
    }

    // Get session
    const session = await sessionService.getSessionForUser(sessionId, userId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Session is not active' });
    }

    // Create recovery transfer
    const transferId = `RCV-${uuidv4().substring(0, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + TRANSFER_EXPIRY_MS);

    const transfer = await RecoveryTransfer.create({
      transferId,
      sessionId,
      userId,
      storeId: session.storeId,
      merchantId: session.merchantId,
      status: 'pending',
      reason: reason || 'user_request',
      cartSnapshot: {
        items: session.items.map((item: any) => ({
          productId: item.productId,
          barcode: item.barcode,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          mrp: item.mrp,
        })),
        subtotal: session.subtotal,
        tax: session.tax,
        total: session.total,
        cashbackEarned: session.cashbackEarned,
      },
      notes,
      initiatedAt: new Date(),
      expiresAt,
    });

    // Generate transfer QR for cashier
    const transferQR = JSON.stringify({
      intent: 'go-recovery',
      v: 1,
      transferId,
      sessionId,
      storeId: session.storeId,
    });

    res.json({
      success: true,
      transfer: {
        transferId,
        sessionId,
        status: 'pending',
        expiresAt,
        cartItems: session.items.length,
        cartTotal: session.total,
      },
      transferQR,
      instructions: [
        'Show this QR at the counter',
        'Cashier will scan to load your cart',
        'Complete payment at counter',
        'Your REZ Go session will close automatically',
      ],
    });
  } catch (error) {
    console.error('Recovery initiate error:', error);
    res.status(500).json({ error: 'Failed to initiate recovery' });
  }
});

/**
 * GET /api/recovery/:transferId
 * Get recovery transfer status
 */
router.get('/:transferId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { transferId } = req.params;

    const transfer = await RecoveryTransfer.findOne({ transferId });
    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    // Check if expired
    if (transfer.status === 'pending' && new Date() > transfer.expiresAt) {
      await RecoveryTransfer.updateOne(
        { transferId },
        { status: 'expired' }
      );
      return res.json({
        success: true,
        transfer: {
          ...transfer.toObject(),
          status: 'expired',
        },
      });
    }

    res.json({
      success: true,
      transfer,
    });
  } catch (error) {
    console.error('Get recovery error:', error);
    res.status(500).json({ error: 'Failed to get recovery' });
  }
});

/**
 * GET /api/recovery/store/:storeId/pending
 * Get pending transfers for store (for cashier)
 */
router.get('/store/:storeId/pending', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;

    const transfers = await RecoveryTransfer.find({
      storeId,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    }).sort({ initiatedAt: -1 });

    res.json({
      success: true,
      transfers,
      count: transfers.length,
    });
  } catch (error) {
    console.error('Store pending error:', error);
    res.status(500).json({ error: 'Failed to get pending transfers' });
  }
});

/**
 * POST /api/recovery/:transferId/scan
 * Cashier scans transfer QR to load cart
 */
router.post('/:transferId/scan', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { transferId } = req.params;
    const cashierId = (req as any).user?.sub || req.body.cashierId;

    const transfer = await RecoveryTransfer.findOne({ transferId });
    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    if (transfer.status !== 'pending') {
      return res.status(400).json({
        error: `Transfer is already ${transfer.status}`,
      });
    }

    if (new Date() > transfer.expiresAt) {
      await RecoveryTransfer.updateOne(
        { transferId },
        { status: 'expired' }
      );
      return res.status(400).json({ error: 'Transfer has expired' });
    }

    // Mark as transferred
    await RecoveryTransfer.updateOne(
      { transferId },
      {
        status: 'transferred',
        cashierId,
        transferredAt: new Date(),
      }
    );

    res.json({
      success: true,
      transferId,
      status: 'transferred',
      cart: transfer.cartSnapshot,
      customer: {
        userId: transfer.userId,
      },
    });
  } catch (error) {
    console.error('Transfer scan error:', error);
    res.status(500).json({ error: 'Failed to scan transfer' });
  }
});

/**
 * POST /api/recovery/:transferId/complete
 * Complete recovery at counter
 */
router.post('/:transferId/complete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { transferId } = req.params;
    const {
      cashierId,
      finalAmount,
      paymentMethod,
      posTransactionId,
      notes,
    } = req.body;

    const transfer = await RecoveryTransfer.findOne({ transferId });
    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    if (transfer.status === 'completed') {
      return res.status(400).json({ error: 'Transfer already completed' });
    }

    if (transfer.status === 'expired') {
      return res.status(400).json({ error: 'Transfer has expired' });
    }

    // Complete the transfer
    await RecoveryTransfer.updateOne(
      { transferId },
      {
        status: 'completed',
        cashierId,
        finalAmount: finalAmount || transfer.cartSnapshot.total,
        paymentMethod,
        posTransactionId,
        notes,
        completedAt: new Date(),
      }
    );

    // Cancel the original session
    await sessionService.cancelSession(transfer.sessionId, transfer.userId, 'recovered_at_counter');

    res.json({
      success: true,
      transferId,
      status: 'completed',
      receipt: {
        transferId,
        items: transfer.cartSnapshot.items,
        originalTotal: transfer.cartSnapshot.total,
        finalAmount: finalAmount || transfer.cartSnapshot.total,
        paymentMethod,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Recovery complete error:', error);
    res.status(500).json({ error: 'Failed to complete recovery' });
  }
});

/**
 * POST /api/recovery/:transferId/cancel
 * Cancel recovery transfer
 */
router.post('/:transferId/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { transferId } = req.params;
    const userId = (req as any).user?.sub || req.body.userId;

    const transfer = await RecoveryTransfer.findOne({ transferId });
    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    // Only allow user to cancel their own transfer
    if (transfer.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (transfer.status !== 'pending') {
      return res.status(400).json({
        error: `Cannot cancel transfer in ${transfer.status} status`,
      });
    }

    await RecoveryTransfer.updateOne(
      { transferId },
      { status: 'cancelled' }
    );

    res.json({
      success: true,
      transferId,
      status: 'cancelled',
    });
  } catch (error) {
    console.error('Recovery cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel recovery' });
  }
});

/**
 * GET /api/recovery/user/:userId/history
 * Get user's recovery history
 */
router.get('/user/:userId/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const transfers = await RecoveryTransfer.find({
      userId,
    }).sort({ initiatedAt: -1 });

    res.json({
      success: true,
      transfers,
      count: transfers.length,
    });
  } catch (error) {
    console.error('Recovery history error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

export default router;
