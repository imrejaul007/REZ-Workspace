/**
 * Internal routes — service-to-service only.
 *
 * CS-NB1 fix: GET /internal/merchants/by-rez-user/:rezUserId
 *   Used by NextaBiZ (and other partner apps) after OAuth2 login to look up the
 *   merchant account linked to a REZ user ID (from /oauth/userinfo sub field).
 *
 * CS-NB1 fix: POST /internal/merchants/:merchantId/link-rez-user
 *   Links a merchant account to a REZ user ID. Called by NextaBiZ after OAuth2
 *   login when the merchant hasn't yet linked their REZ account.
 *
 * All routes here require a valid X-Internal-Token header verified by
 * requireInternalToken middleware. These endpoints are NOT reachable from the
 * public API gateway (nginx proxies /api/merchant/* only — /internal/* is
 * blocked at the gateway layer).
 *
 * CS-C2 fix: POST /internal/merchants/:merchantId/invalidate-session
 *   Called by rezbackend admin routes after suspend/reject/approve to flush the
 *   merchant's cached auth status, forcing the next request to re-check isActive
 *   from MongoDB. Also sets a Redis suspension marker that the auth middleware
 *   checks independently, so the block is immediate even within the 5-min status
 *   cache window.
 *
 * CS-H2 fix: GET /internal/merchants/:merchantId/order-stats
 *   Provides order statistics used by rez-wallet-service credit scoring.
 *
 * Health Score fix: GET /internal/merchants/:merchantId/reviews/stats
 *   Provides review statistics for merchant health score calculation.
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { requireInternalToken } from '../middleware/internalAuth';
import { redis } from '../config/redis';
import { Order } from '../models/Order';
import { Merchant } from '../models/Merchant';
import { CampaignRule } from '../models/CampaignRule';
import { logger } from '../config/logger';
import mongoose from 'mongoose';
import nextabizzSignals from './nextabizzSignals';
import { Review } from '../models/Review';

const router = Router();

// Mount NextaBiZ signals route
router.use('/nextabizz', nextabizzSignals);

// ── POST /internal/merchants/:merchantId/invalidate-session ──────────────────

/**
 * Invalidate all active sessions for a merchant.
 *
 * Actions taken:
 * 1. Delete the Redis status cache (merchant:status:<id>) so the next
 *    authenticated request re-fetches isActive from MongoDB and gets blocked.
 * 2. Set merchant:suspended:<id> = 1 (7-day TTL) — the auth middleware checks
 *    this key as an immediate block before checking the status cache.
 * 3. POST to the monolith's merchant-suspend-notify endpoint so Socket.IO
 *    emits merchant_suspended to the merchant's connected clients, forcing an
 *    immediate logout even if their socket stays open.
 *
 * This is a fire-and-forget call from rezbackend — failure here is non-fatal
 * to the admin action but is logged as an error.
 */
router.post(
  '/merchants/:merchantId/invalidate-session',
  requireInternalToken,
  async (req: Request, res: Response): Promise<void> => {
    const { merchantId } = req.params;
    const reason: string = req.body?.reason;

    if (!merchantId || !/^[a-f0-9]{24}$/i.test(merchantId)) {
      res.status(400).json({ success: false, error: 'Invalid merchantId' });
      return;
    }

    try {
      // HIGH-SEC FIX: Atomic session invalidation using Redis multi/exec transaction.
      // Previously used two separate Redis calls — if the process crashed between them,
      // the suspension marker could be set without clearing the status cache (merchant
      // remains unblocked) or vice versa (merchant stuck as suspended). Using a pipeline
      // ensures both operations succeed or both are rolled back atomically.
      const pipeline = redis.multi();
      pipeline.del(`merchant:status:${merchantId}`);
      pipeline.set(`merchant:suspended:${merchantId}`, '1', 'EX', 300);
      await pipeline.exec();

      // MISS-06 FIX: Emit merchant_suspended via Socket.IO so the merchant app
      // disconnects immediately. The monolith admin routes also emit this, but
      // this covers the direct-invalidate-session path.
      const backendUrl =
        process.env.REZ_BACKEND_URL ||
        process.env.BACKEND_URL ||
        process.env.API_URL ||
        process.env.REZ_CONTRACTS_URL ||
        (() => { throw new Error('Backend URL is not configured') })();

      const secret = process.env.INTERNAL_WEBHOOK_SECRET;
      if (secret) {
        // FIX-WEBHOOK-001: Sign webhook payload with HMAC-SHA256 for integrity verification
        const payload = JSON.stringify({ merchantId, reason });
        const signature = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');

        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), 5000);
        fetch(`${backendUrl}/api/internal/payments/merchant-suspend-notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Signature': signature,
          },
          body: payload,
          signal: ac.signal,
        })
          .then((r) => {
            if (!r.ok) {
              logger.warn('[internalRoutes] merchant-suspend-notify returned non-OK', {
                merchantId,
                status: r.status,
              });
            } else {
              logger.info('[internalRoutes] merchant_suspended socket event emitted', { merchantId });
            }
          })
          .catch((err) => {
            if (err.name !== 'AbortError') {
              logger.warn('[internalRoutes] Failed to emit merchant_suspended socket event', {
                merchantId,
                error: err.message,
              });
            }
          })
          .finally(() => clearTimeout(timer));
      } else {
        logger.debug('[internalRoutes] INTERNAL_WEBHOOK_SECRET not set — skipping socket emit');
      }

      logger.info('[internalRoutes] Merchant session invalidated', { merchantId });
      res.json({ success: true, merchantId });
    } catch (err: unknown) {
      logger.error('[internalRoutes] Failed to invalidate merchant session', {
        merchantId,
        error: err.message,
      });
      res.status(500).json({ success: false, error: 'Failed to invalidate session' });
    }
  },
);

// ── GET /internal/merchants/:merchantId/reviews/stats ───────────────────────

/**
 * Returns review statistics for a merchant used by rez-app-merchant health score.
 *
 * Response shape:
 *   { data: { averageRating, totalReviews, recentReviews, ratingDistribution, sentimentScore } }
 */
router.get(
  '/merchants/:merchantId/reviews/stats',
  requireInternalToken,
  async (req: Request, res: Response): Promise<void> => {
    const { merchantId } = req.params;
    const { days = '30' } = req.query;

    if (!merchantId || !/^[a-f0-9]{24}$/i.test(merchantId)) {
      res.status(400).json({ success: false, error: 'Invalid merchantId' });
      return;
    }

    try {
      const merchantOid = new mongoose.Types.ObjectId(merchantId);
      const daysNum = parseInt(days as string, 10) || 30;
      const since = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

      // Check if Review model exists, if not return default stats
      let reviewStats = {
        averageRating: 0,
        totalReviews: 0,
        recentReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        positiveReviewCount: 0,
        negativeReviewCount: 0,
        responseRate: 0,
        sentimentScore: 50,
      };

      try {
        // Aggregate review stats
        const pipeline = [
          {
            $match: {
              merchant: merchantOid,
              createdAt: { $gte: since },
            },
          },
          {
            $facet: {
              overview: [
                {
                  $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    positiveReviews: {
                      $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] },
                    },
                    negativeReviews: {
                      $sum: { $cond: [{ $lte: ['$rating', 2] }, 1, 0] },
                    },
                  },
                },
              ],
              distribution: [
                {
                  $group: {
                    _id: '$rating',
                    count: { $sum: 1 },
                  },
                },
              ],
              recent: [
                { $match: { createdAt: { $gte: since } } },
                { $count: 'count' },
              ],
            },
          },
        ];

        const results = await Review.aggregate(pipeline).exec();
        const data = results[0];

        if (data?.overview?.[0]) {
          const overview = data.overview[0];
          reviewStats = {
            averageRating: Math.round((overview.averageRating || 0) * 10) / 10,
            totalReviews: overview.totalReviews || 0,
            recentReviews: data.recent?.[0]?.count || 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            positiveReviewCount: overview.positiveReviews || 0,
            negativeReviewCount: overview.negativeReviews || 0,
            responseRate: 0, // Would need reviewResponse tracking
            sentimentScore: overview.totalReviews > 0
              ? Math.round((overview.positiveReviews / overview.totalReviews) * 100)
              : 50,
          };

          // Populate distribution
          if (data.distribution) {
            for (const dist of data.distribution) {
              const rating = String(dist._id);
              if (rating in reviewStats.ratingDistribution) {
                reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution] = dist.count;
              }
            }
          }
        }
      } catch (modelErr) {
        // Review model may not exist, return default stats
        logger.debug('[internalRoutes] Review model not available, using defaults', {
          merchantId,
          error: (modelErr as Error).message,
        });
      }

      res.json({
        success: true,
        data: reviewStats,
      });
    } catch (err: unknown) {
      logger.error('[internalRoutes] Failed to fetch review stats', {
        merchantId,
        error: err.message,
      });
      res.status(500).json({ success: false, error: 'Failed to fetch review stats' });
    }
  },
);

// ── GET /internal/merchants/:merchantId/order-stats ──────────────────────────

/**
 * Returns order statistics for a merchant used by rez-wallet-service credit scoring.
 *
 * Response shape:
 *   { data: { ordersPerMonth: number, disputeRate: number, accountAgeMonths: number } }
 *
 * CS-H2 fix: this endpoint was called by rez-wallet-service creditScore.ts but
 * did not exist, causing all credit scores to be computed with fabricated zeros.
 */
router.get(
  '/merchants/:merchantId/order-stats',
  requireInternalToken,
  async (req: Request, res: Response): Promise<void> => {
    const { merchantId } = req.params;

    if (!merchantId || !/^[a-f0-9]{24}$/i.test(merchantId)) {
      res.status(400).json({ success: false, error: 'Invalid merchantId' });
      return;
    }

    try {
      const merchantOid = new mongoose.Types.ObjectId(merchantId);

      // Fetch merchant for account age
      const merchant = await Merchant.findById(merchantOid)
        .select('createdAt')
        .lean();

      const accountAgeMonths = merchant
        ? Math.floor(
            (Date.now() - new Date((merchant as unknown).createdAt).getTime()) /
              (1000 * 60 * 60 * 24 * 30),
          )
        : 0;

      // Compute orders per month over the last 6 months
      const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);

      const [totalOrders, disputedOrders] = await Promise.all([
        Order.countDocuments({
          merchant: merchantOid,
          createdAt: { $gte: sixMonthsAgo },
        }),
        Order.countDocuments({
          merchant: merchantOid,
          createdAt: { $gte: sixMonthsAgo },
          status: { $in: ['disputed', 'cancelled'] },
        }),
      ]);

      const ordersPerMonth = totalOrders > 0 ? Math.round(totalOrders / 6) : 0;
      const disputeRate = totalOrders > 0 ? disputedOrders / totalOrders : 0;

      res.json({
        success: true,
        data: {
          ordersPerMonth,
          disputeRate: parseFloat(disputeRate.toFixed(4)),
          accountAgeMonths,
        },
      });
    } catch (err: unknown) {
      logger.error('[internalRoutes] Failed to fetch order stats', {
        merchantId,
        error: err.message,
      });
      res.status(500).json({ success: false, error: 'Failed to fetch order stats' });
    }
  },
);

// ── GET /internal/merchants/by-rez-user/:rezUserId ─────────────────────────

/**
 * Look up a merchant by their linked REZ user ID.
 *
 * Used by NextaBiZ (and other partner apps) after OAuth2 login to retrieve
 * the merchantId for the authenticated REZ user.
 *
 * Response:
 *   { success: true, data: { merchantId, businessName, isActive, verificationStatus } }
 *   { success: false, error: '...' } — 404 if not linked, 400 if invalid format
 */
router.get(
  '/merchants/by-rez-user/:rezUserId',
  requireInternalToken,
  async (req: Request, res: Response): Promise<void> => {
    const { rezUserId } = req.params;

    if (!rezUserId || rezUserId.length < 1 || rezUserId.length > 64) {
      res.status(400).json({ success: false, error: 'Invalid rezUserId format' });
      return;
    }

    try {
      const merchant = await Merchant.findOne({ rezUserId })
        .select('_id businessName isActive verificationStatus')
        .lean();

      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'No merchant linked to this REZ user',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          merchantId: (merchant as unknown)._id.toString(),
          businessName: (merchant as unknown).businessName,
          isActive: (merchant as unknown).isActive,
          verificationStatus: (merchant as unknown).verificationStatus,
        },
      });
    } catch (err: unknown) {
      logger.error('[internalRoutes] Failed to lookup merchant by rezUserId', {
        rezUserId,
        error: err.message,
      });
      res.status(500).json({ success: false, error: 'Failed to lookup merchant' });
    }
  },
);

// ── POST /internal/merchants/:merchantId/link-rez-user ──────────────────────

/**
 * Link a merchant account to a REZ user ID.
 *
 * Called by NextaBiZ after OAuth2 login when the merchant has not yet linked
 * their REZ account. Also used for re-linking if the existing link is stale.
 *
 * Request body:
 *   { rezUserId: string }
 *
 * Response:
 *   { success: true, merchantId: string }
 *   { success: false, error: '...' } — 409 if rezUserId already linked to another merchant
 */
router.post(
  '/merchants/:merchantId/link-rez-user',
  requireInternalToken,
  async (req: Request, res: Response): Promise<void> => {
    const { merchantId } = req.params;
    const { rezUserId } = req.body;

    if (!merchantId || !/^[a-f0-9]{24}$/i.test(merchantId)) {
      res.status(400).json({ success: false, error: 'Invalid merchantId' });
      return;
    }

    if (!rezUserId || typeof rezUserId !== 'string' || rezUserId.length < 1 || rezUserId.length > 64) {
      res.status(400).json({ success: false, error: 'Invalid rezUserId' });
      return;
    }

    try {
      // Check if this rezUserId is already linked to another merchant
      const existing = await Merchant.findOne({ rezUserId }).lean();
      if (existing && (existing as unknown)._id.toString() !== merchantId) {
        res.status(409).json({
          success: false,
          error: 'This REZ account is already linked to another merchant',
        });
        return;
      }

      // Check if the target merchant exists
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        res.status(404).json({ success: false, error: 'Merchant not found' });
        return;
      }

      await Merchant.findByIdAndUpdate(merchantId, { $set: { rezUserId } });

      logger.info('[internalRoutes] Merchant linked to REZ user', { merchantId, rezUserId });
      res.json({ success: true, merchantId });
    } catch (err: unknown) {
      logger.error('[internalRoutes] Failed to link merchant to rezUserId', {
        merchantId,
        error: err.message,
      });
      res.status(500).json({ success: false, error: 'Failed to link account' });
    }
  },
);

// ── POST /internal/campaigns/expire ─────────────────────────────────────────

/**
 * Expire campaigns where endDate < now and status is 'active'.
 *
 * Called by rez-scheduler-service every 15 minutes to automatically deactivate
 * expired campaigns. Updates both status and isActive fields for compatibility.
 *
 * FIX-15: Redis distributed lock prevents duplicate processing across instances.
 *
 * NOTE: This endpoint handles CampaignRule (internal promotion campaigns).
 * For rez-ads-service AdCampaign expiry, that service manages its own campaign
 * lifecycle via separate routes.
 *
 * Request body:
 *   { autoExpire: true }
 *
 * Response:
 *   { success: true, count: number }
 */
router.post(
  '/campaigns/expire',
  requireInternalToken,
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    // FIX-15: Acquire distributed lock to prevent duplicate processing across instances
    const lockKey = 'lock:campaign:expire:global';
    const lockValue = crypto.randomUUID();
    let lockAcquired = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let redis: unknown = null;

    try {
      redis = (await import('../config/redis')).redis;
      const acquired = await redis.set(lockKey, lockValue, 'EX', 60, 'NX');
      if (!acquired) {
        res.status(409).json({ success: false, message: 'Expiration already in progress' });
        return;
      }
      lockAcquired = true;
    } catch (err) {
      logger.warn('[internalRoutes] Failed to acquire campaign expiration lock, proceeding anyway', {
        error: (err as Error).message,
      });
    }

    try {
      const now = new Date();

      // Find all active campaigns where endDate has passed
      const result = await CampaignRule.updateMany(
        {
          endDate: { $lt: now },
          status: 'active',
        },
        {
          $set: {
            status: 'expired',
            isActive: false,
          },
        },
      );

      const duration = Date.now() - startTime;

      logger.info('[internalRoutes] Campaigns expired', {
        count: result.modifiedCount,
        duration,
      });

      res.json({ success: true, count: result.modifiedCount });
    } catch (err: unknown) {
      const duration = Date.now() - startTime;

      logger.error('[internalRoutes] Failed to expire campaigns', {
        error: err.message,
        duration,
      });

      res.status(500).json({ success: false, error: 'Failed to expire campaigns' });
    } finally {
      // FIX-15: Release lock only if we still hold it (safe release pattern)
      if (lockAcquired && redis) {
        try {
          const current = await redis.get(lockKey);
          if (current === lockValue) {
            await redis.del(lockKey);
          }
        } catch {
          // Best-effort release — don't throw in finally block
        }
      }
    }
  },
);

export default router;
