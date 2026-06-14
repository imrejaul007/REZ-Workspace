import { logger } from '../../shared/logger';
import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { VoucherService } from '../services/voucher.service';
import { RideService } from '../services/ride.service';
import { AdsService } from '../services/ads.service';

const router = Router();

// Webhook secret for signature verification
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

/**
 * Webhook signature verification middleware
 * Verifies HMAC-SHA256 signature from request headers
 */
function verifyWebhookSignature(req: Request, res: Response, next: NextFunction): void {
  // Skip if no secret configured (development only)
  if (!WEBHOOK_SECRET) {
    logger.warn('[Webhook] No WEBHOOK_SECRET configured - skipping verification');
    return next();
  }

  const signature = req.headers['x-webhook-signature'] as string;
  const timestamp = req.headers['x-webhook-timestamp'] as string;

  if (!signature || !timestamp) {
    res.status(401).json({
      success: false,
      error: 'Missing webhook signature',
      code: 'MISSING_SIGNATURE'
    });
    return;
  }

  // Check timestamp to prevent replay attacks (5 minute window)
  const now = Math.floor(Date.now() / 1000);
  const timestampNum = parseInt(timestamp, 10);

  if (isNaN(timestampNum) || Math.abs(now - timestampNum) > 300) {
    res.status(401).json({
      success: false,
      error: 'Webhook timestamp expired or invalid',
      code: 'INVALID_TIMESTAMP'
    });
    return;
  }

  // Verify signature
  const payload = JSON.stringify(req.body);
  const signaturePayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(signaturePayload)
    .digest('hex');

  // Timing-safe comparison
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    res.status(401).json({
      success: false,
      error: 'Invalid webhook signature',
      code: 'INVALID_SIGNATURE'
    });
    return;
  }

  next();
}

/**
 * Idempotency check for webhooks
 */
const processedEvents = new Map<string, number>();
const IDEMPOTENCY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function checkIdempotency(eventId: string): boolean {
  // Check if event was already processed
  const existing = processedEvents.get(eventId);
  if (existing) {
    return false; // Already processed
  }

  // Record processing
  processedEvents.set(eventId, Date.now());

  // Cleanup old entries
  const now = Date.now();
  for (const [key, timestamp] of processedEvents.entries()) {
    if (now - timestamp > IDEMPOTENCY_WINDOW_MS) {
      processedEvents.delete(key);
    }
  }

  return true;
}

/**
 * @route POST /api/webhooks/service-completed
 * @desc Webhook for service completion (from Restaurant, Salon, etc.)
 */
router.post('/service-completed', verifyWebhookSignature, async (req: Request, res: Response) => {
  try {
    // Idempotency check
    const eventId = req.body.event_id || req.body.order_id;
    if (eventId && !checkIdempotency(eventId)) {
      res.json({ success: true, message: 'Event already processed' });
      return;
    }

    const voucherService = req.app.get('voucherService');

    // Validate required fields
    if (!req.body.merchant_id || !req.body.user_id || !req.body.order_id) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: merchant_id, user_id, order_id'
      });
      return;
    }

    const event = {
      event: req.body.event || 'service.completed',
      source: req.body.source,
      merchantId: req.body.merchant_id,
      userId: req.body.user_id,
      orderId: req.body.order_id,
      amount: parseFloat(req.body.amount) || 0,
      timestamp: req.body.timestamp || new Date().toISOString(),
    };

    const voucher = await voucherService.handleServiceCompleted(event);

    if (voucher) {
      res.json({
        success: true,
        voucher: {
          voucher_id: voucher._id.toString(),
          amount: voucher.value,
          type: voucher.type,
          expires_at: voucher.validUntil,
        },
      });
    } else {
      res.json({ success: true, voucher: null });
    }
  } catch (error: unknown) {
    logger.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * @route POST /api/webhooks/ride-completed
 * @desc Webhook for ride completion (Ride → Service campaigns)
 */
router.post('/ride-completed', verifyWebhookSignature, async (req: Request, res: Response) => {
  try {
    // Idempotency check
    const eventId = req.body.ride_id;
    if (eventId && !checkIdempotency(eventId)) {
      res.json({ success: true, message: 'Event already processed' });
      return;
    }

    const voucherService = req.app.get('voucherService');

    // Validate required fields
    if (!req.body.ride_id || !req.body.user_id) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: ride_id, user_id'
      });
      return;
    }

    const event = {
      rideId: req.body.ride_id,
      userId: req.body.user_id,
      fare: parseFloat(req.body.fare) || 0,
      drop: {
        lat: parseFloat(req.body.drop_lat) || 0,
        lng: parseFloat(req.body.drop_lng) || 0,
        address: req.body.drop_address || '',
      },
      destinationMerchantId: req.body.destination_merchant_id,
    };

    const voucher = await voucherService.handleRideCompleted(event);

    if (voucher) {
      res.json({
        success: true,
        voucher: {
          voucher_id: voucher._id.toString(),
          amount: voucher.value,
          type: voucher.type,
          expires_at: voucher.validUntil,
        },
      });
    } else {
      res.json({ success: true, voucher: null });
    }
  } catch (error: unknown) {
    logger.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * @route POST /api/webhooks/ad-impression
 * @desc Webhook for ad impression tracking
 */
router.post('/ad-impression', verifyWebhookSignature, async (req: Request, res: Response) => {
  try {
    const adsService = req.app.get('adsService');

    // Validate required fields
    if (!req.body.ad_id || !req.body.ride_id) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: ad_id, ride_id'
      });
      return;
    }

    await adsService.recordImpression({
      adId: req.body.ad_id,
      rideId: req.body.ride_id,
      userId: req.body.user_id,
      servedAt: new Date(req.body.served_at || Date.now()),
      viewedDuration: parseInt(req.body.viewed_duration) || 0,
      interacted: req.body.interacted || false,
      interactionType: req.body.interaction_type,
    });

    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Ad impression webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * @route POST /api/webhooks/ad-interaction
 * @desc Webhook for ad interaction tracking
 */
router.post('/ad-interaction', verifyWebhookSignature, async (req: Request, res: Response) => {
  try {
    const adsService = req.app.get('adsService');

    if (!req.body.ride_id || !req.body.ad_id) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: ride_id, ad_id'
      });
      return;
    }

    await adsService.recordInteraction(
      req.body.ride_id,
      req.body.ad_id,
      req.body.interaction_type || 'click',
      parseInt(req.body.duration) || 0
    );

    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Ad interaction webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * @route POST /api/webhooks/loyalty-update
 * @desc Webhook for loyalty program updates
 */
router.post('/loyalty-update', verifyWebhookSignature, async (req: Request, res: Response) => {
  try {
    const voucherService = req.app.get('voucherService');

    const { user_id, points_delta, action, reason } = req.body;

    if (!user_id || points_delta === undefined) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, points_delta'
      });
      return;
    }

    logger.info(`[Webhook] Loyalty update for user ${user_id}: ${points_delta > 0 ? '+' : ''}${points_delta} (${reason || action})`);

    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Loyalty webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
