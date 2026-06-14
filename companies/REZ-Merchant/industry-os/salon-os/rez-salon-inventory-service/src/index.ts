/**
 * REZ Salon Inventory Service
 * Production-Ready Server
 * Port: 4049
 * Industry: Salon/Spa Inventory Management
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';

const PORT = parseInt(process.env.PORT || '4202', 10);
const MONGO_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_inventory';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
  defaultMeta: { service: 'rez-salon-inventory' },
});

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Models
import { Product, IProduct, ProductCategory } from './models/Product';
import { Category } from './models/Category';
import { Supplier } from './models/Supplier';
import { StockAlert } from './models/StockAlert';

// Health checks
app.get('/health', async (_req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const productCount = await Product.countDocuments().catch(() => 0);
  res.json({
    status: mongoose.connection.readyState === 1 ? 'healthy' : 'degraded',
    service: 'rez-salon-inventory',
    version: '1.0.0',
    database: mongoStatus,
    stats: { products: productCount },
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  const checks = {
    mongodb: mongoose.connection.readyState === 1 ? 'ready' : 'not ready',
  };
  const allReady = Object.values(checks).every(s => s === 'ready');
  res.status(allReady ? 200 : 503).json({ status: allReady ? 'ready' : 'not ready', checks });
});

// ============== PRODUCTS ==============

app.post('/api/products', async (req: Request, res: Response) => {
  try {
    const product = await Product.create({
      ...req.body,
      productId: `PRD-${Date.now().toString(36)}`,
    });
    logger.info(`Product created: ${product.productId}`);
    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    logger.error('Error creating product:', error);
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR', message: error.message } });
  }
});

app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const { category, lowStock, search } = req.query;
    const filter: any = {};
    if (category) filter.category = category;
    if (lowStock === 'true') filter.$expr = { $lte: ['$minStockLevel', '$reorderPoint'] };
    if (search) {
      filter.$text = { $search: search as string };
    }
    const products = await Product.find(filter).populate('supplier');
    res.json({ success: true, data: products, count: products.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: error.message } });
  }
});

app.get('/api/products/:productId', async (req: Request, res: Response) => {
  try {
    const product = await Product.findOne({ productId: req.params.productId }).populate('supplier');
    if (!product) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: error.message } });
  }
});

app.patch('/api/products/:productId', async (req: Request, res: Response) => {
  try {
    const product = await Product.findOneAndUpdate(
      { productId: req.params.productId },
      { $set: req.body },
      { new: true }
    ).populate('supplier');
    if (!product) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR', message: error.message } });
  }
});

// ============== CATEGORIES ==============

app.post('/api/categories', async (req: Request, res: Response) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR', message: error.message } });
  }
});

app.get('/api/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await Category.find({});
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: error.message } });
  }
});

// ============== SUPPLIERS ==============

app.post('/api/suppliers', async (req: Request, res: Response) => {
  try {
    const supplier = await Supplier.create({
      ...req.body,
      supplierId: `SUP-${Date.now().toString(36)}`,
    });
    res.status(201).json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR', message: error.message } });
  }
});

app.get('/api/suppliers', async (_req: Request, res: Response) => {
  try {
    const suppliers = await Supplier.find({});
    res.json({ success: true, data: suppliers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: error.message } });
  }
});

// ============== STOCK ALERTS ==============

app.get('/api/alerts/low-stock', async (_req: Request, res: Response) => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$minStockLevel', '$reorderPoint'] },
    }).populate('supplier');

    // Create alerts for products below minimum
    const criticalProducts = await Product.find({
      minStockLevel: { $gt: 0 },
    }).populate('supplier');

    res.json({
      success: true,
      data: {
        lowStock: lowStockProducts,
        critical: criticalProducts.filter(p => {
          // Check usage per service vs current stock
          return true; // Simplified - would check actual stock
        }),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: error.message } });
  }
});

app.post('/api/alerts', async (req: Request, res: Response) => {
  try {
    const alert = await StockAlert.create({
      ...req.body,
      alertId: `ALT-${Date.now().toString(36)}`,
    });
    res.status(201).json({ success: true, data: alert });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR', message: error.message } });
  }
});

// ============== ANALYTICS ==============

app.get('/api/analytics/dashboard', async (_req: Request, res: Response) => {
  try {
    const [totalProducts, lowStockCount, categoryBreakdown, supplierCount] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ $expr: { $lte: ['$minStockLevel', '$reorderPoint'] } }),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Supplier.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        lowStockCount,
        categoryBreakdown,
        supplierCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'ANALYTICS_ERROR', message: error.message } });
  }
});

// ============== ERROR HANDLING ==============

app.use((err: Error, _req: Request, res: Response) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
});

// ============== GRACEFUL SHUTDOWN ==============

const shutdown = async () => {
  logger.info('Shutting down...');
  await mongoose.disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ============== START ==============

const start = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    logger.info('Connected to MongoDB');

    // Create indexes
    await Product.createIndexes();
    await Category.createIndexes();
    await Supplier.createIndexes();
    await StockAlert.createIndexes();

    app.listen(PORT, () => {
      logger.info('');
      logger.info('╔════════════════════════════════════════════════════════════════╗');
      logger.info('║            REZ SALON INVENTORY SERVICE v1.0.0             ║');
      logger.info('╠════════════════════════════════════════════════════════════════╣');
      logger.info(`║  Port: ${PORT}                                              ║`);
      logger.info('║  Industry: Salon/Spa Inventory Management                   ║');
      logger.info('║  Features: Products, Categories, Suppliers, Stock Alerts    ║');
      logger.info('╚════════════════════════════════════════════════════════════════╝');
    });
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
};

start();

export default app;
