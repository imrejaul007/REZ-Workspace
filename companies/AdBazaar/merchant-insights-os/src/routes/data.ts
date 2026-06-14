import { Router, Request, Response } from 'express';
import { RevenueRecord, ProductPerformance, Customer, Competitor } from '../models/index.js';
import {
  validateCreateRevenueRecord,
  validateCreateProductPerformance,
  validateCreateCustomer,
  validateCreateCompetitor,
  validateMerchantId,
  asyncHandler,
} from '../middleware/index.js';
import logger from '../config/logger.js';

const router = Router();

// ============ REVENUE RECORDS ============

/**
 * POST /api/data/revenue
 * Create a revenue record
 */
router.post(
  '/revenue',
  validateCreateRevenueRecord,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { merchantId, date, revenue, orders, averageOrderValue, costs } = req.body;

    logger.info('Creating revenue record', { merchantId, date });

    const record = new RevenueRecord({
      merchantId,
      date: new Date(date),
      revenue,
      orders,
      averageOrderValue,
      costs,
    });

    await record.save();

    const duration = Date.now() - startTime;

    res.status(201).json({
      success: true,
      data: record,
      meta: { timestamp: new Date().toISOString(), duration },
    });
  })
);

/**
 * GET /api/data/revenue/:merchantId
 * Get revenue records for a merchant
 */
router.get(
  '/revenue/:merchantId',
  validateMerchantId,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { merchantId } = req.params;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    logger.info('Getting revenue records', { merchantId });

    const records = await RevenueRecord.find({
      merchantId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: records,
      meta: { timestamp: new Date().toISOString(), duration },
    });
  })
);

/**
 * POST /api/data/revenue/bulk
 * Bulk create revenue records
 */
router.post(
  '/revenue/bulk',
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const records = req.body.records;

    if (!Array.isArray(records)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATA', message: 'Records must be an array' },
      });
      return;
    }

    logger.info('Bulk creating revenue records', { count: records.length });

    const docs = records.map((r: any) => ({
      merchantId: r.merchantId,
      date: new Date(r.date),
      revenue: r.revenue,
      orders: r.orders,
      averageOrderValue: r.averageOrderValue,
      costs: r.costs,
    }));

    await RevenueRecord.insertMany(docs);

    const duration = Date.now() - startTime;

    res.status(201).json({
      success: true,
      data: { inserted: records.length },
      meta: { timestamp: new Date().toISOString(), duration },
    });
  })
);

// ============ PRODUCT PERFORMANCE ============

/**
 * POST /api/data/products
 * Create a product performance record
 */
router.post(
  '/products',
  validateCreateProductPerformance,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const data = req.body;

    logger.info('Creating product performance record', { merchantId: data.merchantId, productId: data.productId });

    const record = new ProductPerformance({
      ...data,
      lastUpdated: new Date(),
    });

    await record.save();

    const duration = Date.now() - startTime;

    res.status(201).json({
      success: true,
      data: record,
      meta: { timestamp: new Date().toISOString(), duration },
    });
  })
);

/**
 * PUT /api/data/products/:merchantId/:productId
 * Update product performance
 */
router.put(
  '/products/:merchantId/:productId',
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { merchantId, productId } = req.params;
    const updates = req.body;

    logger.info('Updating product performance', { merchantId, productId });

    const record = await ProductPerformance.findOneAndUpdate(
      { merchantId, productId },
      { ...updates, lastUpdated: new Date() },
      { new: true, upsert: true }
    );

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: record,
      meta: { timestamp: new Date().toISOString(), duration },
    });
  })
);

/**
 * POST /api/data/products/bulk
 * Bulk create product performance records
 */
router.post(
  '/products/bulk',
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const records = req.body.records;

    if (!Array.isArray(records)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATA', message: 'Records must be an array' },
      });
      return;
    }

    logger.info('Bulk creating product performance records', { count: records.length });

    const docs = records.map((r: any) => ({
      merchantId: r.merchantId,
      productId: r.productId,
      name: r.name,
      sku: r.sku,
      category: r.category,
      revenue: r.revenue,
      unitsSold: r.unitsSold,
      margin: r.margin,
      returnRate: r.returnRate || 0,
      trend: r.trend || 'stable',
      lastUpdated: new Date(),
    }));

    // Use upsert for bulk
    const operations = docs.map(doc => ({
      updateOne: {
        filter: { merchantId: doc.merchantId, productId: doc.productId },
        update: { $set: doc },
        upsert: true,
      },
    }));

    await ProductPerformance.bulkWrite(operations);

    const duration = Date.now() - startTime;

    res.status(201).json({
      success: true,
      data: { inserted: records.length },
      meta: { timestamp: new Date().toISOString(), duration },
    });
  })
);

// ============ CUSTOMERS ============

/**
 * POST /api/data/customers
 * Create a customer record
 */
router.post(
  '/customers',
  validateCreateCustomer,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const data = req.body;

    logger.info('Creating customer record', { merchantId: data.merchantId, customerId: data.customerId });

    const record = new Customer({
      ...data,
      firstPurchase: new Date(data.firstPurchase),
      lastPurchase: new Date(data.lastPurchase),
    });

    await record.save();

    const duration = Date.now() - startTime;

    res.status(201).json({
      success: true,
      data: record,
      meta: { timestamp: new Date().toISOString(), duration },
    });
  })
);

/**
 * GET /api/data/customers/:merchantId
 * Get customers for a merchant
 */
router.get(
  '/customers/:merchantId',
  validateMerchantId,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { merchantId } = req.params;
    const segment = req.query.segment as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    logger.info('Getting customers', { merchantId, segment });

    const query: any = { merchantId };
    if (segment) query.segment = segment;

    const [customers, total] = await Promise.all([
      Customer.find(query).skip(skip).limit(limit).sort({ lastPurchase: -1 }),
      Customer.countDocuments(query),
    ]);

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        customers,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      meta: { timestamp: new Date().toISOString(), duration },
    });
  })
);

/**
 * POST /api/data/customers/bulk
 * Bulk create customer records
 */
router.post(
  '/customers/bulk',
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const records = req.body.records;

    if (!Array.isArray(records)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATA', message: 'Records must be an array' },
      });
      return;
    }

    logger.info('Bulk creating customer records', { count: records.length });

    const docs = records.map((r: any) => ({
      merchantId: r.merchantId,
      customerId: r.customerId,
      email: r.email,
      phone: r.phone,
      firstPurchase: new Date(r.firstPurchase),
      lastPurchase: new Date(r.lastPurchase),
      totalOrders: r.totalOrders || 1,
      totalSpent: r.totalSpent || 0,
      averageOrderValue: r.averageOrderValue || 0,
      rfmScores: r.rfmScores || { recency: 0, frequency: 0, monetary: 0 },
      segment: r.segment || 'new',
      churnRisk: r.churnRisk || 'low',
    }));

    // Use upsert for bulk
    const operations = docs.map(doc => ({
      updateOne: {
        filter: { merchantId: doc.merchantId, customerId: doc.customerId },
        update: { $set: doc },
        upsert: true,
      },
    }));

    await Customer.bulkWrite(operations);

    const duration = Date.now() - startTime;

    res.status(201).json({
      success: true,
      data: { inserted: records.length },
      meta: { timestamp: new Date().toISOString(), duration },
    });
  })
);

// ============ COMPETITORS ============

/**
 * POST /api/data/competitors
 * Create a competitor record
 */
router.post(
  '/competitors',
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { merchantId } = req.body;
    const data = req.body;

    logger.info('Creating competitor record', { merchantId, competitorId: data.competitorId });

    const record = new Competitor({
      ...data,
      lastUpdated: new Date(),
    });

    await record.save();

    const duration = Date.now() - startTime;

    res.status(201).json({
      success: true,
      data: record,
      meta: { timestamp: new Date().toISOString(), duration },
    });
  })
);

/**
 * PUT /api/data/competitors/:merchantId/:competitorId
 * Update competitor
 */
router.put(
  '/competitors/:merchantId/:competitorId',
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { merchantId, competitorId } = req.params;
    const updates = req.body;

    logger.info('Updating competitor', { merchantId, competitorId });

    const record = await Competitor.findOneAndUpdate(
      { merchantId, competitorId },
      { ...updates, lastUpdated: new Date() },
      { new: true, upsert: true }
    );

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: record,
      meta: { timestamp: new Date().toISOString(), duration },
    });
  })
);

/**
 * GET /api/data/competitors/:merchantId
 * Get competitors for a merchant
 */
router.get(
  '/competitors/:merchantId',
  validateMerchantId,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { merchantId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    logger.info('Getting competitors', { merchantId });

    const competitors = await Competitor.find({ merchantId })
      .limit(limit)
      .sort({ estimatedRevenue: -1 });

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: competitors,
      meta: { timestamp: new Date().toISOString(), duration },
    });
  })
);

export default router;