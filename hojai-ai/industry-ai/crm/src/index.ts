/**
 * HOJAI Industry CRM - Production-Ready Server
 * Cross-Industry CRM connecting all 15 Industry AI products
 * Port: 4980
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import { createLogger, format, transports } from 'winston';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================
// CONFIGURATION
// ============================================

const config = {
  port: parseInt(process.env.PORT || '4980', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai_crm',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
};

// ============================================
// WINSTON LOGGER
// ============================================

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/crm.log' })
  ]
});

// ============================================
// EXPRESS APP
// ============================================

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMax,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } }
}));

// ============================================
// MONGOOSE MODELS
// ============================================

// Lead Schema
const leadSchema = new mongoose.Schema({
  leadId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  source: { type: String, required: true },
  score: { type: Number, default: 50 },
  status: { type: String, enum: ['new', 'contacted', 'qualified', 'converted', 'lost'], default: 'new' },
  industry: { type: String },
  crossIndustries: [{ type: String }],
  notes: { type: String, default: '' },
  assignedTo: { type: String },
  lastContactedAt: { type: Date },
  conversionProbability: { type: Number, default: 0.5 },
  tags: [{ type: String }],
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Lead = mongoose.model('Lead', leadSchema);

// Customer Schema
const customerSchema = new mongoose.Schema({
  customerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  industries: [{ type: String }],
  lifetimeValue: { type: Number, default: 0 },
  stage: { type: String, enum: ['prospect', 'active', 'inactive'], default: 'prospect' },
  tags: [{ type: String }],
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Customer = mongoose.model('Customer', customerSchema);

// Revenue Record Schema
const revenueSchema = new mongoose.Schema({
  revenueId: { type: String, required: true, unique: true },
  industry: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['subscription', 'one-time', 'usage'], default: 'subscription' },
  customerId: { type: String },
  date: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

const Revenue = mongoose.model('Revenue', revenueSchema);

// ============================================
// INDUSTRY PRODUCTS CONFIG (Simplified)
// ============================================

const INDUSTRY_PRODUCTS: Record<string, { name: string; basePort: number }> = {
  restaurant: { name: 'Waitron', basePort: 4620 },
  hotel: { name: 'StayBot', basePort: 4621 },
  salon: { name: 'GlamAI', basePort: 4622 },
  fitness: { name: 'FitMind', basePort: 4623 },
  retail: { name: 'ShopFlow', basePort: 4624 },
  accounting: { name: 'LedgerAI', basePort: 4625 },
  fleet: { name: 'FleetIQ', basePort: 4626 },
  society: { name: 'NeighborAI', basePort: 4627 },
  healthcare: { name: 'CareCode', basePort: 4628 },
  grocery: { name: 'GroceryIQ', basePort: 4131 },
  automotive: { name: 'AutoMind', basePort: 4132 },
  education: { name: 'EduLearn', basePort: 4133 },
  franchise: { name: 'FranchiseAI', basePort: 4058 },
  travel: { name: 'TravelAI', basePort: 4070 },
  realEstate: { name: 'PropFlow', basePort: 4080 }
};

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const publicPaths = ['/health', '/', '/api/auth/login', '/api/products'];

  if (publicPaths.includes(req.path) || req.path.startsWith('/health')) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
};

app.use(authMiddleware);

// ============================================
// HEALTH ENDPOINTS
// ============================================

app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'degraded';
  const leadCount = await Lead.countDocuments().catch(() => 0);
  const customerCount = await Customer.countDocuments().catch(() => 0);

  res.json({
    status: mongoStatus,
    service: 'HOJAI Industry CRM',
    version: '1.0.0',
    port: config.port,
    mongodb: mongoStatus,
    connectedProducts: Object.keys(INDUSTRY_PRODUCTS).length,
    stats: { leads: leadCount, customers: customerCount },
    timestamp: new Date().toISOString()
  });
});

app.get('/health/live', (req: Request, res: Response) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ status: 'not_ready', reason: 'MongoDB not connected' });
  }
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

// ============================================
// AUTH ROUTES
// ============================================

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (username && password) {
    const token = jwt.sign({ userId: username, role: 'admin' }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    logger.info({ action: 'login', userId: username });
    res.json({ success: true, token, expiresIn: config.jwtExpiresIn });
  } else {
    res.status(400).json({ success: false, error: { code: 'INVALID_CREDENTIALS' } });
  }
});

// ============================================
// PRODUCTS ROUTES
// ============================================

app.get('/api/products', (req: Request, res: Response) => {
  const products = Object.entries(INDUSTRY_PRODUCTS).map(([key, value]) => ({
    id: key,
    name: value.name,
    port: value.basePort
  }));
  res.json({ success: true, products, count: products.length });
});

app.get('/api/products/:industry', (req: Request, res: Response) => {
  const product = INDUSTRY_PRODUCTS[req.params.industry];
  if (!product) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
  }
  res.json({ success: true, data: { id: req.params.industry, ...product } });
});

// ============================================
// LEADS ROUTES
// ============================================

app.get('/api/leads', async (req: Request, res: Response) => {
  try {
    const { source, status, minScore, maxScore, assignedTo } = req.query;
    const filter: any = {};
    if (source) filter.source = source;
    if (status) filter.status = status;
    if (minScore) filter.score = { $gte: parseInt(minScore as string) };
    if (maxScore) filter.score = { ...filter.score, $lte: parseInt(maxScore as string) };
    if (assignedTo) filter.assignedTo = assignedTo;

    const leads = await Lead.find(filter).sort({ score: -1 });
    res.json({ success: true, leads, count: leads.length });
  } catch (error) {
    logger.error('Error fetching leads:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

app.get('/api/leads/:id', async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findOne({ leadId: req.params.id });
    if (!lead) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lead not found' } });
    }
    res.json({ success: true, data: lead });
  } catch (error) {
    logger.error('Error fetching lead:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

app.post('/api/leads', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, source, industry, notes, tags } = req.body;
    const leadId = `lead_${Date.now()}`;
    const lead = await Lead.create({
      leadId,
      name,
      email,
      phone,
      source: source || industry || 'unknown',
      industry,
      notes: notes || '',
      tags: tags || [],
      score: 50,
      status: 'new'
    });
    logger.info({ action: 'lead_created', id: leadId, name });
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    logger.error('Error creating lead:', error);
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } });
  }
});

app.put('/api/leads/:id', async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findOneAndUpdate(
      { leadId: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!lead) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lead not found' } });
    }
    res.json({ success: true, data: lead });
  } catch (error) {
    logger.error('Error updating lead:', error);
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR' } });
  }
});

app.delete('/api/leads/:id', async (req: Request, res: Response) => {
  try {
    const result = await Lead.deleteOne({ leadId: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lead not found' } });
    }
    logger.info({ action: 'lead_deleted', id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting lead:', error);
    res.status(500).json({ success: false, error: { code: 'DELETE_ERROR' } });
  }
});

app.get('/api/leads/stats/summary', async (req: Request, res: Response) => {
  try {
    const total = await Lead.countDocuments();
    const byStatus = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const byIndustry = await Lead.aggregate([
      { $group: { _id: '$industry', count: { $sum: 1 } } }
    ]);
    const avgScore = await Lead.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalLeads: total,
        byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        byIndustry: byIndustry.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        averageScore: avgScore[0]?.avgScore || 0
      }
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: { code: 'STATS_ERROR' } });
  }
});

// ============================================
// CUSTOMERS ROUTES
// ============================================

app.get('/api/customers', async (req: Request, res: Response) => {
  try {
    const customers = await Customer.find();
    res.json({ success: true, customers, count: customers.length });
  } catch (error) {
    logger.error('Error fetching customers:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

app.get('/api/customers/:id', async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findOne({ customerId: req.params.id });
    if (!customer) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    logger.error('Error fetching customer:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

app.post('/api/customers', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, industries, tags } = req.body;
    const customerId = `cust_${Date.now()}`;
    const customer = await Customer.create({
      customerId,
      name,
      email,
      phone,
      industries: industries || [],
      tags: tags || [],
      stage: 'prospect'
    });
    logger.info({ action: 'customer_created', id: customerId, name });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    logger.error('Error creating customer:', error);
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } });
  }
});

app.put('/api/customers/:id', async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { customerId: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!customer) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    logger.error('Error updating customer:', error);
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR' } });
  }
});

// ============================================
// REVENUE ROUTES
// ============================================

app.get('/api/revenue', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, industry } = req.query;
    const filter: any = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }
    if (industry) filter.industry = industry;

    const revenues = await Revenue.find(filter).sort({ date: -1 });
    const total = revenues.reduce((sum, r) => sum + r.amount, 0);

    res.json({
      success: true,
      data: revenues,
      totalRevenue: total,
      count: revenues.length
    });
  } catch (error) {
    logger.error('Error fetching revenue:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

app.post('/api/revenue', async (req: Request, res: Response) => {
  try {
    const { industry, amount, type, customerId } = req.body;
    const revenueId = `rev_${Date.now()}`;
    const revenue = await Revenue.create({
      revenueId,
      industry,
      amount,
      type: type || 'subscription',
      customerId
    });
    logger.info({ action: 'revenue_recorded', id: revenueId, industry, amount });
    res.status(201).json({ success: true, data: revenue });
  } catch (error) {
    logger.error('Error recording revenue:', error);
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } });
  }
});

app.get('/api/revenue/industry/:industry', async (req: Request, res: Response) => {
  try {
    const revenues = await Revenue.find({ industry: req.params.industry });
    const total = revenues.reduce((sum, r) => sum + r.amount, 0);
    res.json({
      success: true,
      data: { industry: req.params.industry, total, count: revenues.length, revenues }
    });
  } catch (error) {
    logger.error('Error fetching industry revenue:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

// ============================================
// DASHBOARD ROUTE
// ============================================

app.get('/api/dashboard', async (req: Request, res: Response) => {
  try {
    const [leadStats, customerStats, revenueStats] = await Promise.all([
      Lead.countDocuments(),
      Customer.countDocuments(),
      Revenue.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const topIndustries = await Revenue.aggregate([
      { $group: { _id: '$industry', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        leads: { total: leadStats },
        customers: { total: customerStats },
        revenue: {
          total: revenueStats[0]?.total || 0,
          topIndustries: topIndustries.map(i => ({ industry: i._id, total: i.total }))
        },
        products: Object.keys(INDUSTRY_PRODUCTS).length
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard:', error);
    res.status(500).json({ success: false, error: { code: 'DASHBOARD_ERROR' } });
  }
});

// ============================================
// ROOT ENDPOINT
// ============================================

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'HOJAI Industry CRM',
    description: 'Cross-Industry CRM connecting all HOJAI AI products',
    version: '1.0.0',
    port: config.port,
    endpoints: {
      health: '/health',
      products: '/api/products',
      leads: '/api/leads',
      customers: '/api/customers',
      revenue: '/api/revenue',
      dashboard: '/api/dashboard'
    },
    connectedProducts: Object.keys(INDUSTRY_PRODUCTS).length,
    features: {
      aiEmployees: ['Lead Manager', 'Revenue Consolidator', 'Customer Intelligence'],
      capabilities: ['Lead Management', 'Customer 360', 'Revenue Consolidation', 'Cross-Industry Insights']
    }
  });
});

// ============================================
// ERROR HANDLERS
// ============================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found', path: req.path }
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: config.nodeEnv === 'production' ? 'An internal error occurred' : err.message }
  });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

let server: ReturnType<typeof app.listen> | null = null;
let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  const forceExitTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 30000);

  try {
    if (server) {
      server.close(() => logger.info('HTTP server closed'));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    }
    clearTimeout(forceExitTimeout);
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', { error });
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// START SERVER
// ============================================

async function startServer(): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('Connected to MongoDB');

    server = app.listen(config.port, () => {
      logger.info(`HOJAI Industry CRM started on port ${config.port}`, { port: config.port, env: config.nodeEnv });
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     HOJAI Industry CRM v1.0.0                             ║
║     Cross-Industry CRM Platform                           ║
║                                                           ║
║     Port: ${config.port}                                            ║
║     Env:  ${config.nodeEnv.padEnd(40)}║
║                                                           ║
║     Connected Products: ${Object.keys(INDUSTRY_PRODUCTS).length.toString().padEnd(23)}              ║
║                                                           ║
║     Features:                                              ║
║     ├─ MongoDB Database                                   ║
║     ├─ JWT Authentication                                 ║
║     ├─ Rate Limiting                                      ║
║     └─ Winston Logging                                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
        process.exit(1);
      }
      throw error;
    });
  } catch (error) {
    logger.error('Failed to start server:', { error });
    process.exit(1);
  }
}

startServer();

export default app;