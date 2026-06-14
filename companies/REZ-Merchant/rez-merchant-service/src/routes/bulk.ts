import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

router.post('/price-update', async (req: Request, res: Response) => {
  try {
    const { storeId, updates } = req.body;
    if (!storeId || !Array.isArray(updates)) { res.status(400).json({ success: false, message: 'storeId and updates array required' }); return; }
    const store = await Store.findOne({ _id: storeId, merchantId: req.merchantId });
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    let updated = 0;
    for (const u of updates) {
      if (u.productId && u.price != null) {
        await Product.updateOne({ _id: u.productId, store: new mongoose.Types.ObjectId(storeId as string) }, { $set: { price: u.price } });
        updated++;
      }
    }
    res.json({ success: true, message: `${updated} products updated` });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/stock-update', async (req: Request, res: Response) => {
  try {
    const { storeId, updates } = req.body;
    if (!storeId || !Array.isArray(updates)) { res.status(400).json({ success: false, message: 'storeId and updates array required' }); return; }
    // MS-16: Verify storeId belongs to the requesting merchant before updating stock
    const ownedStore = await Store.findOne({ _id: storeId, merchantId: req.merchantId }).select('_id').lean();
    if (!ownedStore) { res.status(403).json({ success: false, message: 'Access denied: store not found or not yours' }); return; }
    let updated = 0;
    for (const u of updates) {
      if (u.productId && u.stock != null) {
        await Product.updateOne({ _id: u.productId, store: new mongoose.Types.ObjectId(storeId as string) }, { $set: { stock: u.stock } });
        updated++;
      }
    }
    res.json({ success: true, message: `${updated} products updated` });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/toggle-status', async (req: Request, res: Response) => {
  try {
    const { storeId, productIds, isActive } = req.body;
    if (!storeId || !Array.isArray(productIds)) { res.status(400).json({ success: false, message: 'storeId and productIds required' }); return; }
    const result = await Product.updateMany({ _id: { $in: productIds }, store: new mongoose.Types.ObjectId(storeId as string) }, { $set: { isActive: !!isActive } });
    res.json({ success: true, message: `${result.modifiedCount} products toggled` });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
