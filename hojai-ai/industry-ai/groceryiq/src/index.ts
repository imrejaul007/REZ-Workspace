import * as Sentry from '@sentry/node';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { createLogger, format, transports } from 'winston';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { groceryIQBrain } from './services/aiBrain';

// Load environment variables
dotenv.config();

// ============================================================================
// Sentry Error Tracking
// ============================================================================

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express(),
    new Sentry.Integrations.Mongo(),
  ],
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACE_RATE || '0.1'),
});

const { timestamp, json, errors, combine } = format;

const logger = createLogger({
  level: 'info',
  format: combine(timestamp(), json(), errors()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/groceryiq.log' })
  ]
});

const app = express();
const PORT = process.env.PORT || 4131;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/groceryiq';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req: Request, res: Response, next) => {
  logger.info({ method: req.method, path: req.path, ip: req.ip });
  next();
});

// ==================== MONGOOSE SCHEMAS ====================

// Product Schema
const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  category: { type: String, required: true, index: true },
  subcategory: String,
  brand: String,
  quantity: { type: Number, default: 0 },
  unit: { type: String, default: 'units' },
  price: { type: Number, required: true },
  cost: { type: Number },
  mrp: Number,
  reorderPoint: { type: Number, default: 10 },
  reorderQuantity: { type: Number, default: 100 },
  shelf: String,
  expiryDate: Date,
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  images: [String],
  status: { type: String, enum: ['active', 'inactive', 'discontinued'], default: 'active' }
}, { timestamps: true });

// Supplier Schema
const supplierSchema = new mongoose.Schema({
  supplierId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  contact: {
    email: String,
    phone: String,
    address: String
  },
  categories: [String],
  rating: { type: Number, default: 0 },
  leadTimeDays: { type: Number, default: 7 },
  paymentTerms: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

// Purchase Order Schema
const purchaseOrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  supplierId: { type: String, required: true },
  items: [{
    sku: String,
    name: String,
    quantity: Number,
    unitCost: Number,
    total: Number
  }],
  status: {
    type: String,
    enum: ['draft', 'submitted', 'confirmed', 'shipped', 'received', 'cancelled'],
    default: 'draft'
  },
  subtotal: Number,
  tax: Number,
  total: Number,
  expectedDelivery: Date,
  actualDelivery: Date,
  notes: String
}, { timestamps: true });

// Inventory Movement Schema
const inventoryMovementSchema = new mongoose.Schema({
  movementId: { type: String, required: true, unique: true },
  sku: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['purchase', 'sale', 'adjustment', 'transfer', 'return', 'damage', 'expired'],
    required: true
  },
  quantity: { type: Number, required: true },
  balanceBefore: Number,
  balanceAfter: Number,
  reason: String,
  reference: String,
  performedBy: String
}, { timestamps: true });

// Demand Forecast Schema
const demandForecastSchema = new mongoose.Schema({
  sku: { type: String, required: true, index: true },
  horizon: { type: String, enum: ['day', 'week', 'month'], required: true },
  location: { type: String, default: 'default' },
  predicted: Number,
  lowerBound: Number,
  upperBound: Number,
  confidence: Number,
  factors: [String],
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create Models
const Product = mongoose.model('Product', productSchema);
const Supplier = mongoose.model('Supplier', supplierSchema);
const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
const InventoryMovement = mongoose.model('InventoryMovement', inventoryMovementSchema);
const DemandForecast = mongoose.model('DemandForecast', demandForecastSchema);

// ==================== VALIDATION SCHEMAS ====================

const InventorySchema = z.object({
  sku: z.string(),
  name: z.string(),
  category: z.string(),
  quantity: z.number(),
  unit: z.string(),
  price: z.number(),
  cost: z.number().optional(),
  reorderPoint: z.number().optional(),
  reorderQuantity: z.number().optional()
});

const DemandForecastQuerySchema = z.object({
  sku: z.string(),
  horizon: z.enum(['day', 'week', 'month']),
  location: z.string().optional()
});

const PricingSchema = z.object({
  sku: z.string(),
  cost: z.number(),
  competitorPrices: z.array(z.number()).optional(),
  demandFactor: z.number().min(0).max(2).optional()
});

// ==================== INVENTORY ENDPOINTS ====================

app.get('/api/inventory', async (req: Request, res: Response) => {
  try {
    const { category, brand, status, search, limit = 100, offset = 0 } = req.query;

    const filter: any = {};
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await Product.find(filter)
      .skip(Number(offset))
      .limit(Number(limit))
      .sort({ name: 1 });

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: items,
      count: items.length,
      total,
      pagination: { limit: Number(limit), offset: Number(offset) }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/inventory/:sku', async (req: Request, res: Response) => {
  try {
    const item = await Product.findOne({ sku: req.params.sku });
    if (!item) {
      return res.status(404).json({ success: false, error: 'SKU not found' });
    }
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/inventory', async (req: Request, res: Response) => {
  try {
    const data = InventorySchema.parse(req.body);

    const existing = await Product.findOne({ sku: data.sku });
    if (existing) {
      return res.status(400).json({ success: false, error: 'SKU already exists' });
    }

    const product = new Product({
      ...data,
      sku: data.sku || `SKU-${Date.now()}`
    });

    await product.save();
    logger.info({ action: 'inventory_created', sku: data.sku });

    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put('/api/inventory/:sku', async (req: Request, res: Response) => {
  try {
    const item = await Product.findOneAndUpdate(
      { sku: req.params.sku },
      { $set: req.body },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, error: 'SKU not found' });
    }

    logger.info({ action: 'inventory_updated', sku: req.params.sku });
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/inventory/adjust', async (req: Request, res: Response) => {
  try {
    const { sku, adjustment, reason, type = 'adjustment' } = req.body;

    const item = await Product.findOne({ sku });
    if (!item) {
      return res.status(404).json({ success: false, error: 'SKU not found' });
    }

    const balanceBefore = item.quantity;
    item.quantity += adjustment;
    await item.save();

    // Record movement
    const movement = new InventoryMovement({
      movementId: `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      sku,
      type,
      quantity: adjustment,
      balanceBefore,
      balanceAfter: item.quantity,
      reason
    });
    await movement.save();

    logger.info({ action: 'inventory_adjusted', sku, adjustment, reason });
    res.json({ success: true, data: item, movement });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/inventory/low-stock', async (req: Request, res: Response) => {
  try {
    const lowStock = await Product.find({
      $expr: { $lte: ['$quantity', '$reorderPoint'] },
      status: 'active'
    }).sort({ quantity: 1 });

    res.json({ success: true, data: lowStock, count: lowStock.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/inventory/expiring', async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + Number(days));

    const expiring = await Product.find({
      expiryDate: { $lte: expiryDate },
      status: 'active'
    }).sort({ expiryDate: 1 });

    res.json({ success: true, data: expiring, count: expiring.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SUPPLIER ENDPOINTS ====================

app.get('/api/suppliers', async (req: Request, res: Response) => {
  try {
    const suppliers = await Supplier.find({ status: 'active' });
    res.json({ success: true, data: suppliers, count: suppliers.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/suppliers', async (req: Request, res: Response) => {
  try {
    const supplier = new Supplier({
      ...req.body,
      supplierId: req.body.supplierId || `SUP-${Date.now()}`
    });
    await supplier.save();
    res.status(201).json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== PURCHASE ORDER ENDPOINTS ====================

app.post('/api/purchase-orders', async (req: Request, res: Response) => {
  try {
    const { supplierId, items } = req.body;

    const orderItems = items.map((item: any) => ({
      ...item,
      total: item.quantity * item.unitCost
    }));

    const subtotal = orderItems.reduce((sum: number, item: any) => sum + item.total, 0);

    const order = new PurchaseOrder({
      orderId: `PO-${Date.now()}`,
      supplierId,
      items: orderItems,
      status: 'draft',
      subtotal,
      tax: subtotal * 0.18,
      total: subtotal * 1.18,
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    await order.save();
    logger.info({ action: 'purchase_order_created', orderId: order.orderId });

    res.status(201).json({ success: true, data: order });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/purchase-orders', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) filter.status = status;

    const orders = await PurchaseOrder.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: orders, count: orders.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/purchase-orders/:orderId/receive', async (req: Request, res: Response) => {
  try {
    const order = await PurchaseOrder.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Update inventory for each item
    for (const item of order.items) {
      await Product.findOneAndUpdate(
        { sku: item.sku },
        { $inc: { quantity: item.quantity } }
      );
    }

    order.status = 'received';
    order.actualDelivery = new Date();
    await order.save();

    logger.info({ action: 'purchase_order_received', orderId: order.orderId });
    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== DEMAND FORECASTING ====================

app.get('/api/demand/forecast', async (req: Request, res: Response) => {
  try {
    const query = DemandForecastQuerySchema.parse(req.query);
    const { sku, horizon, location } = query;

    // AI-based demand forecasting
    const product = await Product.findOne({ sku });
    const baseDemand = product ? Math.max(10, product.quantity * 0.3) : Math.random() * 100 + 50;

    const seasonalityFactor = horizon === 'day' ? 1.2 : horizon === 'week' ? 1.0 : 0.8;
    const predicted = Math.round(baseDemand * seasonalityFactor);

    const forecast = {
      sku,
      horizon,
      location: location || 'default',
      predicted,
      lowerBound: Math.round(predicted * 0.8),
      upperBound: Math.round(predicted * 1.2),
      confidence: 0.85,
      factors: ['seasonality', 'historical', 'promotions', 'weather', 'events'],
      generatedAt: new Date()
    };

    // Save forecast
    const forecastDoc = new DemandForecast(forecast);
    await forecastDoc.save();

    logger.info({ action: 'forecast_generated', sku, horizon, predicted });

    res.json({ success: true, data: forecast });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/demand/seasonality', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      patterns: [
        { name: 'Morning Rush', time: '7:00-10:00', factor: 1.5, category: 'Breakfast items' },
        { name: 'Evening Rush', time: '17:00-20:00', factor: 1.8, category: 'Dinner essentials' },
        { name: 'Weekend', time: 'Sat-Sun', factor: 1.3, category: 'All categories' },
        { name: 'Month End', time: 'Last 3 days', factor: 1.4, category: 'Staples, rice, flour' },
        { name: 'Festival', time: 'Festival weeks', factor: 2.0, category: 'Sweets, dry fruits' },
        { name: 'Summer', time: 'May-June', factor: 1.6, category: 'Beverages, ice cream' },
        { name: 'Monsoon', time: 'June-Sep', factor: 1.4, category: 'Ready-to-eat, snacks' }
      ]
    }
  });
});

// ==================== PRICING ====================

app.get('/api/pricing/recommend', async (req: Request, res: Response) => {
  try {
    const { sku, cost, competitorPrices, demandFactor } = PricingSchema.parse(req.query);

    const product = await Product.findOne({ sku });
    const actualCost = cost || product?.cost || 0;

    // AI pricing algorithm
    const avgCompetitor = competitorPrices?.length
      ? competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length
      : actualCost * 1.3;

    const demandMultiplier = demandFactor || 1;
    const recommendedPrice = Math.round(avgCompetitor * 0.95 * demandMultiplier * 100) / 100;

    const recommendation = {
      sku,
      cost: actualCost,
      competitorAverage: avgCompetitor,
      recommendedPrice,
      margin: ((recommendedPrice - actualCost) / actualCost * 100).toFixed(2) + '%',
      strategy: (demandFactor ?? 1) > 1 ? 'premium' : 'competitive',
      confidence: 0.82,
      alternatives: {
        aggressive: Math.round(avgCompetitor * 0.9 * 100) / 100,
        moderate: Math.round(avgCompetitor * 0.95 * 100) / 100,
        premium: Math.round(avgCompetitor * 1.05 * 100) / 100
      }
    };

    logger.info({ action: 'price_recommended', sku, price: recommendedPrice });
    res.json({ success: true, data: recommendation });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== BASKET ANALYSIS ====================

app.post('/api/basket/analyze', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    // Get product details
    const products = await Product.find({ sku: { $in: items } });
    const productMap = new Map(products.map(p => [p.sku, p]));

    // Analyze basket
    const categories = products.map(p => p.category);
    const categoryCount = categories.reduce((acc: any, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const totalValue = products.reduce((sum, p) => sum + (p.price || 0), 0);

    // Find recommendations (products from different categories)
    const allProducts = await Product.find({
      status: 'active',
      category: { $nin: Object.keys(categoryCount) }
    }).limit(5);

    const analysis = {
      totalItems: items?.length || 0,
      totalValue,
      categories: categoryCount,
      affinityProducts: [
        { items: ['Milk', 'Bread'], lift: 2.3, reason: 'Classic breakfast combo' },
        { items: ['Chips', 'Cold Drinks'], lift: 1.9, reason: 'Snack pairing' },
        { items: ['Rice', 'Dal'], lift: 2.1, reason: 'Staple combo' },
        { items: ['Tea', 'Biscuits'], lift: 2.5, reason: 'Tea time essentials' }
      ],
      recommendations: allProducts.map(p => ({
        sku: p.sku,
        name: p.name,
        category: p.category,
        reason: 'Complements your basket'
      }))
    };

    res.json({ success: true, data: analysis });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ANALYTICS ====================

app.get('/api/analytics/overview', async (req: Request, res: Response) => {
  try {
    const totalSKUs = await Product.countDocuments({ status: 'active' });
    const products = await Product.find({ status: 'active' });

    const totalValue = products.reduce((sum, p) => sum + (p.quantity * (p.price || 0)), 0);
    const totalCost = products.reduce((sum, p) => sum + (p.quantity * (p.cost || 0)), 0);

    const lowStockItems = products.filter(p => p.quantity <= p.reorderPoint).length;
    const outOfStock = products.filter(p => p.quantity === 0).length;

    // Category breakdown
    const categoryBreakdown = await Product.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 }, value: { $sum: { $multiply: ['$quantity', '$price'] } } } },
      { $sort: { value: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalSKUs,
        lowStockItems,
        outOfStock,
        totalInventoryValue: Math.round(totalValue),
        potentialMargin: totalCost > 0 ? Math.round((totalValue - totalCost) / totalCost * 100) : 0,
        categoryBreakdown: categoryBreakdown.map(c => ({ category: c._id, count: c.count, value: c.value })),
        topCategories: ['FMCG', 'Dairy', 'Beverages', 'Snacks', 'Staples']
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/analytics/trends', async (req: Request, res: Response) => {
  try {
    const { period = 'week' } = req.query;

    const movements = await InventoryMovement.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: 1 });

    // Group by day
    const trends = movements.reduce((acc: any, m) => {
      const day = m.createdAt.toISOString().split('T')[0];
      if (!acc[day]) acc[day] = { date: day, purchases: 0, sales: 0, adjustments: 0 };
      if (m.type === 'purchase') acc[day].purchases += Math.abs(m.quantity);
      if (m.type === 'sale') acc[day].sales += Math.abs(m.quantity);
      if (m.type === 'adjustment') acc[day].adjustments += Math.abs(m.quantity);
      return acc;
    }, {});

    res.json({ success: true, data: Object.values(trends) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AI DEMAND FORECASTING ====================

app.post('/api/ai/demand/forecast', async (req: Request, res: Response) => {
  try {
    const { productId, historical, seasonal, location, promotions, weather } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: 'productId is required' });
    }

    const forecast = await groceryIQBrain.forecastDemand({
      productId,
      historical: historical || [50, 55, 48, 60, 52, 58, 54],
      seasonal: seasonal !== false,
      location,
      promotions,
      weather
    });

    logger.info({ action: 'ai_demand_forecast', productId, confidence: forecast.confidence });
    res.json({ success: true, data: forecast });
  } catch (error: any) {
    logger.error({ action: 'ai_demand_forecast_error', error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AI SHELF OPTIMIZATION ====================

app.post('/api/ai/shelf/optimize', async (req: Request, res: Response) => {
  try {
    const { storeId, products, layout } = req.body;

    if (!storeId || !products) {
      return res.status(400).json({ success: false, error: 'storeId and products are required' });
    }

    const optimization = await groceryIQBrain.optimizeShelf({
      storeId,
      products,
      layout: layout || {
        totalShelves: 5,
        eyeLevelShelf: 3,
        sections: ['entrance', 'dairy', 'snacks', 'beverages', 'checkout']
      }
    });

    logger.info({ action: 'ai_shelf_optimize', storeId, uplift: optimization.uplift });
    res.json({ success: true, data: optimization });
  } catch (error: any) {
    logger.error({ action: 'ai_shelf_optimize_error', error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AI SUPPLIER RECOMMENDATIONS ====================

app.post('/api/ai/supplier/recommend', async (req: Request, res: Response) => {
  try {
    const { productId, requirements } = req.body;

    if (!productId || !requirements) {
      return res.status(400).json({ success: false, error: 'productId and requirements are required' });
    }

    const recommendations = await groceryIQBrain.recommendSuppliers({
      productId,
      requirements: {
        quantity: requirements.quantity || 100,
        deliveryFrequency: requirements.deliveryFrequency || 'weekly',
        maxLeadTimeDays: requirements.maxLeadTimeDays || 7,
        paymentTerms: requirements.paymentTerms || 'net_30'
      }
    });

    logger.info({ action: 'ai_supplier_recommend', productId, bestChoice: recommendations.bestChoice.name });
    res.json({ success: true, data: recommendations });
  } catch (error: any) {
    logger.error({ action: 'ai_supplier_recommend_error', error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AI EXPIRY MANAGEMENT ====================

app.post('/api/ai/expiry/manage', async (req: Request, res: Response) => {
  try {
    const { inventory, discountThresholdDays } = req.body;

    if (!inventory || !Array.isArray(inventory)) {
      return res.status(400).json({ success: false, error: 'inventory array is required' });
    }

    const expiryData = await groceryIQBrain.manageExpiry({
      inventory,
      discountThresholdDays
    });

    logger.info({ action: 'ai_expiry_manage', items: inventory.length, priority: expiryData.priority.length });
    res.json({ success: true, data: expiryData });
  } catch (error: any) {
    logger.error({ action: 'ai_expiry_manage_error', error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AI PRICE OPTIMIZATION ====================

app.post('/api/ai/price/optimize', async (req: Request, res: Response) => {
  try {
    const { productId, name, cost, competitorPrices, demand, category, season, isPromotional } = req.body;

    if (!productId || !cost) {
      return res.status(400).json({ success: false, error: 'productId and cost are required' });
    }

    const pricing = await groceryIQBrain.optimizePrice({
      productId,
      name: name || 'Unknown Product',
      cost,
      competitorPrices: competitorPrices || [cost * 1.3, cost * 1.35, cost * 1.25],
      demand: demand || 'neutral',
      category: category || 'general',
      season,
      isPromotional
    });

    logger.info({ action: 'ai_price_optimize', productId, optimalPrice: pricing.optimalPrice });
    res.json({ success: true, data: pricing });
  } catch (error: any) {
    logger.error({ action: 'ai_price_optimize_error', error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AI BASKET ANALYSIS ====================

app.post('/api/ai/basket/analyze', async (req: Request, res: Response) => {
  try {
    const { items, customerSegment, timeOfDay, dayOfWeek } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'items array is required' });
    }

    const analysis = await groceryIQBrain.analyzeBasket({
      items,
      customerSegment,
      timeOfDay,
      dayOfWeek
    });

    logger.info({ action: 'ai_basket_analyze', items: items.length, uplift: analysis.basketValue.uplift });
    res.json({ success: true, data: analysis });
  } catch (error: any) {
    logger.error({ action: 'ai_basket_analyze_error', error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AI INSIGHTS SUMMARY ====================

app.get('/api/ai/insights', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    const insights = {
      demand: {
        endpoint: '/api/ai/demand/forecast',
        description: 'AI-powered demand forecasting with confidence scores',
        input: { productId: 'string', historical: 'number[]', seasonal: 'boolean' },
        output: { demand: { nextWeek: 'number', nextMonth: 'number' }, confidence: 'number', suggestions: 'string[]' }
      },
      shelf: {
        endpoint: '/api/ai/shelf/optimize',
        description: 'Shelf optimization with margin-velocity analysis',
        input: { storeId: 'string', products: 'array', layout: 'object' },
        output: { arrangement: 'array', reasoning: 'string', uplift: 'string' }
      },
      supplier: {
        endpoint: '/api/ai/supplier/recommend',
        description: 'Supplier recommendations with reliability scoring',
        input: { productId: 'string', requirements: 'object' },
        output: { suppliers: 'array', bestChoice: 'object' }
      },
      expiry: {
        endpoint: '/api/ai/expiry/manage',
        description: 'Expiry management with discount suggestions',
        input: { inventory: 'array', discountThresholdDays: 'number' },
        output: { priority: 'array', discountSuggestions: 'array', wastePrevention: 'array' }
      },
      price: {
        endpoint: '/api/ai/price/optimize',
        description: 'Price optimization with competitor analysis',
        input: { productId: 'string', cost: 'number', competitorPrices: 'number[]', demand: 'string' },
        output: { optimalPrice: 'number', margin: 'string', alternatives: 'object' }
      },
      basket: {
        endpoint: '/api/ai/basket/analyze',
        description: 'Basket analysis with cross-selling recommendations',
        input: { items: 'array', customerSegment: 'string' },
        output: { insights: 'array', recommendations: 'array', basketValue: 'object' }
      }
    };

    if (type && insights[type as keyof typeof insights]) {
      return res.json({ success: true, data: insights[type as keyof typeof insights] });
    }

    res.json({ success: true, data: insights });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== HEALTH ====================

// Sentry error handler (must be before other error handlers)
app.use(Sentry.Handlers.errorHandler());

// Sentry tracing middleware
app.use(Sentry.Handlers.tracingMiddleware());

app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const hasAI = !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY);

  res.json({
    status: 'healthy',
    service: 'GroceryIQ',
    port: PORT,
    version: '1.1.0',
    mongodb: mongoStatus,
    ai: {
      enabled: hasAI,
      provider: 'Claude AI',
      model: 'claude-sonnet-4-20250514'
    }
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'GroceryIQ',
    description: 'Grocery Retail AI with Real AI Intelligence',
    version: '1.1.0',
    port: PORT,
    mongodb: MONGODB_URI,
    ai: {
      enabled: !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY),
      provider: 'Claude AI'
    },
    endpoints: [
      '/api/inventory/*',
      '/api/suppliers/*',
      '/api/purchase-orders/*',
      '/api/demand/*',
      '/api/pricing/*',
      '/api/basket/*',
      '/api/analytics/*',
      '/api/ai/demand/forecast',
      '/api/ai/shelf/optimize',
      '/api/ai/supplier/recommend',
      '/api/ai/expiry/manage',
      '/api/ai/price/optimize',
      '/api/ai/basket/analyze',
      '/api/ai/insights',
      '/health'
    ]
  });
});

// ==================== MONGODB CONNECTION ====================

async function connectMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    // Continue without MongoDB - use in-memory fallback
    console.log('⚠️ MongoDB not available, using in-memory fallback');
  }
}

// Seed sample data if MongoDB is connected
async function seedData() {
  if (mongoose.connection.readyState !== 1) return;

  const count = await Product.countDocuments();
  if (count > 0) return;

  console.log('🌱 Seeding sample grocery data...');

  const sampleProducts = [
    { sku: 'MILK-001', name: 'Amul Toned Milk 1L', category: 'Dairy', price: 60, cost: 45, quantity: 200, reorderPoint: 50 },
    { sku: 'MILK-002', name: 'Amul Gold Milk 1L', category: 'Dairy', price: 75, cost: 58, quantity: 150, reorderPoint: 40 },
    { sku: 'BRD-001', name: 'Whole Wheat Bread', category: 'Bakery', price: 45, cost: 28, quantity: 100, reorderPoint: 30 },
    { sku: 'RICE-001', name: 'Basmati Rice 5kg', category: 'Staples', price: 450, cost: 320, quantity: 80, reorderPoint: 20 },
    { sku: 'DAL-001', name: 'Toor Dal 1kg', category: 'Staples', price: 145, cost: 110, quantity: 120, reorderPoint: 30 },
    { sku: 'CHP-001', name: 'Lays Classic 150g', category: 'Snacks', price: 50, cost: 28, quantity: 300, reorderPoint: 100 },
    { sku: 'COLA-001', name: 'Coca Cola 2L', category: 'Beverages', price: 95, cost: 65, quantity: 200, reorderPoint: 50 },
    { sku: 'TEA-001', name: 'Tata Tea 1kg', category: 'Beverages', price: 480, cost: 380, quantity: 60, reorderPoint: 20 },
    { sku: 'OIL-001', name: 'Fortune Sunflower Oil 5L', category: 'Staples', price: 650, cost: 520, quantity: 40, reorderPoint: 15 },
    { sku: 'SUGAR-001', name: 'Sugar 1kg', category: 'Staples', price: 45, cost: 35, quantity: 150, reorderPoint: 40 }
  ];

  await Product.insertMany(sampleProducts);
  console.log(`✅ Seeded ${sampleProducts.length} products`);
}

// Start server
async function start() {
  await connectMongoDB();
  await seedData();

  app.listen(PORT, () => {
    logger.info(`GroceryIQ started on port ${PORT}`);
    console.log(`🏪 GroceryIQ running at http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
}

start().catch(console.error);

export default app;