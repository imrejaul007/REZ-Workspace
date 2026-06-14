import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../../models/Order';
import { Product } from '../../models/Product';
import { Store } from '../../models/Store';
import { merchantAuth } from '../../middleware/auth';
import { cacheGet, cacheSet } from '../../config/redis';

const AGG_OPTIONS = { maxTimeMS: 30000 };

const router = Router();
router.use(merchantAuth);

async function getMerchantStoreIds(merchantId: string): Promise<mongoose.Types.ObjectId[]> {
  const stores = await Store.find({ merchantId: merchantId }, '_id').lean();
  return stores.map((s) => s._id);
}

async function getScopedStoreIds(
  merchantId: string,
  storeId?: string
): Promise<mongoose.Types.ObjectId[]> {
  if (storeId && mongoose.Types.ObjectId.isValid(storeId)) {
    return [new mongoose.Types.ObjectId(storeId)];
  }
  return getMerchantStoreIds(merchantId);
}

// GET /dashboard/top-products
router.get('/top-products', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit as string) || 10);
    const period = (req.query.period as string) || 'month';
    const cacheKey = `dashboard:${req.merchantId}:topproducts:${period}`;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) { res.json(cached); return; }

    const storeIds = await getScopedStoreIds(req.merchantId!, req.query.storeId as string);
    const now = new Date();
    const since = period === 'week' ? new Date(now.getTime() - 7 * 86400000) : new Date(now.getFullYear(), now.getMonth(), 1);

    const topProducts = await Order.aggregate([
      { $match: { store: { $in: storeIds }, createdAt: { $gte: since } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, image: { $first: '$items.image' }, totalQuantity: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.subtotal' } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
    ], AGG_OPTIONS);

    const result = {
      success: true,
      data: topProducts.map((item) => ({
        productId: item._id,
        name: item.name || 'Unnamed item',
        sales: item.totalQuantity || 0,
        revenue: item.totalRevenue || 0,
        image: item.image || undefined,
      })),
    };
    await cacheSet(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /dashboard/low-stock
router.get('/low-stock', async (req: Request, res: Response) => {
  try {
    const products = await Product.find({
      merchant: req.merchantId,
      isActive: true,
      'inventory.unlimited': { $ne: true },
      $expr: { $lte: ['$inventory.stock', { $ifNull: ['$inventory.lowStockThreshold', 10] }] },
    }).select('name inventory.stock inventory.lowStockThreshold').limit(50).lean();
    res.json({
      success: true,
      data: products.map((product) => ({
        productId: product._id,
        name: product.name,
        currentStock: product.inventory?.stock || 0,
        threshold: product.inventory?.lowStockThreshold || 10,
      })),
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /dashboard/top-items-today
router.get('/top-items-today', async (req: Request, res: Response) => {
  try {
    const storeIds = await getScopedStoreIds(req.merchantId!, req.query.storeId as string);
    const limit = Math.min(10, parseInt(req.query.limit as string) || 10);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const items = await Order.aggregate([
      { $match: { store: { $in: storeIds }, createdAt: { $gte: today } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          imageUrl: { $first: '$items.image' },
          orderCount: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { orderCount: -1 } },
      { $limit: limit },
    ], AGG_OPTIONS);
    res.json({
      success: true,
      data: items.map((item) => ({
        productId: item._id,
        name: item.name || 'Unnamed item',
        orderCount: item.orderCount || 0,
        totalRevenue: item.totalRevenue || 0,
        imageUrl: item.imageUrl || undefined,
      })),
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
