/**
 * REZ Security Middleware - Webhook Signature Verification
 * Copy to: src/middleware/webhookVerify.ts
 *
 * Usage in index.ts:
 *   import { verifyWebhookSignature } from './middleware/webhookVerify';
 *   app.post('/webhook', express.json(), verifyWebhookSignature(SECRET), handler);
 */

import { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(secret?: string) {
  const webhookSecret = secret || WEBHOOK_SECRET;

  return (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['x-rez-signature'] as string;
    const timestamp = req.headers['x-rez-timestamp'] as string;

    if (!webhookSecret) {
      logger.warn('[Webhook] No WEBHOOK_SECRET configured - skipping verification');
      return next();
    }

    if (!signature) {
      res.status(401).json({ error: 'Missing webhook signature' });
      return;
    }

    // Verify timestamp (prevent replay attacks)
    if (timestamp) {
      const ts = parseInt(timestamp, 10);
      const now = Date.now();
      const age = Math.abs(now - ts);
      if (age > 5 * 60 * 1000) { // 5 minutes
        res.status(401).json({ error: 'Webhook timestamp expired' });
        return;
      }
    }

    // Get raw body for signature verification
    const rawBody = (req as unknown).rawBody || JSON.stringify(req.body);

    // Compute expected signature
    const payload = timestamp ? `${timestamp}.${rawBody}` : rawBody;
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    const providedSig = signature.startsWith('sha256=')
      ? signature.substring(7)
      : signature;

    if (providedSig.length !== expected.length) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    try {
      const match = crypto.timingSafeEqual(
        Buffer.from(providedSig, 'hex'),
        Buffer.from(expected, 'hex')
      );

      if (!match) {
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
      }
    } catch {
      res.status(401).json({ error: 'Signature verification failed' });
      return;
    }

    next();
  };
}

/**
 * Generate webhook signature (for testing)
 */
export function signWebhook(payload: string | object, secret?: string): string {
  const webhookSecret = secret || WEBHOOK_SECRET;
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
}
