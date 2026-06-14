import { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import crypto from 'crypto';
import { config } from '../config';

export interface RawBodyRequest extends Request {
 rawBody?: Buffer;
}

/**
 * Webhook Signature Verification Middleware
 * CRITICAL: Verifies HMAC-SHA256 signatures to ensure webhook authenticity
 *
 * Usage:
 *   app.post('/webhook', express.json({
 *     verify: (req, res, buf) => { (req as RawBodyRequest).rawBody = buf; }
 *   }), verifyWebhookSignature, webhookHandler);
 */

export function verifyWebhookSignature(
 req: RawBodyRequest,
 res: Response,
 next: NextFunction
): void {
 const signature = req.headers['x-rez-signature'] as string;
 const timestamp = req.headers['x-rez-timestamp'] as string;

 // Require signature header
 if (!signature) {
   logger.warn('[Webhook] Missing signature header');
   res.status(401).json({ error: 'Missing webhook signature' });
   return;
 }

 // Require raw body for verification
 if (!req.rawBody) {
   logger.error('[Webhook] Raw body not available for signature verification');
   res.status(400).json({ error: 'Unable to verify signature: missing request body' });
   return;
 }

 // Verify webhook secret is configured
 if (!config.webhookSecret) {
   logger.error('[Webhook] WEBHOOK_SECRET not configured');
   res.status(500).json({ error: 'Webhook verification not configured' });
   return;
 }

 // Optional: Verify timestamp to prevent replay attacks
 // Reject webhooks older than 5 minutes
 if (timestamp) {
   const webhookAge = Date.now() - parseInt(timestamp, 10);
   const maxAge = 5 * 60 * 1000; // 5 minutes
   if (isNaN(webhookAge) || webhookAge > maxAge || webhookAge < -60000) {
     console.warn('[Webhook] Timestamp outside acceptable range', { timestamp, age: webhookAge });
     res.status(401).json({ error: 'Webhook timestamp expired or invalid' });
     return;
   }
 }

 // Compute expected signature
 const expectedSignature = crypto
   .createHmac('sha256', config.webhookSecret)
   .update(req.rawBody)
   .digest('hex');

 // Parse provided signature (supports "sha256=..." format or raw hex)
 const providedSignature = signature.startsWith('sha256=')
   ? signature.substring(7)
   : signature;

 // Timing-safe comparison
 let isValid = false;
 try {
   // Ensure buffers are same length for timingSafeEqual
   if (providedSignature.length === expectedSignature.length) {
     isValid = crypto.timingSafeEqual(
       Buffer.from(providedSignature, 'hex'),
       Buffer.from(expectedSignature, 'hex')
     );
   } else {
     // Different lengths - cannot use timingSafeEqual
     // Still compute to maintain constant time for the provided input
     crypto.timingSafeEqual(
       Buffer.from(providedSignature),
       Buffer.from(providedSignature)
     );
   }
 } catch (error) {
   // Buffer length mismatch or other error - invalid
   isValid = false;
 }

 if (!isValid) {
   console.warn('[Webhook] Invalid signature', {
     providedLength: providedSignature.length,
     expectedLength: expectedSignature.length,
   });
   res.status(401).json({ error: 'Invalid webhook signature' });
   return;
 }

 console.debug('[Webhook] Signature verified successfully');
 next();
}

/**
 * Verify Razorpay webhook signature
 * Uses Razorpay's specific signature format
 */
export function verifyRazorpayWebhook(
 req: RawBodyRequest,
 res: Response,
 next: NextFunction
): void {
 const razorpaySignature = req.headers['x-razorpay-signature'] as string;

 if (!razorpaySignature) {
   logger.warn('[Razorpay Webhook] Missing signature header');
   res.status(401).json({ error: 'Missing webhook signature' });
   return;
 }

 if (!req.rawBody) {
   logger.error('[Razorpay Webhook] Raw body not available');
   res.status(400).json({ error: 'Unable to verify signature' });
   return;
 }

 if (!config.webhookSecret) {
   logger.error('[Razorpay Webhook] WEBHOOK_SECRET not configured');
   res.status(500).json({ error: 'Webhook verification not configured' });
   return;
 }

 // Razorpay uses HMAC-SHA256
 const expectedSignature = crypto
   .createHmac('sha256', config.webhookSecret)
   .update(req.rawBody)
   .digest('hex');

 let isValid = false;
 try {
   if (razorpaySignature.length === expectedSignature.length) {
     isValid = crypto.timingSafeEqual(
       Buffer.from(razorpaySignature, 'hex'),
       Buffer.from(expectedSignature, 'hex')
     );
   }
 } catch {
   isValid = false;
 }

 if (!isValid) {
   logger.warn('[Razorpay Webhook] Invalid signature');
   res.status(401).json({ error: 'Invalid webhook signature' });
   return;
 }

 next();
}

/**
 * Generate a webhook signature for testing/development
 */
export function generateWebhookSignature(payload: string | object): string {
 if (!config.webhookSecret) {
   throw new Error('WEBHOOK_SECRET not configured');
 }

 const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
 const signature = crypto
   .createHmac('sha256', config.webhookSecret)
   .update(payloadStr)
   .digest('hex');

 return `sha256=${signature}`;
}
