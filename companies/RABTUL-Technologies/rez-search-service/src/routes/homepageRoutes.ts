import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { optionalAuth } from '../middleware/auth';
import * as homepageService from '../services/homepageService';
import { track } from '../services/intentCaptureService';

const router = Router();

// ── Homepage feed ─────────────────────────────────────────────
// Native:  /home/feed
// Compat:  /api/homepage (monolith path — homepageRoutes mounted at /api/homepage)
async function homeFeedHandler(req: { userId?: string } & Request, res: Response) {
  try {
    const { lat, lng, city } = req.query;
    const result = await homepageService.getHomeFeed({
      userId: req.userId,
      lat: lat ? parseFloat(lat as string) : undefined,
      lng: lng ? parseFloat(lng as string) : undefined,
      city: city as string,
    });
    res.json({ success: true, data: result });
    const homeKey = city ? `home_view_${city}` : 'home_view_global';
    track({ userId: req.userId, event: 'home:view', intentKey: homeKey, properties: { city: city || 'unknown', sectionCount: result.sections?.length ?? 0 } }).catch(() => {});
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
router.get('/home/feed', optionalAuth, homeFeedHandler);
router.get('/api/homepage', optionalAuth, homeFeedHandler);

// ── Homepage sections config ──────────────────────────────────
async function homeSectionsHandler(_req: Request, res: Response) {
  res.json({ success: true, data: homepageService.getHomeSections() });
}
router.get('/home/sections', optionalAuth, homeSectionsHandler);
router.get('/api/homepage/sections', optionalAuth, homeSectionsHandler);

// ── User context (aggregates wallet, vouchers, cart, offers for homepage) ───
router.get('/api/homepage/user-context', optionalAuth, async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.json({
      success: true,
      data: { walletBalance: 0, totalSaved: 0, voucherCount: 0, offersCount: 0, cartItemCount: 0, subscription: { tier: 'free', status: 'active' } },
    });
  }

  try {
    const db = mongoose.connection;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ success: false, error: 'Invalid userId' });
      return;
    }
    const uid = new mongoose.Types.ObjectId(userId);

    const [walletDoc, voucherCount, cartDoc, subscription] = await Promise.all([
      db.collection('wallets').findOne(
        { user: uid },
        { projection: { 'balance.available': 1, 'savingsInsights.totalSaved': 1 } },
      ),
      db.collection('vouchers').countDocuments({ user: uid, status: 'active', expiresAt: { $gt: new Date() } }),
      db.collection('carts').findOne({ user: uid }, { projection: { items: 1 } }),
      db.collection('subscriptions').findOne({ user: uid, status: 'active' }, { projection: { tier: 1, status: 1 } }),
    ]);

    res.json({
      success: true,
      data: {
        walletBalance: walletDoc?.balance?.available ?? 0,
        totalSaved: walletDoc?.savingsInsights?.totalSaved ?? 0,
        voucherCount: voucherCount ?? 0,
        offersCount: 0,
        cartItemCount: Array.isArray(cartDoc?.items) ? cartDoc.items.length : 0,
        subscription: subscription ? { tier: subscription.tier, status: subscription.status } : { tier: 'free', status: 'active' },
      },
    });
  } catch (err) {
    // Graceful degradation — return zeros rather than failing the homepage
    res.json({
      success: true,
      data: { walletBalance: 0, totalSaved: 0, voucherCount: 0, offersCount: 0, cartItemCount: 0, subscription: { tier: 'free', status: 'active' } },
    });
  }
});

export default router;
