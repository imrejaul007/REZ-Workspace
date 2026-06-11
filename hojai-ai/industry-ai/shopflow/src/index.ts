/**
 * SHOPFLOW - Retail AI Operating System
 * Production-Ready Server with MongoDB, JWT, Security & Logging
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const PORT = process.env.PORT || 4830;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopflow';
const JWT_SECRET = process.env.JWT_SECRET || 'hojai-dev-secret';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token';
const INTERNAL_TOKEN = INTERNAL_SERVICE_TOKEN;

// SDK & Webhook Service URLs
const WEBHOOK_SERVICE_URL = process.env.WEBHOOK_SERVICE_URL || 'http://localhost:4090';
const HOJAI_URL = process.env.HOJAI_URL || 'http://localhost:4800';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4095';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
  defaultMeta: { service: 'SHOPFLOW', port: PORT },
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}

// ============================================
// SDK & WEBHOOK HELPERS
// ============================================

async function triggerWebhook(event: string, payload: any) {
  try {
    await axios.post(
      `${WEBHOOK_SERVICE_URL}/api/events`,
      { event, payload, source: 'shopflow' },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
    logger.info(`Webhook triggered: ${event}`);
  } catch (error: any) {
    logger.error(`Webhook error (${event}):`, error.message);
  }
}

async function syncToHOJAI(entityType: string, action: string, data: any) {
  try {
    await axios.post(
      `${HOJAI_URL}/api/sync`,
      { entityType, action, source: 'shopflow', data, timestamp: new Date().toISOString() },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
    logger.info(`Synced to HOJAI: ${entityType}/${action}`);
  } catch (error: any) {
    if (error.response?.status !== 404) {
      logger.error(`HOJAI sync error:`, error.message);
    }
  }
}

async function sendNotification(phone: string, message: string, channel: 'sms' | 'whatsapp' = 'sms') {
  try {
    const endpoint = channel === 'whatsapp' ? '/api/whatsapp/send' : '/api/sms/send';
    await axios.post(
      `${NOTIFICATION_SERVICE_URL}${endpoint}`,
      channel === 'whatsapp' ? { to: phone, template: 'notification', variables: { message } } : { to: phone, message },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    logger.error(`Notification error:`, error.message);
  }
}

import { Product, Customer, Sale, Inventory, LoyaltyTransaction, Campaign } from './models/index';

// ExpertOS Integration - Clone your profession for online services
import { registerExpertOS } from '../../../hojai-expert-os/src/expertOS-integration';

const app = express();
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], scriptSrc: ["'self'"], imgSrc: ["'self'", "data:", "https:"] } } }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'], credentials: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { success: false, error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' }, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { success: false, error: 'Too many auth attempts', code: 'AUTH_RATE_LIMIT_EXCEEDED' } });

app.use('/api/', limiter);
app.use('/api/auth', authLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

interface AuthRequest extends Request { userId?: string; userRole?: string; isInternal?: boolean; }

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const internalToken = req.headers['x-internal-token'];
    if (internalToken === INTERNAL_SERVICE_TOKEN) { req.isInternal = true; return next(); }
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'Token required', code: 'UNAUTHORIZED' });
    try { const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string; role: string }; req.userId = decoded.userId; req.userRole = decoded.role; next(); }
    catch { return res.status(401).json({ success: false, error: 'Invalid token', code: 'INVALID_TOKEN' }); }
  } catch (error) { logger.error('Auth error', { error }); res.status(500).json({ success: false, error: 'Auth error', code: 'AUTH_ERROR' }); }
};

const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) { try { const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string; role: string }; req.userId = decoded.userId; req.userRole = decoded.role; } catch {} }
  next();
};

interface ApiError extends Error { statusCode?: number; code?: string; }

const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction) => {
  logger.error('Request error', { error: err.message, stack: err.stack, path: req.path });
  res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Internal error', code: err.code || 'INTERNAL_ERROR', timestamp: new Date().toISOString() });
};

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4(); req.headers['x-request-id'] = requestId;
  const start = Date.now();
  res.on('finish', () => logger.info('Request completed', { requestId, method: req.method, path: req.path, statusCode: res.statusCode, duration: `${Date.now() - start}ms` }));
  next();
});

// HEALTH CHECKS
app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const productCount = await Product.countDocuments({ isActive: true }).catch(() => 0);
  const customerCount = await Customer.countDocuments().catch(() => 0);
  const todaySales = await Sale.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }).catch(() => 0);
  res.json({ status: 'healthy', service: 'SHOPFLOW', version: '1.0.0', port: PORT, environment: process.env.NODE_ENV || 'development', uptime: process.uptime(), mongo: mongoStatus, aiEmployees: ['Inventory AI', 'Customer AI', 'Merchandising AI', 'Loyalty AI', 'ExpertOS'], stats: { products: productCount, customers: customerCount, salesToday: todaySales }, timestamp: new Date().toISOString() });
});

app.get('/health/live', (req: Request, res: Response) => res.json({ status: 'alive', timestamp: new Date().toISOString() }));
app.get('/health/ready', async (req: Request, res: Response) => {
  const mongoReady = mongoose.connection.readyState === 1;
  if (!mongoReady) return res.status(503).json({ status: 'not ready', checks: { mongodb: 'not ready' }, timestamp: new Date().toISOString() });
  res.json({ status: 'ready', checks: { mongodb: 'ready' }, timestamp: new Date().toISOString() });
});

// AI ENDPOINTS - INVENTORY AI
app.get('/api/ai/inventory/check', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const products = await Product.find({ isActive: true });
    const lowStock = products.filter(p => p.stock <= p.reorderLevel);
    const outOfStock = products.filter(p => p.stock === 0);

    const insights: string[] = [];
    if (outOfStock.length > 0) { insights.push(`${outOfStock.length} products out of stock - immediate reorder required`); insights.push(`Top priority: ${outOfStock[0].name}`); }
    if (lowStock.length > 3) { insights.push('Multiple products approaching reorder level - consider bulk reorder'); }

    logger.info('Inventory check completed', { lowStock: lowStock.length, outOfStock: outOfStock.length });
    res.json({ success: true, totalProducts: products.length, lowStockCount: lowStock.length, outOfStockCount: outOfStock.length, lowStock, outOfStock, insights });
  } catch (error) { next(error); }
});

app.post('/api/ai/inventory/reorder', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found', code: 'NOT_FOUND' });

    const newStock = product.stock + quantity;
    product.stock = newStock;
    await product.save();

    logger.info('Inventory reordered', { productId, quantity, newStock });
    res.json({ success: true, product: { ...product.toObject(), stock: newStock }, reorder: { quantity, estimatedCost: quantity * product.cost, margin: quantity * (product.price - product.cost) }, message: `Reorder placed for ${quantity} units of ${product.name}. New stock: ${newStock}` });
  } catch (error) { next(error); }
});

// AI ENDPOINTS - CUSTOMER AI
app.post('/api/ai/customer/query', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { query, customerId } = req.body;
    const lowerQuery = query.toLowerCase();

    let response: any = { type: 'general', message: 'I\'m here to help! Ask me about products, prices, availability, or any other queries.' };

    if (lowerQuery.includes('available') || lowerQuery.includes('stock')) {
      const searchTerms = lowerQuery.split(' ').filter((w: string) => w.length > 3);
      const matchingProducts = await Product.find({ isActive: true, $or: [{ name: { $regex: searchTerms.join('|'), $options: 'i' } }, { category: { $regex: searchTerms.join('|'), $options: 'i' } }] });
      response = { type: 'product_search', products: matchingProducts.slice(0, 10), message: `Found ${matchingProducts.length} products matching your search:` };
    } else if (lowerQuery.includes('price') || lowerQuery.includes('cost')) {
      const searchTerms = lowerQuery.split(' ').filter((w: string) => w.length > 3);
      const matchingProducts = await Product.find({ isActive: true, name: { $regex: searchTerms.join('|'), $options: 'i' } });
      response = { type: 'price_inquiry', products: matchingProducts.map((p: any) => ({ name: p.name, price: p.price })), message: 'Here are the prices:' };
    } else if (lowerQuery.includes('return') || lowerQuery.includes('exchange')) {
      response = { type: 'return_exchange', policy: 'We offer 7-day returns and 15-day exchanges on all unused items with tags.', message: 'Our return/exchange policy:' };
    }

    logger.info('Customer query processed', { query: query.substring(0, 50) });
    res.json({ success: true, response });
  } catch (error) { next(error); }
});

// AI ENDPOINTS - LOYALTY AI
app.post('/api/ai/loyalty/points', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { customerId } = req.body;
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found', code: 'NOT_FOUND' });

    const tierPoints: Record<string, number> = { bronze: 0, silver: 500, gold: 2000, platinum: 5000 };
    const nextTier = customer.tier === 'bronze' ? { name: 'silver', minPoints: 500 } : customer.tier === 'silver' ? { name: 'gold', minPoints: 2000 } : customer.tier === 'gold' ? { name: 'platinum', minPoints: 5000 } : null;

    const rewards = [
      { points: 100, reward: '5% off on next purchase', tier: 'bronze' },
      { points: 500, reward: '₹100 off on purchase above ₹500', tier: 'silver' },
      { points: 1000, reward: '15% off storewide', tier: 'gold' },
      { points: 2000, reward: 'Buy 1 Get 1 Free', tier: 'platinum' },
    ].filter(r => r.points <= customer.loyaltyPoints);

    logger.info('Loyalty points queried', { customerId, points: customer.loyaltyPoints });
    res.json({ success: true, customer: { id: customer._id, name: customer.name, tier: customer.tier, points: customer.loyaltyPoints }, tierProgress: nextTier ? { current: customer.tier, next: nextTier.name, progress: Math.min(((customer.loyaltyPoints - tierPoints[customer.tier]) / (nextTier.minPoints - tierPoints[customer.tier])) * 100, 100) } : { current: customer.tier, next: 'Max', progress: 100 }, pointsToNextTier: nextTier ? Math.max(0, nextTier.minPoints - customer.loyaltyPoints) : 0, availableRewards: rewards });
  } catch (error) { next(error); }
});

app.post('/api/ai/loyalty/redeem', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { customerId, points } = req.body;
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found', code: 'NOT_FOUND' });
    if (points > customer.loyaltyPoints) return res.status(400).json({ success: false, error: 'Insufficient points', code: 'INSUFFICIENT_POINTS' });

    const transaction = await LoyaltyTransaction.create({ customerId, type: 'redeem', points: -points, description: `Redeemed ${points} points`, createdAt: new Date() });
    customer.loyaltyPoints -= points;
    await customer.save();

    logger.info('Points redeemed', { customerId, points });
    res.json({ success: true, remainingPoints: customer.loyaltyPoints, transaction, message: `Successfully redeemed ${points} points!` });
  } catch (error) { next(error); }
});

// API ROUTES - POS SALE
app.post('/api/services/pos/sale', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { customerId, items, paymentMethod, discount = 0 } = req.body;

    const saleItems = await Promise.all(items.map(async (item: any) => {
      const product = await Product.findById(item.productId);
      return { productId: item.productId, name: product?.name || 'Unknown', quantity: item.quantity, price: product?.price || 0, total: (product?.price || 0) * item.quantity };
    }));

    const subtotal = saleItems.reduce((sum: number, item: any) => sum + item.total, 0);
    const total = subtotal - discount;

    const sale = await Sale.create({ customerId, items: saleItems, subtotal, discount, total, paymentMethod, createdAt: new Date() });

    // Update product stock
    for (const item of saleItems) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } }).catch(() => {});
    }

    // Trigger webhook and sync to HOJAI
    await triggerWebhook('shopflow.sale.completed', { saleId: sale._id.toString(), customerId, items: saleItems, total, paymentMethod });
    await syncToHOJAI('sale', 'completed', { saleId: sale._id.toString(), customerId, items: saleItems, total, paymentMethod });

    // Update customer loyalty points
    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (customer) {
        const earnedPoints = Math.floor(total / 10);
        customer.loyaltyPoints += earnedPoints;
        customer.purchaseCount += 1;
        customer.totalSpent += total;
        await customer.save();

        await LoyaltyTransaction.create({ customerId, type: 'earn', points: earnedPoints, description: `Purchase - Order #${sale._id.toString().slice(0, 8)}`, saleId: sale._id, createdAt: new Date() });

        logger.info('Sale completed with loyalty', { saleId: sale._id, earnedPoints });
        res.json({ success: true, sale, loyalty: { earnedPoints, totalPoints: customer.loyaltyPoints, message: `You earned ${earnedPoints} loyalty points!` } });
        return;
      }
    }

    logger.info('Sale completed', { saleId: sale._id, total });
    res.json({ success: true, sale });
  } catch (error) { next(error); }
});

// API ROUTES
app.post('/api/customers', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, phone, email } = req.body;
    const existing = await Customer.findOne({ phone });
    if (existing) return res.status(409).json({ success: false, error: 'Customer with this phone already exists', code: 'DUPLICATE_PHONE' });

    const customer = await Customer.create({ name, phone, email, loyaltyPoints: 100, tier: 'bronze', purchaseCount: 0, totalSpent: 0 });
    logger.info('Customer registered', { customerId: customer._id, name });

    // Trigger webhook and sync to HOJAI
    await triggerWebhook('shopflow.customer.registered', { customerId: customer._id.toString(), name, phone, email });
    await syncToHOJAI('customer', 'registered', { customerId: customer._id.toString(), name, phone, email });

    res.json({ success: true, customer, welcomeBonus: 'You\'ve earned 100 welcome points!' });
  } catch (error) { next(error); }
});

app.get('/api/customers/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { const customer = await Customer.findById(req.params.id); if (!customer) return res.status(404).json({ success: false, error: 'Customer not found', code: 'NOT_FOUND' }); res.json({ customer }); } catch (error) { next(error); }
});

app.get('/api/products', async (req: Request, res: Response, next: NextFunction) => {
  try { const { category, search } = req.query; const query: any = { isActive: true }; if (category) query.category = category; if (search) query.name = { $regex: search as string, $options: 'i' }; const products = await Product.find(query); res.json({ products, total: products.length }); } catch (error) { next(error); }
});

app.get('/api/sales', async (req: Request, res: Response, next: NextFunction) => {
  try { const { date } = req.query; const query: any = {}; if (date) query.createdAt = { $gte: new Date(date as string + 'T00:00:00'), $lte: new Date(date as string + 'T23:59:59') }; const sales = await Sale.find(query); const totalSales = sales.reduce((sum, s) => sum + s.total, 0); res.json({ sales, summary: { totalSales, totalOrders: sales.length, avgOrderValue: sales.length > 0 ? totalSales / sales.length : 0 } }); } catch (error) { next(error); }
});

app.get('/ai/status', (req: Request, res: Response) => {
  res.json({ active: true, aiEmployees: 4, features: { inventoryAI: true, customerAI: true, merchandisingAI: true, loyaltyAI: true } });
});

// MONGODB CONNECTION
const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });
    logger.info('MongoDB connected successfully');
    await Promise.all([Product.createIndexes(), Customer.createIndexes(), Sale.createIndexes(), Inventory.createIndexes(), LoyaltyTransaction.createIndexes(), Campaign.createIndexes()]);

    if (await Product.countDocuments() === 0) {
      await Product.insertMany([
        { name: 'Cotton T-Shirt', sku: 'TSH-001', category: 'Clothing', price: 599, cost: 250, stock: 45, reorderLevel: 10, tags: ['bestseller', 'casual'], isActive: true },
        { name: 'Denim Jeans', sku: 'JN-001', category: 'Clothing', price: 1299, cost: 550, stock: 30, reorderLevel: 8, tags: ['popular', 'bestseller'], isActive: true },
        { name: 'Running Shoes', sku: 'SH-001', category: 'Footwear', price: 2499, cost: 1200, stock: 20, reorderLevel: 5, tags: ['sports', 'premium'], isActive: true },
        { name: 'Formal Shirt', sku: 'FSH-001', category: 'Clothing', price: 999, cost: 400, stock: 35, reorderLevel: 10, tags: ['formal', 'office'], isActive: true },
        { name: 'Leather Wallet', sku: 'WL-001', category: 'Accessories', price: 799, cost: 300, stock: 25, reorderLevel: 8, tags: ['gift', 'premium'], isActive: true },
        { name: 'Sunglasses', sku: 'SG-001', category: 'Accessories', price: 1499, cost: 500, stock: 15, reorderLevel: 5, tags: ['summer', 'trending'], isActive: true },
      ]);
    }
    logger.info('Default data seeded');
  } catch (error) { logger.error('MongoDB connection failed', { error }); throw error; }
};

let server: any;
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  server.close(async () => { logger.info('HTTP server closed'); try { await mongoose.connection.close(); logger.info('MongoDB connection closed'); } catch {} process.exit(0); });
  setTimeout(() => { logger.error('Forced shutdown'); process.exit(1); }, 30000);
};

const startServer = async () => {
  try {
    await connectMongoDB();
    server = app.listen(PORT, () => {
      logger.info('╔══════════════════════════════════════════════════════════════╗');
      logger.info('║                    SHOPFLOW v1.0.0                        ║');
      logger.info('║              Retail AI Operating System                     ║');
      logger.info(`║  Port: ${PORT}                                               ║`);
      logger.info('║  AI Employees: Inventory AI, Customer AI, Merchandising AI, Loyalty AI ║');
      logger.info('╚══════════════════════════════════════════════════════════════╝');
      logger.info('Production features: MongoDB, JWT Auth, Rate Limiting, Helmet, CORS, Winston, Health Checks, Graceful Shutdown');
    });
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) { logger.error('Failed to start server', { error }); process.exit(1); }
};

// ============================================
// EXPERTOS - Professional AI Twin for Retailers
// ============================================

const expertOSRouter = registerExpertOS('shopflow');
app.use('/api/expert-os', expertOSRouter);

app.use(errorHandler);
startServer();

export default app;