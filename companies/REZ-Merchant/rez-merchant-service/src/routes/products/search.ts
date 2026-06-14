import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../../models/Product';
import { cacheDel } from '../../config/redis';
import { captureIntent } from '../../utils/intentCapture';

// GET /products/search — keyword search across name, sku, category
export function registerSearchRoutes(router: Router) {
  router.get('/search', async (req: Request, res: Response) => {
    try {
      const { q, storeId, limit = 20 } = req.query;
      if (!q || typeof q !== 'string') {
        res.status(400).json({ success: false, message: 'q (query) parameter is required' }); return;
      }
      // Escape regex metacharacters to prevent ReDoS from malicious search strings
      const safeSearch = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const filter: unknown = {
        merchant: req.merchantId,
        isDeleted: false,
        isActive: true,
        $or: [
          { name: { $regex: safeSearch, $options: 'i' } },
          { sku: { $regex: safeSearch, $options: 'i' } },
          { category: { $regex: safeSearch, $options: 'i' } },
          { tags: { $regex: safeSearch, $options: 'i' } },
        ],
      };
      if (storeId) filter.store = storeId;

      const products = await Product.find(filter)
        .select('name sku category images pricing isActive inventory.stock')
        .limit(Number(limit))
        .lean();

      // Capture search intent for REZ Mind
      captureIntent({
        userId: req.merchantId as string,
        appType: 'merchant',
        eventType: 'search',
        intentKey: `product_search_${q}_${Date.now()}`,
        category: 'MERCHANT_ANALYTICS',
        metadata: { query: q, resultsCount: products.length, storeId },
      }).catch(() => {});

      res.json({ success: true, data: products });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
}

// GET /products/:id/feedback
export function registerFeedbackRoute(router: Router) {
  router.get('/:id/feedback', async (req: Request, res: Response) => {
    try {
      // Placeholder: returns empty feedback structure until a Feedback model exists
      const product = await Product.findOne({ _id: req.params.id, merchant: req.merchantId, isDeleted: false }).lean();
      if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
      res.json({ success: true, data: { productId: req.params.id, ratings: [], summary: { average: 0, count: 0 } } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
}

// GET /products/import-template
export function registerImportTemplateRoute(router: Router) {
  router.get('/import-template', (_req: Request, res: Response) => {
    const template = [
      { name: 'Sample Product 1', price: 100, category: 'Beverages', description: 'A refreshing drink', sku: 'BEV-001' },
      { name: 'Sample Product 2', price: 250, category: 'Food', description: 'Delicious meal', sku: 'FOOD-001' },
    ];
    res.json({ success: true, data: { template, headers: ['name', 'price', 'category', 'description', 'sku'] } });
  });
}

// GET /products/export — export all products as CSV/JSON
export function registerExportRoute(router: Router) {
  router.get('/export', async (req: Request, res: Response) => {
    try {
      const { storeId, format = 'json' } = req.query;
      const filter: unknown = { merchant: req.merchantId, isDeleted: false };
      if (storeId) filter.store = storeId;

      const products = await Product.find(filter).lean();

      if (format === 'csv') {
        // Basic CSV generation
        const headers = ['name', 'sku', 'category', 'price', 'stock', 'isActive'];
        const rows = products.map((p) => [
          `"${(p.name || '').replace(/"/g, '""')}"`,
          `"${(p.sku || '').replace(/"/g, '""')}"`,
          `"${(p.category || '').replace(/"/g, '""')}"`,
          p.pricing?.selling ?? '',
          p.inventory?.stock ?? '',
          p.isActive ?? '',
        ].join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
        res.send(csv);
        return;
      }

      res.json({ success: true, data: products });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
}

// POST /products/import — import products from JSON body (alias for bulk-import)
export function registerImportRoute(router: Router) {
  router.post('/import', async (req: Request, res: Response) => {
    const { assertStoreOwnership } = await import('./crud');

    try {
      const { products, storeId } = req.body as {
        products?: Array<{ name: string; price: number; category?: string; description?: string; sku?: string }>;
        storeId?: string;
      };

      if (!Array.isArray(products) || products.length === 0) {
        res.status(400).json({ success: false, message: 'products array is required and must not be empty' });
        return;
      }

      let ownedStoreObjectId: mongoose.Types.ObjectId | null = null;
      if (storeId) {
        const owned = await assertStoreOwnership(storeId, req.merchantId);
        if (!owned) {
          res.status(403).json({ success: false, message: 'You do not own the supplied storeId' });
          return;
        }
        ownedStoreObjectId = owned._id;
      }

      const docs: unknown[] = [];
      for (const p of products) {
        if (!p.name || typeof p.name !== 'string' || p.name.trim() === '') continue;
        if (typeof p.price !== 'number' || p.price <= 0) continue;
        const doc: unknown = {
          name: p.name.trim(),
          merchant: req.merchantId,
          pricing: { original: p.price, selling: p.price, currency: 'INR' },
          inventory: { stock: 0, isAvailable: true, unlimited: false },
          isActive: true,
        };
        if (p.category) doc.category = p.category.trim();
        if (p.description) doc.description = p.description.trim();
        if (p.sku) doc.sku = p.sku.trim();
        if (ownedStoreObjectId) doc.store = ownedStoreObjectId;
        docs.push(doc);
      }

      let imported = 0;
      if (docs.length > 0) {
        try {
          const result = await Product.insertMany(docs, { ordered: false });
          imported = result.length;
        } catch (_err) {
          // silently fail partial inserts
        }
      }

      await cacheDel(`products:${req.merchantId}:*`);
      res.status(imported > 0 ? 201 : 400).json({
        success: imported > 0,
        data: { imported, failed: products.length - imported },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
}

// POST /products/bulk-import — import products from parsed JSON array
export function registerBulkImportRoute(router: Router) {
  router.post('/bulk-import', async (req: Request, res: Response) => {
    try {
      const { products, storeId } = req.body as {
        products?: Array<{ name: string; price: number; category?: string; description?: string; sku?: string }>;
        storeId?: string;
      };

      if (!Array.isArray(products) || products.length === 0) {
        res.status(400).json({ success: false, message: 'products array is required and must not be empty' });
        return;
      }

      // SECURITY: if a storeId is supplied, verify the merchant owns it before
      // writing any product into it. Without this, bulk-import could create
      // products in another merchant's store.
      const { assertStoreOwnership } = await import('./crud');
      let ownedStoreObjectId: mongoose.Types.ObjectId | null = null;
      if (storeId) {
        const owned = await assertStoreOwnership(storeId, req.merchantId);
        if (!owned) {
          res.status(403).json({ success: false, message: 'You do not own the supplied storeId' });
          return;
        }
        ownedStoreObjectId = owned._id;
      }

      const docs: unknown[] = [];
      const errors: Array<{ index: number; name: string; reason: string }> = [];

      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        if (!p.name || typeof p.name !== 'string' || p.name.trim() === '') {
          errors.push({ index: i, name: p.name || '', reason: 'name is required' });
          continue;
        }
        if (typeof p.price !== 'number' || p.price <= 0) {
          errors.push({ index: i, name: p.name, reason: 'price must be a number greater than 0' });
          continue;
        }
        const doc: unknown = {
          name: p.name.trim(),
          merchant: req.merchantId,
          pricing: { original: p.price, selling: p.price, currency: 'INR' },
          inventory: { stock: 0, isAvailable: true, unlimited: false },
          isActive: true,
        };
        if (p.category) doc.category = p.category.trim();
        if (p.description) doc.description = p.description.trim();
        if (p.sku) doc.sku = p.sku.trim();
        if (ownedStoreObjectId) doc.store = ownedStoreObjectId;
        docs.push(doc);
      }

      let imported = 0;
      if (docs.length > 0) {
        try {
          const result = await Product.insertMany(docs, { ordered: false });
          imported = result.length;
        } catch (insertErr) {
          // insertMany with ordered:false may partially succeed
          const writeErrors: unknown[] = insertErr.writeErrors || insertErr.result?.writeErrors || [];
          imported = docs.length - writeErrors.length;
          for (const we of writeErrors) {
            const doc = docs[we.index];
            errors.push({ index: we.index, name: doc?.name || '', reason: we.errmsg || 'Insert failed' });
          }
        }
      }

      await cacheDel(`products:${req.merchantId}:*`);
      res.status(imported > 0 ? 201 : 400).json({
        success: imported > 0,
        data: { imported, failed: products.length - imported, errors },
      });
    } catch (err) {
      const requestId = (req as unknown).res?.locals?.requestId;
      const msg = process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
      res.status(500).json({ success: false, message: msg });
    }
  });
}
