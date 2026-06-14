/**
 * Karma Perk Routes — merchant-facing perk management
 *
 * Allows merchants to:
 *   - Fetch perks available at their outlet
 *   - See which perks are eligible based on user's KarmaScore band
 *   - Track perk redemptions
 *
 * Base path: /api/karma
 */
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { merchantAuth } from '../middleware/auth';

const INTERNAL_SERVICE_TIMEOUT_MS = 10000;

interface KarmaApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

const router = Router();
router.use(merchantAuth);

const KARMA_SERVICE_URL = process.env.KARMA_SERVICE_URL || process.env.REZ_KARMA_SERVICE_URL || '';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

/**
 * GET /api/karma/perks
 * Fetch all perks for this merchant's outlets.
 */
router.get('/perks', async (req: Request, res: Response) => {
  try {
    if (!KARMA_SERVICE_URL) {
      res.status(503).json({ success: false, message: 'Karma service not configured' });
      return;
    }
    const merchantId = (req as unknown).merchantId;
    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      res.status(400).json({ success: false, message: 'Invalid merchantId' });
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), INTERNAL_SERVICE_TIMEOUT_MS);
    let apiRes: globalThis.Response;
    try {
      apiRes = await fetch(`${KARMA_SERVICE_URL}/api/karma/perks?merchantId=${merchantId}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-internal-token': INTERNAL_TOKEN,
          'x-internal-service': 'rez-merchant-service',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === 'AbortError') {
        res.status(504).json({ success: false, message: 'Karma service timeout' });
        return;
      }
      throw err;
    }
    const data = await apiRes.json();
    res.status(apiRes.status).json(data);
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /api/karma/perks/eligible
 * Check which perks a user is eligible for based on their KarmaScore.
 * Query params: userId
 */
router.get('/perks/eligible', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ success: false, message: 'userId is required' });
      return;
    }
    if (!KARMA_SERVICE_URL) {
      res.status(503).json({ success: false, message: 'Karma service not configured' });
      return;
    }
    const merchantId = (req as unknown).merchantId;
    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      res.status(400).json({ success: false, message: 'Invalid merchantId' });
      return;
    }

    let scoreResponse: globalThis.Response;
    {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), INTERNAL_SERVICE_TIMEOUT_MS);
      try {
        scoreResponse = await fetch(`${KARMA_SERVICE_URL}/api/karma/score?userId=${userId}`, {
          headers: {
            'Content-Type': 'application/json',
            'x-internal-token': INTERNAL_TOKEN,
            'x-internal-service': 'rez-merchant-service',
          },
          signal: controller.signal,
        });
        clearTimeout(timer);
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof Error && err.name === 'AbortError') {
          res.status(504).json({ success: false, message: 'Karma service timeout' });
          return;
        }
        throw err;
      }
    }
    const scoreData = await scoreResponse!.json() as unknown as KarmaApiResponse<{ band?: string; total?: number }>;

    if (!scoreData.success) {
      res.status(scoreResponse!.status).json(scoreData);
      return;
    }

    const userBand = scoreData.data?.band;
    const userScore = scoreData.data?.total ?? 0;

    // Fetch perks and filter by band eligibility
    let perksResponse: globalThis.Response;
    {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), INTERNAL_SERVICE_TIMEOUT_MS);
      try {
        perksResponse = await fetch(`${KARMA_SERVICE_URL}/api/karma/perks?merchantId=${merchantId}`, {
          headers: {
            'Content-Type': 'application/json',
            'x-internal-token': INTERNAL_TOKEN,
            'x-internal-service': 'rez-merchant-service',
          },
          signal: controller.signal,
        });
        clearTimeout(timer);
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof Error && err.name === 'AbortError') {
          res.status(504).json({ success: false, message: 'Karma service timeout' });
          return;
        }
        throw err;
      }
    }
    const perksData = await perksResponse!.json() as unknown as KarmaApiResponse<Array<{ minKarmaScore: number; requiredBand: string }>>;

    const eligiblePerks = (perksData.data ?? []).filter((perk) => {
      return perk.minKarmaScore <= userScore && perk.requiredBand === userBand;
    });

    res.json({
      success: true,
      data: {
        userBand,
        userScore,
        eligiblePerks,
        totalPerks: perksData.data?.length ?? 0,
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * POST /api/karma/perks/redeem
 * Redeem a perk for a user.
 * Body: { userId, perkId, orderId }
 */
router.post('/perks/redeem', async (req: Request, res: Response) => {
  try {
    const { userId, perkId, orderId } = req.body;
    if (!userId || !perkId) {
      res.status(400).json({ success: false, message: 'userId and perkId are required' });
      return;
    }
    if (!KARMA_SERVICE_URL) {
      res.status(503).json({ success: false, message: 'Karma service not configured' });
      return;
    }
    const merchantId = (req as unknown).merchantId;
    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      res.status(400).json({ success: false, message: 'Invalid merchantId' });
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), INTERNAL_SERVICE_TIMEOUT_MS);
    let apiRes: globalThis.Response;
    try {
      apiRes = await fetch(`${KARMA_SERVICE_URL}/api/karma/perks/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-token': INTERNAL_TOKEN,
          'x-internal-service': 'rez-merchant-service',
        },
        body: JSON.stringify({ userId, perkId, merchantId, orderId }),
        signal: controller.signal,
      });
      clearTimeout(timer);
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === 'AbortError') {
        res.status(504).json({ success: false, message: 'Karma service timeout' });
        return;
      }
      throw err;
    }
    const data = await apiRes.json();
    res.status(apiRes.status).json(data);
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
