import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../../models/Product';
import { cacheDel } from '../../config/redis';

// GET /products/:id/variants
export function registerVariantRoutes(router: Router) {
  router.get('/:id/variants', async (req: Request, res: Response) => {
    try {
      const product = await Product.findOne({ _id: req.params.id, merchant: req.merchantId, isDeleted: false }, 'inventory.variants').lean();
      if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
      res.json({ success: true, data: product.inventory?.variants || [] });
    } catch (err) {
      const requestId = (req as unknown).res?.locals?.requestId;
      const msg = process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
      res.status(500).json({ success: false, message: msg });
    }
  });

  // POST /products/:id/variants
  router.post('/:id/variants', async (req: Request, res: Response) => {
    try {
      const { pickVariantFields } = await import('./crud');
      const product = await Product.findOneAndUpdate(
        { _id: req.params.id, merchant: req.merchantId },
        { $push: { 'inventory.variants': pickVariantFields(req.body) } },
        { new: true },
      );
      if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
      await cacheDel(`products:${req.merchantId}:*`);
      res.json({ success: true, data: product.inventory?.variants });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // GET /products/:id/variants/:variantId
  router.get('/:id/variants/:variantId', async (req: Request, res: Response) => {
    try {
      const product = await Product.findOne({ _id: req.params.id, merchant: req.merchantId, isDeleted: false }, 'inventory.variants').lean();
      if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
      const variant = (product.inventory?.variants || []).find((v) => String(v._id) === req.params.variantId);
      if (!variant) { res.status(404).json({ success: false, message: 'Variant not found' }); return; }
      res.json({ success: true, data: variant });
    } catch (err) {
      const requestId = (req as unknown).res?.locals?.requestId;
      const msg = process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
      res.status(500).json({ success: false, message: msg });
    }
  });

  // PUT /products/:id/variants/:variantId
  router.put('/:id/variants/:variantId', async (req: Request, res: Response) => {
    try {
      const { pickVariantFields } = await import('./crud');
      const updates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(pickVariantFields(req.body))) {
        updates[`inventory.variants.$.${key}`] = value;
      }
      const product = await Product.findOneAndUpdate(
        { _id: req.params.id, merchant: req.merchantId, 'inventory.variants._id': req.params.variantId },
        { $set: updates },
        { new: true },
      );
      if (!product) { res.status(404).json({ success: false, message: 'Product or variant not found' }); return; }
      await cacheDel(`products:${req.merchantId}:*`);
      const variant = (product.inventory?.variants || []).find((v) => String(v._id) === req.params.variantId);
      res.json({ success: true, data: variant });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // DELETE /products/:id/variants/:variantId
  router.delete('/:id/variants/:variantId', async (req: Request, res: Response) => {
    try {
      const product = await Product.findOneAndUpdate(
        { _id: req.params.id, merchant: req.merchantId },
        { $pull: { 'inventory.variants': { _id: req.params.variantId } } },
        { new: true },
      );
      if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
      await cacheDel(`products:${req.merchantId}:*`);
      res.json({ success: true, message: 'Variant deleted', data: product.inventory?.variants || [] });
    } catch (err) {
      const requestId = (req as unknown).res?.locals?.requestId;
      const msg = process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
      res.status(500).json({ success: false, message: msg });
    }
  });

  // POST /products/:id/variants/generate — generate variant combinations
  router.post('/:id/variants/generate', async (req: Request, res: Response) => {
    try {
      const { options } = req.body;
      if (!options || !Array.isArray(options) || options.length === 0) {
        res.status(400).json({ success: false, message: 'options array required (e.g. [{name:"Size",values:["S","M","L"]}])' });
        return;
      }
      // Generate cartesian product of all option values
      const combinations: Record<string, unknown>[] = options.reduce(
        (acc: Record<string, string>[], option: { name: string; values: string[] }) => {
          if (!acc.length) return option.values.map(v => ({ [option.name]: v }));
          return acc.flatMap(combo => option.values.map(v => ({ ...combo, [option.name]: v })));
        },
        [] as Record<string, string>[],
      );

      const variants = combinations.map(attrs => ({
        name: Object.values(attrs).join(' / '),
        attributes: attrs,
        price: 0,
        stock: 0,
        isAvailable: true,
      }));

      const product = await Product.findOneAndUpdate(
        { _id: req.params.id, merchant: req.merchantId },
        { $push: { 'inventory.variants': { $each: variants } } },
        { new: true },
      );
      if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
      await cacheDel(`products:${req.merchantId}:*`);
      res.json({ success: true, data: { generated: variants.length, variants: product.inventory?.variants || [] } });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });
}

// PATCH /products/:id/toggle-featured
export function registerToggleFeaturedRoute(router: Router) {
  router.patch('/:id/toggle-featured', async (req: Request, res: Response) => {
    try {
      const product = await Product.findOne({ _id: req.params.id, merchant: req.merchantId, isDeleted: false });
      if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
      product.isFeatured = !product.isFeatured;
      await product.save();
      await cacheDel(`products:${req.merchantId}:*`);
      res.json({ success: true, data: { isFeatured: product.isFeatured } });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });
}

// PATCH /products/:id/inventory
export function registerInventoryRoute(router: Router) {
  router.patch('/:id/inventory', async (req: Request, res: Response) => {
    try {
      const { inventory } = req.body;
      if (!inventory || typeof inventory !== 'object') {
        res.status(400).json({ success: false, message: 'inventory object required' }); return;
      }
      const allowed: Record<string, unknown> = {};
      for (const key of Object.keys(inventory)) {
        allowed[`inventory.${key}`] = inventory[key];
      }
      const product = await Product.findOneAndUpdate(
        { _id: req.params.id, merchant: req.merchantId },
        { $set: allowed },
        { new: true },
      );
      if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
      await cacheDel(`products:${req.merchantId}:*`);
      res.json({ success: true, data: product });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });
}

// POST /products/:id/86 — mark item as 86'd (out of stock)
export function register86Routes(router: Router) {
  router.post('/:id/86', async (req: Request, res: Response) => {
    try {
      const product = await Product.findOneAndUpdate(
        { _id: req.params.id, merchant: req.merchantId },
        { $set: { 'inventory.isAvailable': false, 'inventory.stock': 0 } },
        { new: true },
      );
      if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
      await cacheDel(`products:${req.merchantId}:*`);
      res.json({ success: true, data: product });
    } catch (err) {
      const requestId = (req as unknown).res?.locals?.requestId;
      const msg = process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
      res.status(500).json({ success: false, message: msg });
    }
  });

  // DELETE /products/:id/86 — un-86 (back in stock)
  router.delete('/:id/86', async (req: Request, res: Response) => {
    try {
      const product = await Product.findOneAndUpdate(
        { _id: req.params.id, merchant: req.merchantId },
        { $set: { 'inventory.isAvailable': true } },
        { new: true },
      );
      if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return; }
      await cacheDel(`products:${req.merchantId}:*`);
      res.json({ success: true, data: product });
    } catch (err) {
      const requestId = (req as unknown).res?.locals?.requestId;
      const msg = process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
      res.status(500).json({ success: false, message: msg });
    }
  });
}
