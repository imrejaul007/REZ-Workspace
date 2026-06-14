import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { merchantAuth } from '../middleware/auth';
import FeatureFlag from '../models/FeatureFlag';
import MerchantFeatureFlag from '../models/MerchantFeatureFlag';
import { cacheGet, cacheSet } from '../config/redis';

const router = Router();
router.use(merchantAuth);

/**
 * Determine if a merchant should receive a feature based on rollout percentage.
 * Uses deterministic hashing so the same merchant always gets the same result.
 * This allows gradual rollouts (e.g., 10% of users) without affecting existing users.
 */
function isInRollout(merchantId: string, flagKey: string, rolloutPercentage: number): boolean {
  // Create deterministic hash from merchantId + flagKey
  const hash = crypto
    .createHash('sha256')
    .update(`${merchantId}:${flagKey}`)
    .digest('hex');

  // Convert first 8 hex chars to number (0-4294967295)
  const hashNum = parseInt(hash.substring(0, 8), 16);

  // Determine if merchant is in rollout percentage
  const threshold = (rolloutPercentage / 100) * 4294967295;
  return hashNum <= threshold;
}

/**
 * Resolve the effective enabled state of a flag.
 * Priority: explicit override > rollout percentage > base enabled state
 */
function resolveEnabled(
  flag,
  override,
  merchantId: string
): { enabled: boolean; reason: 'override' | 'rollout' | 'base' } {
  // Explicit merchant override has highest priority
  if (override) {
    return { enabled: override.enabled, reason: 'override' };
  }

  // Check rollout percentage
  if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
    const inRollout = isInRollout(merchantId, flag.key, flag.rolloutPercentage);
    return {
      enabled: inRollout && flag.enabled,
      reason: 'rollout',
    };
  }

  // Fall back to base enabled state
  return { enabled: flag.enabled, reason: 'base' };
}

/**
 * GET /feature-flags
 * Returns the resolved feature flags for the authenticated merchant.
 * Combines global flags with per-merchant overrides and rollout percentages.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const env = (process.env.NODE_ENV === 'production' ? 'production' : 'development') as string;

    const cacheKey = `merchant:${merchantId}:feature-flags`;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) { res.json(cached); return; }

    const [globalFlags, merchantOverrides] = await Promise.all([
      FeatureFlag.find({ environments: env }).lean(),
      MerchantFeatureFlag.find({
        merchantId,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      }).lean(),
    ]);

    const overrideMap = new Map(
      merchantOverrides.map((o) => [o.flagKey, o]),
    );

    const flags = globalFlags.map((flag) => {
      const override = overrideMap.get(flag.key);
      const resolved = resolveEnabled(flag, override, merchantId);

      return {
        key: flag.key,
        description: flag.description,
        enabled: resolved.enabled,
        enabledReason: resolved.reason,
        rolloutPercentage: flag.rolloutPercentage ?? 100,
        isOverridden: !!override,
        overrideReason: override?.overrideReason || null,
        expiresAt: override?.expiresAt || null,
      };
    });

    const result = { success: true, data: flags };
    await cacheSet(cacheKey, result, 300); // 5 min cache
    res.json(result);
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /feature-flags/:key
 * Returns the resolved state of a single feature flag for this merchant.
 */
router.get('/:key', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const { key } = req.params;
    const env = (process.env.NODE_ENV === 'production' ? 'production' : 'development') as string;

    const [flag, override] = await Promise.all([
      FeatureFlag.findOne({ key, environments: env }).lean(),
      MerchantFeatureFlag.findOne({
        merchantId,
        flagKey: key,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      }).lean(),
    ]);

    if (!flag) {
      res.status(404).json({ success: false, message: `Flag '${key}' not found` });
      return;
    }

    const resolved = resolveEnabled(flag, override, merchantId);

    res.json({
      success: true,
      data: {
        key: flag.key,
        description: flag.description,
        enabled: resolved.enabled,
        enabledReason: resolved.reason,
        rolloutPercentage: flag.rolloutPercentage ?? 100,
        isOverridden: !!override,
        overrideReason: override?.overrideReason || null,
        expiresAt: override?.expiresAt || null,
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

export default router;
