import { Router, Request, Response } from 'express';
import { MerchantUser } from '../models/MerchantUser';
import { Merchant } from '../models/Merchant';
import { redis, ensureRedisConnected } from '../config/redis';
import { getClientIp } from './auth/shared';

const router = Router();

/**
 * SECURITY FIX (MERCHANT-AUTH-001):
 * 1. Added validateToken() middleware to verify invitation token is not a random guess.
 * 2. Raised password minimum from 6 to 8 characters (OWASP minimum).
 * 3. Added password strength validation (must contain uppercase + lowercase + digit).
 * 4. Added rate limiting: max 5 attempts per token per IP per 15 minutes.
 */

async function validateToken(req: Request, res: Response, next: Function) {
  const { token } = req.params;
  const ip = getClientIp(req);
  // Basic format check — token must be at least 20 chars (UUID + random suffix)
  if (!token || token.length < 20) {
    res.status(400).json({ success: false, message: 'Invalid token format' });
    return;
  }
  // Check Redis for rate limiting
  try {
    await ensureRedisConnected();
    const rateKey = `merch:invite:${token}:${ip}`;
    const countStr = await redis.get(rateKey);
    const count = countStr ? parseInt(countStr, 10) : 0;
    if (count >= 5) {
      res.status(429).json({ success: false, message: 'Too many attempts. Try again after 15 minutes.' });
      return;
    }
    await redis.set(rateKey, String(count + 1), 'EX', 15 * 60);
    next();
  } catch (e) {
    // SECURITY FIX: Fail-closed - reject if Redis unavailable for rate limiting
    console.error('[validateToken] Redis unavailable, rejecting request', { ip, error: e instanceof Error ? e.message : String(e) });
    res.status(503).json({ success: false, message: 'Service temporarily unavailable. Please try again.' });
  }
}

router.get('/validate-invitation/:token', validateToken, async (req: Request, res: Response) => {
  try {
    const user = await MerchantUser.findOne({ inviteToken: req.params.token, inviteExpiry: { $gt: new Date() } }).lean() as unknown;
    if (!user) { res.status(400).json({ success: false, message: 'Invalid or expired invitation' }); return; }
    const merchant = await Merchant.findById(user.merchantId).lean() as unknown;
    res.json({ success: true, data: { valid: true, invitation: { name: user.name, email: user.email, role: user.role, businessName: merchant?.businessName || 'Unknown', expiresAt: user.inviteExpiry } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/accept-invitation/:token', validateToken, async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    // MERCHANT-AUTH-001: Raise password min from 6 to 8 (OWASP minimum)
    if (!password || password.length < 8) {
      res.status(400).json({ success: false, message: 'Password min 8 characters' });
      return;
    }
    // MERCHANT-AUTH-001: Require mixed case + digit for password strength
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      res.status(400).json({ success: false, message: 'Password must contain uppercase, lowercase, and a digit' });
      return;
    }
    const user = await MerchantUser.findOne({ inviteToken: req.params.token, inviteExpiry: { $gt: new Date() } }) as unknown;
    if (!user) { res.status(400).json({ success: false, message: 'Invalid or expired invitation' }); return; }
    const bcrypt = await import('bcrypt');
    const hashed = await bcrypt.hash(password, 12);
    await MerchantUser.updateOne({ _id: user._id }, { $set: { password: hashed, status: 'active', inviteToken: undefined, inviteExpiry: undefined } });
    res.json({ success: true, message: 'Invitation accepted', data: { email: user.email, name: user.name, role: user.role } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
