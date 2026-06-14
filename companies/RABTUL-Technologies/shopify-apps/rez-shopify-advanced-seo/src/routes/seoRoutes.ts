import { Router } from 'express';
import { z } from 'zod';
import { seoService } from '../services/seoService.js';
import { SEOMetaSchema, SitemapConfigSchema, RedirectRuleSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/meta', (req, res) => {
  try {
    const meta = SEOMetaSchema.parse(req.body);
    const saved = seoService.createOrUpdateMeta(meta.shopifyProductId || meta.shopifyCollectionId || meta.shopifyPageId || '', meta);
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else {
      logger.error('Failed to save meta', { error });
      res.status(500).json({ success: false, error: 'Failed to save meta' });
    }
  }
});

router.get('/meta/product/:productId', (req, res) => {
  const meta = seoService.getProductMeta(req.params.productId);
  meta ? res.json({ success: true, data: meta }) : res.status(404).json({ success: false, error: 'Meta not found' });
});

router.post('/analyze/:productId', (req, res) => {
  const { title, description, url, images } = req.body;
  const score = seoService.analyzeSEO(req.params.productId, { title, description, url, images });
  res.json({ success: true, data: score });
});

router.post('/sitemaps', (req, res) => {
  try {
    const config = SitemapConfigSchema.parse(req.body);
    const sitemap = seoService.createSitemap(config);
    res.status(201).json({ success: true, data: sitemap });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else res.status(500).json({ success: false, error: 'Failed to create sitemap' });
  }
});

router.get('/sitemaps/:shopId', (req, res) => {
  const sitemap = seoService.getSitemap(req.params.shopId);
  sitemap ? res.json({ success: true, data: sitemap }) : res.status(404).json({ success: false, error: 'Sitemap not found' });
});

router.get('/sitemaps/:shopId/generate', (req, res) => {
  const xml = seoService.generateSitemap(req.params.shopId);
  res.type('application/xml').send(xml);
});

router.post('/redirects', (req, res) => {
  try {
    const rule = RedirectRuleSchema.parse(req.body);
    const redirect = seoService.createRedirect(rule);
    res.status(201).json({ success: true, data: redirect });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else res.status(500).json({ success: false, error: 'Failed to create redirect' });
  }
});

router.post('/redirects/bulk', (req, res) => {
  const { shopId, rules } = req.body;
  const redirects = seoService.bulkCreateRedirects(shopId, rules);
  res.status(201).json({ success: true, data: redirects });
});

router.get('/redirects/:shopId', (req, res) => {
  const redirects = seoService.getAllRedirects(req.params.shopId);
  res.json({ success: true, data: redirects });
});

router.get('/redirects/resolve/:path', (req, res) => {
  const redirect = seoService.getRedirect(req.params.path);
  redirect ? res.json({ success: true, data: redirect }) : res.status(404).json({ success: false, error: 'No redirect found' });
});

router.delete('/redirects/:id', (req, res) => {
  const deleted = seoService.deleteRedirect(req.params.id);
  res.json({ success: deleted });
});

export default router;
