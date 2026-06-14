import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

// MS-20/21/22: All POS routes must verify storeId belongs to the requesting merchant.
// $or handles the cross-service Store schema fork (some docs have `merchant`,
// some have `merchantId`). Previously every POS endpoint would 403 for any
// store that was created via rez-backend instead of rez-merchant-service.
async function requireOwnedStore(req, res, storeId: string): Promise<boolean> {
  const owned = await Store.findOne({
    _id: storeId,
    $or: [{ merchant: req.merchantId }, { merchantId: req.merchantId }],
  })
    .select('_id')
    .lean();
  if (!owned) { res.status(403).json({ success: false, message: 'Access denied: store not found or not yours' }); return false; }
  return true;
}

router.post('/create-order', async (req: Request, res: Response) => {
  try {
    const { storeId, items, customerPhone, paymentMethod = 'cash', subtotal, tax, total, discount } = req.body;
    if (!storeId || !items?.length) { res.status(400).json({ success: false, message: 'storeId and items required' }); return; }
    if (!await requireOwnedStore(req, res, storeId)) return;

    // MERCH-AUDIT-10: Idempotency — use client-provided key or generate a UUID.
    // If an order with the same idempotency key already exists, return it instead of creating a duplicate.
    const requestId = (req.headers['x-idempotency-key'] as string) || crypto.randomUUID();

    const existing = await Order.findOne({ requestId }).lean();
    if (existing) {
      res.status(200).json({ success: true, data: existing, idempotent: true });
      return;
    }

    const order = await Order.create({
      requestId,
      store: new mongoose.Types.ObjectId(storeId as string),
      merchant: new mongoose.Types.ObjectId(req.merchantId as string),
      items,
      customerPhone,
      paymentMethod,
      subtotal,
      tax,
      total,
      discount,
      status: 'completed',
      source: 'pos',
      completedAt: new Date(),
    });
    res.status(201).json({ success: true, data: order });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/products', async (req: Request, res: Response) => {
  try {
    const { storeId, search } = req.query;
    if (!storeId) { res.status(400).json({ success: false, message: 'storeId required' }); return; }
    if (!await requireOwnedStore(req, res, storeId as string)) return;
    const query: unknown = { store: new mongoose.Types.ObjectId(storeId as string), isActive: true };
    if (search) query.name = { $regex: (search as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const products = await Product.find(query).select('name price images category stock').lean();
    res.json({ success: true, data: products });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/recent-orders', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    if (!storeId) { res.status(400).json({ success: false, message: 'storeId required' }); return; }
    if (!await requireOwnedStore(req, res, storeId as string)) return;
    const orders = await Order.find({ store: new mongoose.Types.ObjectId(storeId as string), source: 'pos' }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ success: true, data: orders });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
