import { Router } from 'express';
import { z } from 'zod';
import { bundlesService } from '../services/bundlesService.js';
import { BundleSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

const ProductPricesSchema = z.record(z.number());

router.post('/bundles', (req, res) => {
  try {
    const bundle = BundleSchema.parse(req.body);
    const created = bundlesService.createBundle(bundle);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else {
      logger.error('Failed to create bundle', { error });
      res.status(500).json({ success: false, error: 'Failed to create bundle' });
    }
  }
});

router.get('/bundles/:id', (req, res) => {
  const bundle = bundlesService.getBundle(req.params.id);
  bundle ? res.json({ success: true, data: bundle }) : res.status(404).json({ success: false, error: 'Bundle not found' });
});

router.get('/products/:productId/bundles', (req, res) => {
  const bundles = bundlesService.getProductBundles(req.params.productId);
  res.json({ success: true, data: bundles });
});

router.get('/bundles', (req, res) => {
  const { isActive, bundleType, tag } = req.query;
  const bundles = bundlesService.getAllBundles({
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    bundleType: bundleType as string | undefined,
    tag: tag as string | undefined
  });
  res.json({ success: true, data: bundles });
});

router.patch('/bundles/:id', (req, res) => {
  const bundle = bundlesService.updateBundle(req.params.id, req.body);
  bundle ? res.json({ success: true, data: bundle }) : res.status(404).json({ success: false, error: 'Bundle not found' });
});

router.delete('/bundles/:id', (req, res) => {
  const deleted = bundlesService.deleteBundle(req.params.id);
  res.json({ success: deleted });
});

router.post('/bundles/:id/calculate', (req, res) => {
  const { productPrices } = req.body;
  try {
    const prices = ProductPricesSchema.parse(productPrices);
    const pricesMap = new Map(Object.entries(prices));
    const result = bundlesService.calculateBundlePrice(req.params.id, pricesMap);
    result ? res.json({ success: true, data: result }) : res.status(404).json({ success: false, error: 'Bundle not found' });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else res.status(500).json({ success: false, error: 'Failed to calculate bundle price' });
  }
});

router.post('/bundles/:id/validate', (req, res) => {
  const { selectedItems } = req.body;
  const result = bundlesService.validateBundleItems(req.params.id, selectedItems);
  res.json({ success: true, data: result });
});

router.get('/recommendations', (req, res) => {
  const { customerId, productId, cartItems } = req.query;
  const cart = cartItems ? (cartItems as string).split(',') : [];
  const recommendations = bundlesService.getRecommendations(customerId as string, productId as string, cart);
  res.json({ success: true, data: recommendations });
});

router.get('/bundles/:id/stats', (req, res) => {
  const stats = bundlesService.getStats(req.params.id);
  stats ? res.json({ success: true, data: stats }) : res.status(404).json({ success: false, error: 'Bundle not found' });
});

export default router;
