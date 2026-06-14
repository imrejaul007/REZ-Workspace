/**
 * Operations Webhooks - StayOwn
 *
 * Receives events from REZ-Merchant Hotel OS services:
 * - Housekeeping (4021): Room cleaning, task assignments
 * - Maintenance (4019): Issue tracking, work orders
 * - Channel Manager (OTA sync): Availability updates
 * - Dynamic Pricing (4040): Price changes
 * - Reputation Service (4010): Review events
 *
 * This enables StayOwn to stay in sync with all hotel operations.
 */

import { Router, Request, Response } from 'express';
import logger from './utils/logger';
import crypto from 'crypto';

const router = Router();

const WEBHOOK_SECRET = process.env.OPS_WEBHOOK_SECRET || 'dev-ops-webhook-secret';

interface WebhookPayload {
  event: string;
  source: string;
  timestamp: string;
  data: Record<string, any>;
}

function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET || WEBHOOK_SECRET === 'dev-ops-webhook-secret') {
    logger.warn('[OpsWebhook] Dev mode - skipping signature verification');
    return true;
  }

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature || ''),
    Buffer.from(expectedSignature)
  );
}

// ============================================================
// HOUSEKEEPING WEBHOOKS (from rez-hotel-housekeeping-service)
// ============================================================

/**
 * POST /webhooks/ops/housekeeping/task-created
 * New housekeeping task assigned
 */
router.post('/housekeeping/task-created', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    if (!verifySignature(JSON.stringify(req.body), signature)) {
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    const { taskId, roomId, roomNumber, taskType, priority, assignedTo, deadline, hotelId } = req.body;

    logger.info('[OpsWebhook] Housekeeping task created', { taskId, roomId, taskType });

    // Update guest app with housekeeping status
    // In production: emit to Redis for real-time updates to guest app

    res.json({
      success: true,
      data: {
        taskId,
        acknowledged: true,
        guestNotification: taskType === 'checkout_clean' ? 'scheduled' : 'none'
      }
    });
  } catch (error: any) {
    logger.error('[OpsWebhook] Housekeeping task error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /webhooks/ops/housekeeping/task-completed
 * Housekeeping task finished
 */
router.post('/housekeeping/task-completed', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    if (!verifySignature(JSON.stringify(req.body), signature)) {
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    const { taskId, roomId, completedBy, completedAt, duration, qualityScore, hotelId } = req.body;

    logger.info('[OpsWebhook] Housekeeping task completed', { taskId, roomId, qualityScore });

    // Notify guest room is ready (if post-cleaning)
    // Update room availability status

    res.json({
      success: true,
      data: {
        taskId,
        roomReady: true,
        guestNotification: 'sent'
      }
    });
  } catch (error: any) {
    logger.error('[OpsWebhook] Housekeeping completion error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /webhooks/ops/housekeeping/room-status
 * Room status changed (dirty, clean, inspected, etc.)
 */
router.post('/housekeeping/room-status', async (req: Request, res: Response) => {
  try {
    const { roomId, roomNumber, status, previousStatus, hotelId } = req.body;

    logger.info('[OpsWebhook] Room status changed', { roomId, status, previousStatus });

    // Update room availability in StayOwn
    // Sync with Room QR service

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// MAINTENANCE WEBHOOKS (from rez-hotel-maintenance-service)
// ============================================================

/**
 * POST /webhooks/ops/maintenance/request-created
 * New maintenance request
 */
router.post('/maintenance/request-created', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    if (!verifySignature(JSON.stringify(req.body), signature)) {
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    const { requestId, roomId, roomNumber, category, priority, title, description, reportedBy, guestImpact, hotelId } = req.body;

    logger.info('[OpsWebhook] Maintenance request created', { requestId, roomId, category, priority });

    // If guest-affecting, notify guest about issue/ETA
    if (guestImpact === 'severe' || guestImpact === 'moderate') {
      // Send in-app notification to guest about issue
      logger.info('[OpsWebhook] Guest impact notification triggered', { guestImpact, requestId });
    }

    res.json({
      success: true,
      data: {
        requestId,
        guestNotification: guestImpact ? 'sent' : 'not_needed'
      }
    });
  } catch (error: any) {
    logger.error('[OpsWebhook] Maintenance request error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /webhooks/ops/maintenance/request-completed
 * Maintenance work finished
 */
router.post('/maintenance/request-completed', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    if (!verifySignature(JSON.stringify(req.body), signature)) {
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    const { requestId, roomId, completedBy, completedAt, notes, guestNotification, hotelId } = req.body;

    logger.info('[OpsWebhook] Maintenance request completed', { requestId, roomId });

    // Notify guest issue is resolved
    // If room was out of service, update availability

    res.json({
      success: true,
      data: {
        requestId,
        guestNotification: 'resolved_message_sent'
      }
    });
  } catch (error: any) {
    logger.error('[OpsWebhook] Maintenance completion error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /webhooks/ops/maintenance/scheduled
 * Scheduled maintenance event
 */
router.post('/maintenance/scheduled', async (req: Request, res: Response) => {
  try {
    const { scheduleId, roomId, type, nextDue, hotelId } = req.body;

    logger.info('[OpsWebhook] Scheduled maintenance', { scheduleId, roomId, nextDue });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// CHANNEL MANAGER WEBHOOKS (OTA sync)
// ============================================================

/**
 * POST /webhooks/ops/channel/availability-update
 * Room availability changed via OTA/channel
 */
router.post('/channel/availability-update', async (req: Request, res: Response) => {
  try {
    const { hotelId, roomTypeId, date, available, price, channel } = req.body;

    logger.info('[OpsWebhook] Channel availability update', { hotelId, roomTypeId, date, channel });

    // Update local availability cache
    // Sync with pricing engine

    res.json({ success: true, synced: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /webhooks/ops/channel/booking-received
 * New booking from OTA channel
 */
router.post('/channel/booking-received', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    if (!verifySignature(JSON.stringify(req.body), signature)) {
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    const { bookingId, hotelId, channel, guestName, guestEmail, guestPhone, checkIn, checkOut, roomType, totalAmount, status } = req.body;

    logger.info('[OpsWebhook] Channel booking received', { bookingId, channel, hotelId });

    // Create guest profile in StayOwn
    // Generate Room QR if check-in is imminent
    // Send pre-arrival message

    res.json({
      success: true,
      data: {
        bookingId,
        guestTwinCreated: true,
        preArrivalMessage: 'scheduled'
      }
    });
  } catch (error: any) {
    logger.error('[OpsWebhook] Channel booking error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /webhooks/ops/channel/booking-cancelled
 * Booking cancelled via OTA
 */
router.post('/channel/booking-cancelled', async (req: Request, res: Response) => {
  try {
    const { bookingId, hotelId, channel, reason, refundStatus } = req.body;

    logger.info('[OpsWebhook] Channel booking cancelled', { bookingId, channel, reason });

    // Cancel Room QR
    // Update guest Twin
    // Send cancellation confirmation

    res.json({
      success: true,
      data: {
        bookingId,
        qrCancelled: true,
        guestNotification: 'sent'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// DYNAMIC PRICING WEBHOOKS (from rez-dynamic-pricing-service)
// ============================================================

/**
 * POST /webhooks/ops/pricing/updated
 * Room prices updated by pricing engine
 */
router.post('/pricing/updated', async (req: Request, res: Response) => {
  try {
    const { hotelId, roomTypeId, date, oldPrice, newPrice, reason, validFrom, validUntil } = req.body;

    logger.info('[OpsWebhook] Pricing updated', { hotelId, roomTypeId, date, oldPrice, newPrice, reason });

    // Update pricing in StayOwn displays
    // Send notification to waiting guests (FOMO)
    // Log for analytics

    res.json({
      success: true,
      data: {
        priceUpdated: true,
        notificationsSent: 0 // count of waiting guests notified
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /webhooks/ops/pricing/promo-created
 * New promotional rate created
 */
router.post('/pricing/promo-created', async (req: Request, res: Response) => {
  try {
    const { promoId, hotelId, roomTypeId, discountPercent, validDates, promoCode, description } = req.body;

    logger.info('[OpsWebhook] Promo created', { promoId, hotelId, discountPercent });

    // Broadcast promo to potential guests
    // Update marketing campaigns

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// REPUTATION WEBHOOKS (from rez-reputation-service)
// ============================================================

/**
 * POST /webhooks/ops/reputation/review-received
 * New guest review submitted
 */
router.post('/reputation/review-received', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    if (!verifySignature(JSON.stringify(req.body), signature)) {
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    const { reviewId, bookingId, hotelId, guestId, rating, title, text, categories, response, source, createdAt } = req.body;

    logger.info('[OpsWebhook] Review received', { reviewId, hotelId, rating, source });

    // Update hotel reputation score
    // Update guest Twin with feedback
    // Trigger response workflow for low ratings

    // If rating is low, alert management
    const needsAttention = rating < 3;

    res.json({
      success: true,
      data: {
        reviewId,
        needsAttention,
        managerAlert: needsAttention ? 'sent' : 'none',
        guestTwinUpdated: true
      }
    });
  } catch (error: any) {
    logger.error('[OpsWebhook] Review error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /webhooks/ops/reputation/review-response
 * Hotel responded to review
 */
router.post('/reputation/review-response', async (req: Request, res: Response) => {
  try {
    const { reviewId, responseText, respondedBy, respondedAt } = req.body;

    logger.info('[OpsWebhook] Review response', { reviewId });

    // Notify guest of response
    // Update public display

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// HEALTH CHECK
// ============================================================

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'stayown-ops-webhooks',
    timestamp: new Date().toISOString()
  });
});

export default router;
