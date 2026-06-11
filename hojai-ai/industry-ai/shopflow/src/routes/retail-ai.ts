/**
 * Retail AI Routes - ShopFlow AI Agents
 * Exposes all 8 AI agents via REST API
 */

import { Router, Request, Response } from 'express';
import {
  pricingAgent,
  catalogAgent,
  discoveryAgent,
  merchandisingAgent,
  supplierAgent,
  storeAgent,
  retailMediaAgent,
  marketplaceAgent,
} from '../services';

const router = Router();

// ============================================
// PRICING AGENT ROUTES
// ============================================

router.post('/ai/pricing/recommend', async (req: Request, res: Response) => {
  try {
    const { productId, context } = req.body;
    const recommendation = await pricingAgent.getRecommendation(productId, context);
    res.json({ success: true, data: recommendation });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/pricing/scenarios', async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    const scenarios = await pricingAgent.getScenarios(productId);
    res.json({ success: true, data: scenarios });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/pricing/bundle', async (req: Request, res: Response) => {
  try {
    const { productIds, discountPercent } = req.body;
    const bundle = await pricingAgent.optimizeBundle(productIds, discountPercent);
    res.json({ success: true, data: bundle });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/pricing/markdown', async (req: Request, res: Response) => {
  try {
    const { productId, daysOld } = req.body;
    const markdown = await pricingAgent.getMarkdownPrice(productId, daysOld);
    res.json({ success: true, data: markdown });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CATALOG AGENT ROUTES
// ============================================

router.post('/ai/catalog/enrich', async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    const enrichment = await catalogAgent.enrichProduct(productId);
    res.json({ success: true, data: enrichment });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/catalog/enrich-batch', async (req: Request, res: Response) => {
  try {
    const { productIds } = req.body;
    const results = await catalogAgent.enrichBatch(productIds);
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/catalog/classify', async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    const classification = await catalogAgent.classifyProduct(productId);
    res.json({ success: true, data: classification });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/catalog/compare', async (req: Request, res: Response) => {
  try {
    const { productIds } = req.body;
    const comparison = await catalogAgent.compareProducts(productIds);
    res.json({ success: true, data: comparison });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/catalog/similar', async (req: Request, res: Response) => {
  try {
    const { productId, limit } = req.body;
    const similar = await catalogAgent.findSimilarProducts(productId, limit || 5);
    res.json({ success: true, data: similar });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/catalog/seo', async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    const seo = await catalogAgent.generateSEOContent(productId);
    res.json({ success: true, data: seo });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// DISCOVERY AGENT ROUTES
// ============================================

router.post('/ai/discovery/search', async (req: Request, res: Response) => {
  try {
    const { query, filters, limit } = req.body;
    const results = await discoveryAgent.search(query, { filters, limit });
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/discovery/recommend', async (req: Request, res: Response) => {
  try {
    const { userId, limit } = req.body;
    const recommendations = await discoveryAgent.getPersonalizedRecommendations(userId, limit || 10);
    res.json({ success: true, data: recommendations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ai/discovery/trending', async (req: Request, res: Response) => {
  try {
    const { limit, category } = req.query;
    const trending = await discoveryAgent.getTrending(
      Number(limit) || 10,
      category as string | undefined
    );
    res.json({ success: true, data: trending });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/discovery/frequently-bought', async (req: Request, res: Response) => {
  try {
    const { productId, limit } = req.body;
    constFBT = await discoveryAgent.getFrequentlyBoughtTogether(productId, limit || 5);
    res.json({ success: true, data:FBT });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ai/discovery/homepage', async (req: Request, res: Response) => {
  try {
    const { userId, limit } = req.query;
    const feed = await discoveryAgent.getHomepageFeed(
      userId as string | undefined,
      Number(limit) || 20
    );
    res.json({ success: true, data: feed });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// MERCHANDISING AGENT ROUTES
// ============================================

router.post('/ai/merchandising/plan', async (req: Request, res: Response) => {
  try {
    const { storeId, name, description, startDate, endDate, focus, targetCategories } = req.body;
    const plan = await merchandisingAgent.createPlan(storeId, {
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      focus,
      targetCategories,
    });
    res.json({ success: true, data: plan });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/merchandising/planogram', async (req: Request, res: Response) => {
  try {
    const { storeId, sectionId, layout, optimizeForSales } = req.body;
    const planogram = await merchandisingAgent.generatePlanogram(storeId, sectionId, { layout, optimizeForSales });
    res.json({ success: true, data: planogram });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/merchandising/display', async (req: Request, res: Response) => {
  try {
    const { storeId, type, position, dimensions } = req.body;
    const display = await merchandisingAgent.createDisplay(storeId, type, position, dimensions);
    res.json({ success: true, data: display });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/merchandising/cross-sell', async (req: Request, res: Response) => {
  try {
    const { triggerProductId, triggerCategory, recommendedProducts } = req.body;
    const rule = await merchandisingAgent.createCrossSellRule(triggerProductId, triggerCategory, recommendedProducts);
    res.json({ success: true, data: rule });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SUPPLIER AGENT ROUTES
// ============================================

router.post('/ai/supplier/create', async (req: Request, res: Response) => {
  try {
    const supplier = await supplierAgent.createSupplier(req.body);
    res.json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ai/supplier/:supplierId', async (req: Request, res: Response) => {
  try {
    const supplier = await supplierAgent.getSupplier(req.params.supplierId);
    res.json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ai/supplier/:supplierId/performance', async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    const performance = await supplierAgent.evaluatePerformance(
      req.params.supplierId,
      start ? { start: new Date(start as string), end: new Date(end as string) } : undefined
    );
    res.json({ success: true, data: performance });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/supplier/purchase-order', async (req: Request, res: Response) => {
  try {
    const { supplierId, items } = req.body;
    const order = await supplierAgent.createPurchaseOrder(supplierId, items);
    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/supplier/forecast', async (req: Request, res: Response) => {
  try {
    const { productIds } = req.body;
    const forecasts = await supplierAgent.forecastSupply(productIds);
    res.json({ success: true, data: forecasts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// STORE AGENT ROUTES
// ============================================

router.post('/ai/store/create', async (req: Request, res: Response) => {
  try {
    const store = await storeAgent.createStore(req.body);
    res.json({ success: true, data: store });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ai/store/:storeId/metrics', async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    const metrics = await storeAgent.getStoreMetrics(
      req.params.storeId,
      start ? { start: new Date(start as string), end: new Date(end as string) } : undefined
    );
    res.json({ success: true, data: metrics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/store/staff', async (req: Request, res: Response) => {
  try {
    const { storeId, ...staffData } = req.body;
    const staff = await storeAgent.createStaff(storeId, staffData);
    res.json({ success: true, data: staff });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/store/schedule', async (req: Request, res: Response) => {
  try {
    const { staffId, date, startTime, endTime, role, department } = req.body;
    const shift = await storeAgent.scheduleShift(staffId, new Date(date), startTime, endTime, role, department);
    res.json({ success: true, data: shift });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/store/schedule/generate', async (req: Request, res: Response) => {
  try {
    const { storeId, weekStart, constraints } = req.body;
    const plan = await storeAgent.generateSchedule(storeId, new Date(weekStart), constraints);
    res.json({ success: true, data: plan });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ai/store/:storeId/alerts', async (req: Request, res: Response) => {
  try {
    const { severity } = req.query;
    const alerts = await storeAgent.getAlerts(req.params.storeId, severity as any);
    res.json({ success: true, data: alerts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// RETAIL MEDIA AGENT ROUTES
// ============================================

router.post('/ai/media/network', async (req: Request, res: Response) => {
  try {
    const { name, storeIds } = req.body;
    const network = await retailMediaAgent.createNetwork(name, storeIds);
    res.json({ success: true, data: network });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/media/campaign', async (req: Request, res: Response) => {
  try {
    const { advertiserId, ...campaignData } = req.body;
    const campaign = await retailMediaAgent.createCampaign(advertiserId, campaignData);
    res.json({ success: true, data: campaign });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/media/campaign/:campaignId/activate', async (req: Request, res: Response) => {
  try {
    const campaign = await retailMediaAgent.activateCampaign(req.params.campaignId);
    res.json({ success: true, data: campaign });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ai/media/inventory', async (req: Request, res: Response) => {
  try {
    const { storeIds, start, end } = req.query;
    const inventory = await retailMediaAgent.getInventory(
      JSON.parse(storeIds as string),
      { start: new Date(start as string), end: new Date(end as string) }
    );
    res.json({ success: true, data: inventory });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ai/media/campaign/:campaignId/performance', async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    const performance = await retailMediaAgent.getPerformance(
      req.params.campaignId,
      start ? { start: new Date(start as string), end: new Date(end as string) } : undefined
    );
    res.json({ success: true, data: performance });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ai/media/insights', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const insights = await retailMediaAgent.getInsights(category as string);
    res.json({ success: true, data: insights });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// MARKETPLACE AGENT ROUTES
// ============================================

router.post('/ai/marketplace/create', async (req: Request, res: Response) => {
  try {
    const marketplace = await marketplaceAgent.createMarketplace(req.body);
    res.json({ success: true, data: marketplace });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/marketplace/seller/onboard', async (req: Request, res: Response) => {
  try {
    const { marketplaceId, ...sellerData } = req.body;
    const seller = await marketplaceAgent.onboardSeller(marketplaceId, sellerData);
    res.json({ success: true, data: seller });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/marketplace/product', async (req: Request, res: Response) => {
  try {
    const { marketplaceId, sellerId, ...productData } = req.body;
    const product = await marketplaceAgent.listProduct(marketplaceId, sellerId, productData);
    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/marketplace/order', async (req: Request, res: Response) => {
  try {
    const { marketplaceId, ...orderData } = req.body;
    const order = await marketplaceAgent.createOrder(marketplaceId, orderData);
    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/marketplace/dispute', async (req: Request, res: Response) => {
  try {
    const { orderId, type, reason, amount } = req.body;
    const dispute = await marketplaceAgent.openDispute(orderId, type, reason, amount);
    res.json({ success: true, data: dispute });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ai/marketplace/:marketplaceId/insights', async (req: Request, res: Response) => {
  try {
    const insights = await marketplaceAgent.getMarketplaceInsights(req.params.marketplaceId);
    res.json({ success: true, data: insights });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;