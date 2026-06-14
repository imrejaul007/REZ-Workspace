import { Router, Request, Response } from 'express';
import { demandAggregator } from '../utils/MarketplaceDemandAggregator';

const router = Router();

/**
 * Internal-only route — requires X-Internal-Token header.
 * Returns anonymised demand signals (min 5-merchant privacy floor).
 *
 * GET /demand-signals?city=bangalore
 * GET /demand-signals?category=cooking-oil
 * GET /demand-signals?city=bangalore&category=cooking-oil
 */
function internalTokenGuard(req: Request, res: Response, next: () => void): void {
  const token = req.headers['x-internal-token'] as string | undefined;
  const expected = process.env.INTERNAL_SERVICE_TOKEN;

  if (!expected) {
    res.status(500).json({ success: false, message: 'Internal token not configured' });
    return;
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  // MERCH-AUDIT-6: Use timing-safe comparison to prevent timing attacks
  const crypto = require('crypto');
  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expected);
  if (tokenBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  next();
}

router.get('/', internalTokenGuard, async (req: Request, res: Response) => {
  try {
    const city = (req.query.city as string | undefined)?.trim();
    const category = (req.query.category as string | undefined)?.trim();

    if (!city && !category) {
      res.status(400).json({
        success: false,
        message: 'Provide at least one of: city, category',
      });
      return;
    }

    let signals;

    if (city && category) {
      // Fetch by city then filter to requested category
      const byCitySignals = await demandAggregator.aggregateDemandByCity(city);
      signals = byCitySignals.filter(
        (s) => s.category.toLowerCase() === category.toLowerCase(),
      );
    } else if (city) {
      signals = await demandAggregator.aggregateDemandByCity(city);
    } else {
      signals = await demandAggregator.aggregateDemandByCategory(category!);
    }

    res.json({ success: true, data: signals });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
