
/**
 * shiftGapBridge router
 *
 * Internal endpoint consumed by RestaurantHub to poll shift gaps for a
 * given merchant. Protected by a shared secret (X-Internal-Token header)
 * rather than merchant JWT so RestaurantHub's server-side code can call it
 * without a user session.
 *
 * GET /shift-gap-bridge/:merchantId
 *   Headers: X-Internal-Token: <INTERNAL_BRIDGE_TOKEN>
 *   Response: ShiftGap[]
 */

import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { detectShiftGaps } from '../utils/ShiftGapDetector';

const router = Router();

function validateInternalToken(req: Request, res: Response): boolean {
  const secret = process.env.INTERNAL_BRIDGE_TOKEN;
  if (!secret) {
    res.status(500).json({ success: false, message: 'Bridge token not configured' });
    return false;
  }

  const provided = Array.isArray(req.headers['x-internal-token'])
    ? req.headers['x-internal-token'][0]
    : req.headers['x-internal-token'];
  if (!provided) {
    res.status(401).json({ success: false, message: 'Invalid internal token' });
    return false;
  }
  // MERCH-AUDIT-6: Use timing-safe comparison to prevent timing attacks
  const providedBuf = Buffer.from(provided);
  const secretBuf = Buffer.from(secret);
  if (providedBuf.length !== secretBuf.length || !crypto.timingSafeEqual(providedBuf, secretBuf)) {
    res.status(401).json({ success: false, message: 'Invalid internal token' });
    return false;
  }

  return true;
}

router.get('/:merchantId', async (req: Request, res: Response) => {
  if (!validateInternalToken(req, res)) return;

  const merchantId = req.params['merchantId'] as string;
  if (!merchantId) {
    res.status(400).json({ success: false, message: 'merchantId required' });
    return;
  }

  try {
    const gaps = await detectShiftGaps(merchantId);
    res.json({ success: true, data: gaps });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
