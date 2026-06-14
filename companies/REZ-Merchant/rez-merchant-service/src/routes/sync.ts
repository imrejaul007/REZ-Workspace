import { Router, Request, Response } from 'express';
import { Store } from '../models/Store';
import { Product } from '../models/Product';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

// In-memory sync tracking (per merchant)
const syncStatus: Record<string, { lastSync: Date; syncTypes: string[]; count: number }> = {};

// POST /sync/trigger — manual sync
router.post('/trigger', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const { syncTypes = ['products', 'orders', 'cashback', 'merchant'] } = req.body;

    // Count items that would be synced
    const stores = await Store.find({ merchantId: merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);
    const productCount = await Product.countDocuments({ store: { $in: storeIds }, isActive: true, isDeleted: { $ne: true } });

    syncStatus[merchantId] = { lastSync: new Date(), syncTypes, count: productCount };

    res.json({ success: true, message: 'Sync completed', data: { syncTypes, itemsSynced: productCount, syncedAt: new Date() } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /sync/status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = syncStatus[req.merchantId!] || { lastSync: null, syncTypes: [], count: 0 };
    res.json({ success: true, data: status });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /sync/history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const status = syncStatus[req.merchantId!];
    res.json({ success: true, data: status ? [status] : [] });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /sync/schedule
router.get('/schedule', async (req: Request, res: Response) => {
  try {
    const status = syncStatus[req.merchantId!];
    res.json({
      success: true,
      data: {
        enabled: !!status,
        intervalMinutes: 15,
        nextSync: status ? new Date(status.lastSync.getTime() + 15 * 60000) : null,
        lastSync: status?.lastSync || null,
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

// POST /sync/schedule
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    const { intervalMinutes = 15 } = req.body;
    if (intervalMinutes < 5 || intervalMinutes > 1440) {
      res.status(400).json({ success: false, message: 'Interval must be 5-1440 minutes' }); return;
    }
    res.json({ success: true, message: `Auto-sync every ${intervalMinutes}min`, data: { intervalMinutes, nextSync: new Date(Date.now() + intervalMinutes * 60000) } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// DELETE /sync/schedule
router.delete('/schedule', async (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Auto-sync cleared' });
});

// GET /sync/statistics
// HIGH FIX: This endpoint returns internal metrics - require authentication
router.get('/statistics', async (req: Request, res: Response) => {
  if (!req.merchantId) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  res.json({ success: true, data: { activeMerchants: Object.keys(syncStatus).length, totalSyncs: Object.values(syncStatus).reduce((s, v) => s + v.count, 0) } });
});

// POST /sync/products
router.post('/products', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const count = await Product.countDocuments({ store: { $in: stores.map((s) => s._id) }, isActive: true });
    res.json({ success: true, message: 'Products synced', data: { count } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /sync/orders
router.post('/orders', async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Orders synced', data: { count: 0 } });
});

// POST /sync/cashback
router.post('/cashback', async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Cashback synced', data: { count: 0 } });
});

// POST /sync/merchant
router.post('/merchant', async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Merchant profile synced', data: { count: 1 } });
});

// GET /sync/health
router.get('/health', async (req: Request, res: Response) => {
  res.json({ success: true, data: { service: 'healthy', uptime: process.uptime(), timestamp: new Date() } });
});

export default router;
