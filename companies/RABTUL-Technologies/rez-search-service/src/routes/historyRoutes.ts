import { Router, Request, Response } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth';
import * as historyService from '../services/searchHistoryService';
import { track } from '../services/intentCaptureService';

const router = Router();

// ── Save search ───────────────────────────────────────────────
async function saveHandler(req: Request, res: Response) {
  try {
    const { query } = req.body;
    if (!query) { res.status(400).json({ success: false, error: 'Query required' }); return; }
    // SEA-001 FIX: runtime guard — crash if middleware chain is reordered
    const userId = req.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }
    await historyService.saveSearch(userId, query);
    res.json({ success: true });
    track({ userId, event: 'search:save', intentKey: `search_save_${query}`, properties: { query } }).catch(() => {});
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
router.post('/search/history', requireAuth, saveHandler);
router.post('/api/search/history', requireAuth, saveHandler);

// ── Get search history ────────────────────────────────────────
async function historyHandler(req: Request, res: Response) {
  try {
    // SEA-001 FIX: runtime guard — crash if middleware chain is reordered
    const userId = req.userId;
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const searches = await historyService.getRecentSearches(userId, limit);
    res.json({ success: true, data: searches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
router.get('/search/history', requireAuth, historyHandler);
router.get('/api/search/history', requireAuth, historyHandler);
router.get('/api/search/history/recent', requireAuth, historyHandler);

// ── Popular searches ──────────────────────────────────────────
async function popularHandler(req: Request, res: Response) {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const popular = await historyService.getPopularSearches(limit);
    res.json({ success: true, data: popular });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
router.get('/search/history/popular', optionalAuth, popularHandler);
router.get('/api/search/history/popular', optionalAuth, popularHandler);

export default router;
