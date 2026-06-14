import { Router, Request, Response } from 'express';
import { Merchant } from '../../models/Merchant';

const router = Router();

// ---------------------------------------------------------------------------
// GET /auth/:merchantId/logo
// ---------------------------------------------------------------------------
router.get('/:merchantId/logo', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const merchant = await Merchant.findById(merchantId).select('logo businessName').lean();
    if (!merchant) {
      res.status(404).json({ success: false, message: 'Merchant not found' });
      return;
    }
    res.json({
      success: true,
      data: {
        logo: merchant.logo || null,
        businessName: merchant.businessName,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch logo' });
  }
});

// ---------------------------------------------------------------------------
// GET /auth/app-version-check
// ---------------------------------------------------------------------------
/**
 * Checks if the merchant app version is up to date and determines
 * if an update is required or forced.
 */
router.get('/app-version-check', async (req: Request, res: Response) => {
  const MINIMUM_VERSION = '1.0.0';
  const FORCE_UPDATE_VERSION = '0.9.0';
  const clientVersion: string = (req.query.version as string) || '0.0.0';
  const latestVersion = process.env.APP_VERSION || '1.0.0';

  const semverToTuple = (v: string): number[] =>
    v.split('.').map((p) => parseInt(p, 10) || 0);
  const cmp = (a: number[], b: number[]): number => {
    for (let i = 0; i < 3; i++) {
      if ((a[i] ?? 0) > (b[i] ?? 0)) return 1;
      if ((a[i] ?? 0) < (b[i] ?? 0)) return -1;
    }
    return 0;
  };

  const client = semverToTuple(clientVersion);
  const minimum = semverToTuple(MINIMUM_VERSION);
  const force = semverToTuple(FORCE_UPDATE_VERSION);
  const latest = semverToTuple(latestVersion);

  const mustUpdate = cmp(client, force) < 0;
  const shouldUpdate = cmp(client, minimum) < 0 || cmp(client, latest) < 0;

  res.json({
    success: true,
    data: {
      latestVersion,
      minimumVersion: MINIMUM_VERSION,
      forceUpdateVersion: FORCE_UPDATE_VERSION,
      updateUrl: process.env.APP_STORE_URL || '',
      mustUpdate,
      shouldUpdate,
    },
  });
});

export default router;
