import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { logger } from '../config/logger';
import { requireInternalToken } from '../middleware/internalAuth';

const router = Router();

const WEBHOOK_SECRET = process.env.NEXTABIZZ_WEBHOOK_SECRET || process.env.INTERNAL_SERVICE_TOKEN || '';
const MAX_TIMESTAMP_AGE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Internal route for NextaBiZ reorder signals
 * POST /internal/nextabizz/reorder-signal
 *
 * Receives reorder signals from NextaBiZ when merchants need to reorder inventory.
 * This creates a notification for the merchant in the REZ Merchant app.
 *
 * Headers:
 *   x-internal-token: <service-internal-token>
 *   x-webhook-signature: HMAC-SHA256 signature
 *   x-webhook-timestamp: Unix timestamp (ms) of the request
 *   x-webhook-source: nextabizz
 */

/**
 * Verify webhook signature from NextaBiZ with replay attack prevention.
 * Returns an error message string if verification fails, or null on success.
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
): string | null {
  // Replay attack prevention: reject timestamps older than 5 minutes
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) {
    return 'Invalid webhook timestamp format';
  }
  const now = Date.now();
  if (Math.abs(now - requestTime) > MAX_TIMESTAMP_AGE_MS) {
    return 'Webhook timestamp is too old (possible replay attack)';
  }

  const signaturePayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signaturePayload)
    .digest('hex');

  if (signature.length !== expectedSignature.length) {
    return 'Invalid webhook signature';
  }

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return 'Invalid webhook signature';
  }

  return null;
}

/**
 * Zod schema for reorder signal payload
 */
const ReorderSignalPayloadSchema = {
  merchantId: { type: 'string', required: true },
  signalId: { type: 'string', required: true },
  productName: { type: 'string', required: true },
  currentStock: { type: 'number', required: true },
  threshold: { type: 'number', required: true },
  suggestedQty: { type: 'number', required: true },
  urgency: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], required: true },
  severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], required: true },
  unit: { type: 'string', required: true },
  productId: { type: 'string' },
  sku: { type: 'string' },
  category: { type: 'string' },
  matchedSuppliers: { type: 'number' },
  matchConfidence: { type: 'number' },
  timestamp: { type: 'string' },
};

interface ReorderSignalPayload {
  merchantId: string;
  signalId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  suggestedQty: number;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  severity: 'low' | 'medium' | 'high' | 'critical';
  unit: string;
  productId?: string;
  sku?: string;
  category?: string;
  matchedSuppliers?: number;
  matchConfidence?: number;
  timestamp?: string;
}

router.post('/reorder-signal', requireInternalToken, async (req: Request, res: Response) => {
  try {
    // --- Webhook signature verification ---
    const signature = req.headers['x-webhook-signature'] as string;
    const timestamp = req.headers['x-webhook-timestamp'] as string;

    if (!signature || !timestamp) {
      res.status(401).json({ success: false, message: 'Missing webhook signature or timestamp header' });
      return;
    }

    const rawPayload = JSON.stringify(req.body);
    const verificationError = verifyWebhookSignature(rawPayload, signature, timestamp, WEBHOOK_SECRET);
    if (verificationError) {
      logger.warn(`[NextaBiZ] Webhook signature verification failed: ${verificationError}`);
      res.status(401).json({ success: false, message: 'Invalid webhook signature' });
      return;
    }

    const payload = req.body as ReorderSignalPayload;

    // Validate required fields
    const requiredFields = ['merchantId', 'signalId', 'productName', 'currentStock', 'threshold', 'suggestedQty', 'urgency', 'severity', 'unit'];
    for (const field of requiredFields) {
      if (!payload[field as keyof ReorderSignalPayload]) {
        res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`,
        });
        return;
      }
    }

    // Validate enum values
    if (!['low', 'medium', 'high', 'urgent'].includes(payload.urgency)) {
      res.status(400).json({ success: false, message: 'Invalid urgency value' });
      return;
    }
    if (!['low', 'medium', 'high', 'critical'].includes(payload.severity)) {
      res.status(400).json({ success: false, message: 'Invalid severity value' });
      return;
    }

    // Get merchant's MongoDB ID from merchantId
    const Merchant = mongoose.model('Merchant');
    let merchant = await Merchant.findOne({ merchantId: payload.merchantId }).select('_id');

    // Fallback: try by _id if merchantId is already an ObjectId
    if (!merchant && mongoose.Types.ObjectId.isValid(payload.merchantId)) {
      merchant = await Merchant.findById(payload.merchantId).select('_id');
    }

    if (!merchant) {
      res.status(404).json({ success: false, message: 'Merchant not found' });
      return;
    }

    // Create notification for merchant
    const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false, collection: 'notifications' }));

    const notification = new Notification({
      recipient: merchant._id,
      type: 'reorder_signal',
      title: 'Reorder Alert',
      message: `Low stock: ${payload.productName}. Suggested reorder: ${payload.suggestedQty} ${payload.unit}`,
      data: {
        signalId: payload.signalId,
        productName: payload.productName,
        currentStock: payload.currentStock,
        threshold: payload.threshold,
        suggestedQty: payload.suggestedQty,
        urgency: payload.urgency,
        severity: payload.severity,
        unit: payload.unit,
        productId: payload.productId,
        category: payload.category,
        source: 'nextabizz',
        hasMatches: payload.matchedSuppliers && payload.matchedSuppliers > 0,
      },
      priority: payload.urgency === 'urgent' ? 'high' : payload.urgency === 'high' ? 'medium' : 'low',
      isRead: false,
      createdAt: new Date(),
    });

    await notification.save();

    logger.info(`[NextaBiZ] Created reorder notification for merchant ${payload.merchantId}`, {
      notificationId: notification._id,
      productName: payload.productName,
      urgency: payload.urgency,
    });

    res.json({
      success: true,
      notificationId: notification._id,
      merchantId: payload.merchantId,
    });
  } catch (e) {
    logger.error('[NextaBiZ] Error processing reorder signal', { error: e?.message || String(e) });
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * GET /internal/nextabizz/health
 * Health check endpoint
 */
router.get('/health', async (_req: Request, res: Response) => {
  res.json({ success: true, service: 'nextabizz-signals', status: 'healthy' });
});

export default router;
