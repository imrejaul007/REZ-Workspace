import { Router, Request, Response } from 'express';
import { Order } from '../models/Order';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

router.get('/gstr1', async (req: Request, res: Response) => {
  try {
    const { storeId, month } = req.query;
    if (!storeId || !month) { res.status(400).json({ success: false, message: 'storeId and month required' }); return; }
    const store = await Store.findOne({ _id: storeId, merchantId: req.merchantId });
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    const [year, m] = (month as string).split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 1);
    const data = await Order.aggregate([
      { $match: { store: new mongoose.Types.ObjectId(storeId as string), createdAt: { $gte: start, $lt: end }, status: { $in: ['delivered', 'returned', 'refunded'] } } },
      { $group: { _id: null, totalSales: { $sum: '$totals.total' }, totalTax: { $sum: { $ifNull: ['$totals.tax', 0] } }, count: { $sum: 1 } } },
    ]);
    res.json({ success: true, data: { period: month, ...(data[0] || { totalSales: 0, totalTax: 0, count: 0 }) } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/gstr3b', async (req: Request, res: Response) => {
  try {
    const { storeId, month } = req.query;
    if (!storeId || !month) { res.status(400).json({ success: false, message: 'storeId and month required' }); return; }
    const store = await Store.findOne({ _id: storeId, merchantId: req.merchantId });
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    const [year, m] = (month as string).split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 1);
    const data = await Order.aggregate([
      { $match: { store: new mongoose.Types.ObjectId(storeId as string), createdAt: { $gte: start, $lt: end }, status: { $in: ['delivered', 'returned', 'refunded'] } } },
      // NOTE: cgst/sgst/igst are not separate fields in the Order schema — tax is stored as totals.tax (combined).
      { $group: { _id: null, taxableValue: { $sum: '$totals.subtotal' }, totalTax: { $sum: { $ifNull: ['$totals.tax', 0] } } } },
    ]);
    res.json({ success: true, data: { period: month, ...(data[0] || { taxableValue: 0, totalTax: 0 }) } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
