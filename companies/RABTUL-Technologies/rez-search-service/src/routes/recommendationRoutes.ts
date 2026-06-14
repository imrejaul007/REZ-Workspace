import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { requireAuth, optionalAuth } from '../middleware/auth';
import * as rec from '../services/recommendationService';
import { track } from '../services/intentCaptureService';

const router = Router();

// ── Personalized recommendations ──────────────────────────────
async function personalizedHandler(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }
  try {
    const stores = await rec.getPersonalized(userId, parseInt(req.query.limit as string) || 10);
    res.json({ success: true, data: stores });
    track({ userId, event: 'recommend:personalized', intentKey: `recommend_personalized_${userId}`, properties: { storeCount: stores.length } }).catch(() => {});
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
router.get('/recommend/personalized', requireAuth, personalizedHandler);
router.get('/api/recommendations/products/personalized', requireAuth, personalizedHandler);

// ── Store recommendations ─────────────────────────────────────
async function storeRecHandler(req: Request, res: Response) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.storeId)) {
      res.status(400).json({ success: false, error: 'Invalid storeId' });
      return;
    }
    const stores = await rec.getStoreRecommendations(req.params.storeId, parseInt(req.query.limit as string) || 5);
    res.json({ success: true, data: stores });
    track({ event: 'recommend:store', intentKey: `recommend_store_${req.params.storeId}`, properties: { storeId: req.params.storeId, storeCount: stores.length } }).catch(() => {});
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
router.get('/recommend/store/:storeId', optionalAuth, storeRecHandler);
router.get('/api/recommendations/store/:storeId', optionalAuth, storeRecHandler);

// ── Trending ──────────────────────────────────────────────────
async function trendingHandler(req: Request, res: Response) {
  try {
    const { city, category, limit } = req.query;
    const stores = await rec.getTrending(city as string, category as string, parseInt(limit as string) || 10);
    res.json({ success: true, data: stores });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
router.get('/recommend/trending', optionalAuth, trendingHandler);
router.get('/api/recommendations/trending', optionalAuth, trendingHandler);

// ── Picked for you ────────────────────────────────────────────
async function pickedForYouHandler(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }
  try {
    const stores = await rec.getPickedForYou(userId, parseInt(req.query.limit as string) || 10);
    res.json({ success: true, data: stores });
    track({ userId, event: 'recommend:picked-for-you', intentKey: `recommend_picked_for_you_${userId}`, properties: { storeCount: stores.length } }).catch(() => {});
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
router.get('/recommend/picked-for-you', requireAuth, pickedForYouHandler);
router.get('/api/recommendations/picked-for-you', requireAuth, pickedForYouHandler);

export default router;
