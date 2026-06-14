import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../../models/Order';
import { Product } from '../../models/Product';
import { Store } from '../../models/Store';
import { merchantAuth } from '../../middleware/auth';

const router = Router();
router.use(merchantAuth);

async function getMerchantStoreIds(merchantId: string): Promise<mongoose.Types.ObjectId[]> {
  const stores = await Store.find({ merchantId: merchantId }, '_id').lean();
  return stores.map((s) => s._id);
}

function getDateRange(period: string): Date {
  const now = new Date();
  if (period === 'week') return new Date(now.getTime() - 7 * 86400000);
  if (period === 'year') return new Date(now.getFullYear(), 0, 1);
  if (period === 'quarter') return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  return new Date(now.getFullYear(), now.getMonth(), 1); // month default
}

// GET /analytics/products/performance
router.get('/products/performance', async (req: Request, res: Response) => {
  try {
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    const since = getDateRange((req.query.period as string) || 'month');

    const performance = await Order.aggregate([
      { $match: { store: { $in: storeIds }, createdAt: { $gte: since } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, totalQty: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.subtotal' }, orderCount: { $sum: 1 } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: 50 },
    ]);
    res.json({ success: true, data: performance });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /analytics/products/top-selling
router.get('/products/top-selling', async (req: Request, res: Response) => {
  try {
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    const since = getDateRange((req.query.period as string) || 'month');
    const limit = Math.min(50, parseInt(req.query.limit as string) || 10);

    const topProducts = await Order.aggregate([
      { $match: { store: { $in: storeIds }, createdAt: { $gte: since } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, imageUrl: { $first: '$items.image' }, totalQuantity: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.subtotal' }, orderCount: { $sum: 1 } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
    ]);

    res.json({ success: true, data: topProducts.map((p) => ({ productId: p._id, name: p.name, imageUrl: p.imageUrl, totalQuantity: p.totalQuantity || 0, totalRevenue: p.totalRevenue || 0, orderCount: p.orderCount || 0 })) });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /analytics/inventory/stockout-prediction
router.get('/inventory/stockout-prediction', async (req: Request, res: Response) => {
  try {
    const riskProducts = await Product.find({
      merchant: req.merchantId,
      isActive: true,
      'inventory.unlimited': { $ne: true },
      $expr: { $lte: ['$inventory.stock', { $ifNull: ['$inventory.lowStockThreshold', 10] }] },
    }).select('name sku inventory.stock inventory.lowStockThreshold').limit(50).lean();

    res.json({
      success: true,
      data: {
        highRisk: riskProducts.filter((p) => (p.inventory?.stock || 0) <= 0).map((p) => ({
          productId: p._id, name: p.name, sku: p.sku, currentStock: p.inventory?.stock || 0,
          threshold: p.inventory?.lowStockThreshold || 10, daysUntilStockout: 0,
        })),
        mediumRisk: riskProducts.filter((p) => (p.inventory?.stock || 0) > 0).map((p) => ({
          productId: p._id, name: p.name, sku: p.sku, currentStock: p.inventory?.stock || 0,
          threshold: p.inventory?.lowStockThreshold || 10, daysUntilStockout: 7,
        })),
        summary: { totalAtRisk: riskProducts.length },
      },
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
