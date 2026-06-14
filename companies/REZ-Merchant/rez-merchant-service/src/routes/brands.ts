
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { MerchantBrand, IMerchantBrand } from '../models/Brand';
import { Store } from '../models/Store';
import { StorePayment } from '../models/StorePayment';
import { Product } from '../models/Product';
import { merchantAuth } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();
router.use(merchantAuth);

// ─── GET / — list merchant's brands ──────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const brands = await MerchantBrand.find({ merchantId: req.merchantId, isActive: true })
      .populate('stores', 'name logo location.city isActive')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: brands });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ─── POST / — create brand ───────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, logo, description, storeIds = [], settings = {} } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Brand name required' });
      return;
    }
    const brand = await MerchantBrand.create({
      merchantId: req.merchantId,
      name,
      logo,
      description,
      stores: (storeIds as string[]).filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id)),
      settings,
    });
    logger.info(`[BRAND] Created brand "${name}" for merchant ${req.merchantId}`);
    res.status(201).json({ success: true, data: brand, message: 'Brand created' });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ─── GET /:id — brand detail with populated stores ───────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const brand = await MerchantBrand.findOne({ _id: req.params.id, merchantId: req.merchantId })
      .populate('stores', 'name logo location isActive category')
      .lean();
    if (!brand) {
      res.status(404).json({ success: false, message: 'Brand not found' });
      return;
    }
    res.json({ success: true, data: brand });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ─── PATCH /:id — update brand (add/remove stores, update fields) ────────────
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const brand = await MerchantBrand.findOne({ _id: req.params.id, merchantId: req.merchantId });
    if (!brand) {
      res.status(404).json({ success: false, message: 'Brand not found' });
      return;
    }
    const { name, logo, description, settings, addStores = [], removeStores = [] } = req.body;
    if (name) brand.name = name;
    if (logo !== undefined) brand.logo = logo;
    if (description !== undefined) brand.description = description;
    if (settings) Object.assign(brand.settings, settings);

    for (const storeId of addStores) {
      if (!mongoose.Types.ObjectId.isValid(storeId)) continue;
      const oid = new mongoose.Types.ObjectId(storeId);
      if (!brand.stores.some((s: mongoose.Types.ObjectId) => s.equals(oid))) brand.stores.push(oid);
    }
    for (const storeId of removeStores) {
      if (!mongoose.Types.ObjectId.isValid(storeId)) continue;
      const oid = new mongoose.Types.ObjectId(storeId);
      brand.stores = brand.stores.filter((s: mongoose.Types.ObjectId) => !s.equals(oid)) as unknown;
    }
    await brand.save();
    res.json({ success: true, data: brand, message: 'Brand updated' });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await MerchantBrand.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
    if (!item) {
      res.status(404).json({ success: false, message: 'Not found' });
      return;
    }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ─── POST /:id/push-menu — copy products from source store to all others ─────
router.post('/:id/push-menu', async (req: Request, res: Response) => {
  try {
    const { sourceStoreId } = req.body;
    if (!sourceStoreId) {
      res.status(400).json({ success: false, message: 'sourceStoreId required' });
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(sourceStoreId)) {
      res.status(400).json({ success: false, message: 'Invalid sourceStoreId' });
      return;
    }
    const brand = await MerchantBrand.findOne({ _id: req.params.id, merchantId: req.merchantId }).lean<IMerchantBrand>();
    if (!brand) {
      res.status(404).json({ success: false, message: 'Brand not found' });
      return;
    }

    const targetStores = (brand.stores || []).map(String).filter((id: string) => id !== String(sourceStoreId));
    if (targetStores.length === 0) {
      res.status(400).json({ success: false, message: 'No target stores to push to' });
      return;
    }

    const sourceProducts = await Product.find({
      store: new mongoose.Types.ObjectId(sourceStoreId),
      isActive: true,
    }).lean();

    let pushed = 0;
    let skipped = 0;

    for (const targetStoreId of targetStores) {
      for (const product of sourceProducts) {
        const exists = await Product.findOne({
          store: new mongoose.Types.ObjectId(targetStoreId),
          name: product.name,
        }).lean();
        if (!exists) {
          const { _id, store, ...rest } = product as unknown;
          await Product.create({ ...rest, store: new mongoose.Types.ObjectId(targetStoreId) });
          pushed++;
        } else {
          skipped++;
        }
      }
    }

    logger.info(`[BRAND] Menu push: ${pushed} added, ${skipped} skipped across ${targetStores.length} outlets`);
    res.json({
      success: true,
      data: { pushed, skipped, outlets: targetStores.length },
      message: `Menu pushed to ${targetStores.length} outlet(s)`,
    });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ─── GET /:id/analytics — consolidated analytics across brand stores ─────────
router.get('/:id/analytics', async (req: Request, res: Response) => {
  try {
    const brand = await MerchantBrand.findOne({ _id: req.params.id, merchantId: req.merchantId })
      .select('stores name')
      .lean<IMerchantBrand>();
    if (!brand) {
      res.status(404).json({ success: false, message: 'Brand not found' });
      return;
    }

    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const storeIds = (brand.stores || []).map((id) => new mongoose.Types.ObjectId(String(id)));

    const revenueByStore = await StorePayment.aggregate([
      { $match: { storeId: { $in: storeIds }, status: 'completed', createdAt: { $gte: since } } },
      {
        $group: {
          _id: '$storeId',
          revenue: { $sum: '$billAmount' },
          transactions: { $sum: 1 },
          avgOrderValue: { $avg: '$billAmount' },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    const stores = await Store.find({ _id: { $in: storeIds } }).select('name location.city').lean();
    const storeNameMap: Record<string, string> = {};
    for (const s of stores) {
      const city = (s as unknown).location?.city;
      storeNameMap[String(s._id)] = `${s.name}${city ? ` (${city})` : ''}`;
    }

    const outlets = revenueByStore.map((r) => ({
      storeId: String(r._id),
      name: storeNameMap[String(r._id)] || 'Unknown',
      revenue: Math.round(r.revenue),
      transactions: r.transactions,
      avgOrderValue: Math.round(r.avgOrderValue),
    }));

    const totalRevenue = outlets.reduce((sum, o) => sum + o.revenue, 0);
    const totalTransactions = outlets.reduce((sum, o) => sum + o.transactions, 0);

    res.json({
      success: true,
      data: {
        brandName: brand.name,
        period: '30d',
        totalRevenue,
        totalTransactions,
        avgOrderValue: totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0,
        outlets,
        topOutlet: outlets[0] || null,
      },
    });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
