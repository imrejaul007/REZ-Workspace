/**
 * REZ Go QR Verification Routes
 *
 * Verifies QR codes for:
 * - Session entry
 * - Product scanning
 * - Exit verification
 * - Recovery transfer
 */

import { Router, Request, Response } from 'express';
import { GoSession } from '../models/GoSession.js';
import { GoStore } from '../models/GoStore.js';
import { checkoutService } from '../services/checkoutService.js';
import { sessionService } from '../services/sessionService.js';
import { RecoveryTransfer } from '../models/CheckoutRecovery.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

interface QRPayload {
  intent?: string;
  v?: number;
  storeId?: string;
  sessionId?: string;
  productId?: string;
  barcode?: string;
  action?: string;
  transferId?: string;
}

/**
 * POST /api/verify
 * Verify any REZ Go QR code
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'QR code is required' });
    }

    // Parse the QR code
    let payload: QRPayload = {};

    try {
      if (code.startsWith('{')) {
        // JSON payload
        payload = JSON.parse(code);
      } else if (code.startsWith('REZG:')) {
        // HMAC-signed token (exit QR)
        const verification = checkoutService.verifyExitToken('', code.slice(5));
        if (verification.valid) {
          return res.json({
            valid: true,
            type: 'exit',
            message: 'Valid exit QR',
          });
        }
        return res.json({
          valid: false,
          error: verification.error,
        });
      } else if (code.startsWith('RCV-')) {
        // Recovery transfer
        const transfer = await RecoveryTransfer.findOne({ transferId: code });
        if (transfer) {
          return res.json({
            valid: true,
            type: 'recovery',
            data: {
              transferId: transfer.transferId,
              status: transfer.status,
              cartTotal: transfer.cartSnapshot.total,
              cartItems: transfer.cartSnapshot.items.length,
            },
          });
        }
        return res.json({
          valid: false,
          error: 'Transfer not found',
        });
      } else if (code.startsWith('go-session:') || code.startsWith('go-product:') || code.startsWith('go-recovery:')) {
        // URI-style payload
        const parts = code.split(':');
        if (parts.length >= 2) {
          payload.intent = parts[0];
          const params = parts[1].split('&');
          params.forEach((p) => {
            const [key, value] = p.split('=');
            if (key && value) {
              (payload as any)[key] = decodeURIComponent(value);
            }
          });
        }
      }
    } catch (error) {
      return res.json({
        valid: false,
        error: 'Failed to parse QR code',
      });
    }

    // Verify based on intent
    switch (payload.intent) {
      case 'go-session':
        return handleSessionVerification(payload, res);
      case 'go-product':
        return handleProductVerification(payload, res);
      case 'go-recovery':
        return handleRecoveryVerification(payload, res);
      default:
        return res.json({
          valid: false,
          error: 'Unknown intent',
        });
    }
  } catch (error) {
    console.error('QR verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /api/verify/session
 * Verify session entry QR
 */
router.post('/session', async (req: Request, res: Response) => {
  try {
    const { storeId, action } = req.body;

    if (!storeId) {
      return res.status(400).json({ error: 'storeId is required' });
    }

    // Verify store exists and is active
    const store = await GoStore.findOne({ storeId, goEnabled: true, status: 'active' });
    if (!store) {
      return res.json({
        valid: false,
        error: 'Store not found or REZ Go not enabled',
      });
    }

    return res.json({
      valid: true,
      type: 'session',
      data: {
        storeId: store.storeId,
        storeName: store.name,
        storeType: store.storeType,
        address: store.address,
      },
    });
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /api/verify/product
 * Verify product scan QR
 */
router.post('/product', async (req: Request, res: Response) => {
  try {
    const { barcode, storeId } = req.body;

    if (!barcode) {
      return res.status(400).json({ error: 'barcode is required' });
    }

    // Verify store exists
    const store = storeId ? await GoStore.findOne({ storeId, goEnabled: true }) : null;

    return res.json({
      valid: true,
      type: 'product',
      data: {
        barcode,
        storeId,
        storeName: store?.name,
      },
    });
  } catch (error) {
    console.error('Product verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /api/verify/exit
 * Verify exit QR
 */
router.post('/exit', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.body.userId;
    const { sessionId, exitToken } = req.body;

    if (!sessionId || !exitToken) {
      return res.status(400).json({ error: 'sessionId and exitToken are required' });
    }

    // Get session
    const session = await sessionService.getSessionForUser(sessionId, userId);
    if (!session) {
      return res.json({
        valid: false,
        error: 'Session not found',
      });
    }

    if (session.status !== 'active') {
      return res.json({
        valid: false,
        error: 'Session is not active',
      });
    }

    // Verify exit token
    const verification = checkoutService.verifyExitToken(sessionId, exitToken);
    if (!verification.valid) {
      return res.json({
        valid: false,
        error: verification.error,
      });
    }

    return res.json({
      valid: true,
      type: 'exit',
      data: {
        sessionId: session.sessionId,
        cartTotal: session.total,
        itemCount: session.items.length,
      },
    });
  } catch (error) {
    console.error('Exit verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /api/verify/recovery
 * Verify recovery transfer QR (for cashier)
 */
router.post('/recovery', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { transferId } = req.body;

    if (!transferId) {
      return res.status(400).json({ error: 'transferId is required' });
    }

    // Find transfer
    const transfer = await RecoveryTransfer.findOne({ transferId });
    if (!transfer) {
      return res.json({
        valid: false,
        error: 'Transfer not found',
      });
    }

    if (transfer.status === 'completed') {
      return res.json({
        valid: false,
        error: 'Transfer already completed',
      });
    }

    if (transfer.status === 'expired' || new Date() > transfer.expiresAt) {
      return res.json({
        valid: false,
        error: 'Transfer has expired',
      });
    }

    return res.json({
      valid: true,
      type: 'recovery',
      data: {
        transferId: transfer.transferId,
        sessionId: transfer.sessionId,
        status: transfer.status,
        cart: transfer.cartSnapshot,
        customer: {
          userId: transfer.userId,
        },
        expiresAt: transfer.expiresAt,
      },
    });
  } catch (error) {
    console.error('Recovery verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /api/verify/store
 * Verify store QR for merchant dashboard
 */
router.post('/store', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.body;

    if (!storeId) {
      return res.status(400).json({ error: 'storeId is required' });
    }

    // Verify store
    const store = await GoStore.findOne({ storeId });
    if (!store) {
      return res.json({
        valid: false,
        error: 'Store not found',
      });
    }

    // Get live session count (from WebSocket or DB)
    const liveSessions = await GoSession.countDocuments({
      storeId,
      status: 'active',
    });

    return res.json({
      valid: true,
      type: 'store',
      data: {
        storeId: store.storeId,
        storeName: store.name,
        goEnabled: store.goEnabled,
        status: store.status,
        liveSessions,
      },
    });
  } catch (error) {
    console.error('Store verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Helper functions
async function handleSessionVerification(payload: QRPayload, res: Response) {
  if (!payload.storeId) {
    return res.json({ valid: false, error: 'storeId is required' });
  }

  const store = await GoStore.findOne({
    storeId: payload.storeId,
    goEnabled: true,
    status: 'active',
  });

  if (!store) {
    return res.json({
      valid: false,
      error: 'Store not found or REZ Go not enabled',
    });
  }

  // If resuming session, verify it exists
  if (payload.action === 'resume' && payload.sessionId) {
    const session = await sessionService.getSession(payload.sessionId);
    if (!session) {
      return res.json({
        valid: false,
        error: 'Session not found',
      });
    }
    return res.json({
      valid: true,
      type: 'session',
      action: 'resume',
      data: {
        storeId: store.storeId,
        storeName: store.name,
        sessionId: session.sessionId,
      },
    });
  }

  return res.json({
    valid: true,
    type: 'session',
    action: 'start',
    data: {
      storeId: store.storeId,
      storeName: store.name,
      storeType: store.storeType,
    },
  });
}

async function handleProductVerification(payload: QRPayload, res: Response) {
  if (!payload.barcode) {
    return res.json({ valid: false, error: 'barcode is required' });
  }

  const store = payload.storeId
    ? await GoStore.findOne({ storeId: payload.storeId, goEnabled: true })
    : null;

  return res.json({
    valid: true,
    type: 'product',
    data: {
      barcode: payload.barcode,
      storeId: payload.storeId,
      sessionId: payload.sessionId,
      storeName: store?.name,
    },
  });
}

async function handleRecoveryVerification(payload: QRPayload, res: Response) {
  if (!payload.transferId) {
    return res.json({ valid: false, error: 'transferId is required' });
  }

  const transfer = await RecoveryTransfer.findOne({ transferId: payload.transferId });
  if (!transfer) {
    return res.json({
      valid: false,
      error: 'Transfer not found',
    });
  }

  if (transfer.status !== 'pending') {
    return res.json({
      valid: false,
      error: `Transfer is ${transfer.status}`,
    });
  }

  return res.json({
    valid: true,
    type: 'recovery',
    data: {
      transferId: transfer.transferId,
      cartTotal: transfer.cartSnapshot.total,
      itemCount: transfer.cartSnapshot.items.length,
      expiresAt: transfer.expiresAt,
    },
  });
}

export default router;
