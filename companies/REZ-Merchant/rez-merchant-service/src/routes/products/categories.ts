import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { cacheGet, cacheSet } from '../../config/redis';

// GET /products/categories — distinct categories for this merchant
export function registerCategoryRoutes(router: Router) {
  router.get('/categories', async (req: Request, res: Response) => {
    try {
      const storeId = req.query.storeId as string;
      const filter: unknown = { merchant: new mongoose.Types.ObjectId(req.merchantId!), isDeleted: false };
      if (storeId) filter.store = new mongoose.Types.ObjectId(storeId);

      const cacheKey = `prodcats:${req.merchantId}:${storeId || 'all'}`;
      const cached = await cacheGet<unknown>(cacheKey);
      if (cached) { res.json(cached); return; }

      const categories = await (await import('../../models/Product'))
        .Product.distinct('category', filter);
      const result = { success: true, data: categories };
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
}
