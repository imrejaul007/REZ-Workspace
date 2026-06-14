import { Router, Request, Response } from 'express';
import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

router.post('/', async (req: Request, res: Response) => {
  try {
    const { storeId, products } = req.body;
    if (!storeId || !Array.isArray(products) || !products.length) { res.status(400).json({ success: false, message: 'storeId and products array required' }); return; }
    if (products.length > 200) { res.status(400).json({ success: false, message: 'Maximum 200 products per import' }); return; }
    const store = await Store.findOne({ _id: storeId, merchantId: req.merchantId });
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    const PRODUCT_ALLOWED_FIELDS = ['name', 'description', 'price', 'comparePrice', 'sku', 'barcode', 'category', 'subcategory', 'tags', 'images', 'inventory', 'variants', 'attributes', 'weight', 'dimensions', 'taxCategory', 'hsn'];

    // BE-MER-021 FIX: Deduplicate SKUs within the import batch and against existing products
    const skuSeen = new Set<string>();
    const duplicateSkus: string[] = [];
    for (const p of products) {
      if (p.sku) {
        const sku = String(p.sku).trim().toUpperCase();
        if (skuSeen.has(sku)) {
          duplicateSkus.push(sku);
        } else {
          skuSeen.add(sku);
        }
      }
    }
    if (duplicateSkus.length > 0) {
      res.status(400).json({ success: false, message: `Duplicate SKUs found within the import batch: ${[...new Set(duplicateSkus)].join(', ')}` });
      return;
    }

    // Also check for SKUs that already exist in this store
    if (skuSeen.size > 0) {
      const existingSkus = await Product.find(
        { merchant: new mongoose.Types.ObjectId(req.merchantId as string), sku: { $in: [...skuSeen] } },
        'sku',
      ).lean();
      if (existingSkus.length > 0) {
        const existingSkuList = existingSkus.map((p) => p.sku).join(', ');
        res.status(400).json({ success: false, message: `The following SKUs already exist in this store: ${existingSkuList}` });
        return;
      }
    }

    const docs = products.map((p) => {
      const safe: Record<string, unknown> = {};
      for (const f of PRODUCT_ALLOWED_FIELDS) { if (p[f] !== undefined) safe[f] = p[f]; }
      return { ...safe, store: new mongoose.Types.ObjectId(storeId as string), merchant: new mongoose.Types.ObjectId(req.merchantId as string), isActive: true };
    });
    const result = await Product.insertMany(docs, { ordered: true });
    res.status(201).json({ success: true, message: `${result.length} products imported`, data: { imported: result.length } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
