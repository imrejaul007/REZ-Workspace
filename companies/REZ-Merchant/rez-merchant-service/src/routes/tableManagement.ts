
import { Router, Request, Response } from 'express';
import { Store } from '../models/Store';
import { TableSession } from '../models/TableSession';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

router.get('/table-status', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    if (!storeId) { res.status(400).json({ success: false, message: 'storeId required' }); return; }
    const store = await Store.findOne({ _id: storeId, merchantId: req.merchantId }).lean() as unknown;
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    res.json({ success: true, data: store.tableConfig || [] });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.patch('/:tableId/status', async (req: Request, res: Response) => {
  try {
    const { status, storeId } = req.body;
    if (!storeId || !['available','occupied','reserved'].includes(status)) { res.status(400).json({ success: false, message: 'storeId and valid status required' }); return; }
    const store = await Store.findOne({ _id: storeId, merchantId: req.merchantId }) as unknown;
    if (!store) { res.status(403).json({ success: false, message: 'Not authorized' }); return; }
    const idx = store.tableConfig?.findIndex((t) => t._id?.toString() === req.params.tableId);
    if (idx >= 0) { store.tableConfig[idx].status = status; await store.save(); }
    if (status === 'available') await TableSession.updateMany({ storeId, tableId: req.params.tableId, status: 'open' }, { $set: { status: 'closed', closedAt: new Date() } });
    res.json({ success: true, data: { tableId: req.params.tableId, status } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/dine-in/start-order', async (req: Request, res: Response) => {
  try {
    const { storeId, tableId, guestCount } = req.body;
    if (!storeId || !tableId || !guestCount) { res.status(400).json({ success: false, message: 'storeId, tableId, guestCount required' }); return; }
    // MS-24: Verify storeId belongs to requesting merchant
    const ownedStore = await Store.findOne({ _id: storeId, merchantId: req.merchantId }).select('_id').lean();
    if (!ownedStore) { res.status(403).json({ success: false, message: 'Access denied: store not found or not yours' }); return; }
    const session = await TableSession.create({ storeId, tableId, guestCount, merchantId: req.merchantId, status: 'open', openedAt: new Date() });
    res.status(201).json({ success: true, data: session });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/table-orders/:tableId', async (req: Request, res: Response) => {
  try {
    // MS-24: Scope session lookup to this merchant to prevent cross-merchant table snooping
    const session = await TableSession.findOne({ tableId: req.params.tableId, merchantId: req.merchantId, status: 'open' }).lean();
    res.json({ success: true, data: session || null });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.put('/table-orders/:sessionId/items', async (req: Request, res: Response) => {
  try {
    const { items } = req.body as { items?: unknown[] };
    if (!Array.isArray(items)) {
      res.status(400).json({ success: false, message: 'items array is required' });
      return;
    }
    const session = await TableSession.findOneAndUpdate(
      { _id: req.params.sessionId, merchantId: req.merchantId, status: 'open' },
      { $set: { items, updatedAt: new Date() } },
      { new: true }
    ).lean();
    if (!session) {
      res.status(404).json({ success: false, message: 'Active session not found' });
      return;
    }
    res.json({ success: true, data: session });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
