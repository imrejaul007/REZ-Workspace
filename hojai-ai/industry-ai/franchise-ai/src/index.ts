/**
 * FRANCHISE-AI - Franchise Management AI Operating System
 * Production-Ready Server with MongoDB, JWT, Security & Graceful Shutdown
 * Port: 4058
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import { createLogger, format, transports } from 'winston';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================
// CONFIGURATION
// ============================================

const config = {
  port: parseInt(process.env.PORT || '4058', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/franchise_ai',
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
    new transports.File({ filename: 'logs/franchise-ai.log' })
  ]
});

// ============================================
// EXPRESS APP
// ============================================

const app: Express = express();

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

// Franchise Schema
const franchiseSchema = new mongoose.Schema({
  franchiseId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  owner: { type: String, required: true },
  location: { type: String, default: '' },
  type: { type: String, default: '' },
  status: { type: String, enum: ['active', 'suspended', 'closed'], default: 'active' },
  revenue: { type: Number, default: 0 },
  openedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Franchise = mongoose.model('Franchise', franchiseSchema);

// Performance Schema
const performanceSchema = new mongoose.Schema({
  performanceId: { type: String, required: true, unique: true },
  franchiseId: { type: String, required: true },
  period: { type: String, required: true },
  revenue: { type: Number, default: 0 },
  expenses: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  customers: { type: Number, default: 0 },
  rating: { type: Number, default: 4.0 },
  createdAt: { type: Date, default: Date.now }
});

const Performance = mongoose.model('Performance', performanceSchema);

// Standard Schema
const standardSchema = new mongoose.Schema({
  standardId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  required: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Standard = mongoose.model('Standard', standardSchema);

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

const createFranchiseSchema = z.object({
  name: z.string().min(1),
  owner: z.string().min(1),
  location: z.string().optional(),
  type: z.string().optional()
});

const createPerformanceSchema = z.object({
  franchiseId: z.string().min(1),
  period: z.string().min(1),
  revenue: z.number().min(0).optional(),
  expenses: z.number().min(0).optional(),
  customers: z.number().int().min(0).optional(),
  rating: z.number().min(0).max(5).optional()
});

const createStandardSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean().optional()
});

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const publicPaths = ['/health', '/', '/api/stats', '/api/auth/login'];

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
  const [franchiseCount, performanceCount] = await Promise.all([
    Franchise.countDocuments().catch(() => 0),
    Performance.countDocuments().catch(() => 0)
  ]);

  res.json({
    status: mongoStatus,
    service: 'franchise-ai',
    version: '1.0.0',
    port: config.port,
    mongodb: mongoStatus,
    stats: { franchises: franchiseCount, performances: performanceCount },
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
// FRANCHISE ROUTES
// ============================================

app.get('/api/franchises', async (req: Request, res: Response) => {
  try {
    const franchises = await Franchise.find();
    res.json({ success: true, data: franchises, count: franchises.length });
  } catch (error) {
    logger.error('Error fetching franchises:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

app.post('/api/franchises', async (req: Request, res: Response) => {
  try {
    const validatedData = createFranchiseSchema.parse(req.body);
    const franchiseId = uuidv4();
    const franchise = await Franchise.create({
      franchiseId,
      name: validatedData.name,
      owner: validatedData.owner,
      location: validatedData.location || '',
      type: validatedData.type || '',
      status: 'active',
      revenue: 0
    });
    logger.info({ action: 'franchise_added', id: franchiseId, name: validatedData.name });
    res.status(201).json({ success: true, data: franchise });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    } else {
      logger.error('Error creating franchise:', error);
      res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } });
    }
  }
});

app.get('/api/franchises/:id', async (req: Request, res: Response) => {
  try {
    const franchise = await Franchise.findOne({ franchiseId: req.params.id });
    if (!franchise) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Franchise not found' } });
    }
    res.json({ success: true, data: franchise });
  } catch (error) {
    logger.error('Error fetching franchise:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

app.put('/api/franchises/:id', async (req: Request, res: Response) => {
  try {
    const franchise = await Franchise.findOneAndUpdate(
      { franchiseId: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!franchise) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Franchise not found' } });
    }
    res.json({ success: true, data: franchise });
  } catch (error) {
    logger.error('Error updating franchise:', error);
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR' } });
  }
});

app.delete('/api/franchises/:id', async (req: Request, res: Response) => {
  try {
    const result = await Franchise.deleteOne({ franchiseId: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Franchise not found' } });
    }
    logger.info({ action: 'franchise_deleted', id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting franchise:', error);
    res.status(500).json({ success: false, error: { code: 'DELETE_ERROR' } });
  }
});

// ============================================
// PERFORMANCE ROUTES
// ============================================

app.get('/api/performances', async (req: Request, res: Response) => {
  try {
    const { franchiseId } = req.query;
    const filter = franchiseId ? { franchiseId: franchiseId as string } : {};
    const performances = await Performance.find(filter);
    res.json({ success: true, data: performances, count: performances.length });
  } catch (error) {
    logger.error('Error fetching performances:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

app.post('/api/performances', async (req: Request, res: Response) => {
  try {
    const validatedData = createPerformanceSchema.parse(req.body);
    const performanceId = uuidv4();
    const performance = await Performance.create({
      performanceId,
      franchiseId: validatedData.franchiseId,
      period: validatedData.period,
      revenue: validatedData.revenue || 0,
      expenses: validatedData.expenses || 0,
      profit: (validatedData.revenue || 0) - (validatedData.expenses || 0),
      customers: validatedData.customers || 0,
      rating: validatedData.rating || 4.0
    });
    logger.info({ action: 'performance_recorded', id: performanceId, franchiseId: validatedData.franchiseId });
    res.status(201).json({ success: true, data: performance });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    } else {
      logger.error('Error recording performance:', error);
      res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } });
    }
  }
});

app.get('/api/franchises/:id/performance', async (req: Request, res: Response) => {
  try {
    const performances = await Performance.find({ franchiseId: req.params.id }).sort({ createdAt: -1 });
    const totalRevenue = performances.reduce((sum, p) => sum + p.revenue, 0);
    const totalProfit = performances.reduce((sum, p) => sum + p.profit, 0);
    const avgRating = performances.length > 0
      ? performances.reduce((sum, p) => sum + p.rating, 0) / performances.length
      : 0;

    res.json({
      success: true,
      data: {
        franchiseId: req.params.id,
        totalRevenue,
        totalProfit,
        avgRating: Math.round(avgRating * 10) / 10,
        periods: performances.length,
        history: performances
      }
    });
  } catch (error) {
    logger.error('Error fetching franchise performance:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

// ============================================
// STANDARDS ROUTES
// ============================================

app.get('/api/standards', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const filter = category ? { category: category as string } : {};
    const standards = await Standard.find(filter);
    res.json({ success: true, data: standards, count: standards.length });
  } catch (error) {
    logger.error('Error fetching standards:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

app.post('/api/standards', async (req: Request, res: Response) => {
  try {
    const validatedData = createStandardSchema.parse(req.body);
    const standardId = uuidv4();
    const standard = await Standard.create({
      standardId,
      name: validatedData.name,
      category: validatedData.category,
      description: validatedData.description || '',
      required: validatedData.required || false
    });
    logger.info({ action: 'standard_created', id: standardId, name: validatedData.name });
    res.status(201).json({ success: true, data: standard });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    } else {
      logger.error('Error creating standard:', error);
      res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } });
    }
  }
});

// ============================================
// STATISTICS ROUTE
// ============================================

app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const totalFranchises = await Franchise.countDocuments();
    const activeFranchises = await Franchise.countDocuments({ status: 'active' });
    const totalRevenue = await Franchise.aggregate([
      { $group: { _id: null, total: { $sum: '$revenue' } } }
    ]);

    const topPerformers = await Performance.aggregate([
      { $group: { _id: '$franchiseId', totalProfit: { $sum: '$profit' } } },
      { $sort: { totalProfit: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        totalFranchises,
        activeFranchises,
        totalRevenue: totalRevenue[0]?.total || 0,
        topPerformers: topPerformers.map(p => ({ franchiseId: p._id, totalProfit: p.totalProfit }))
      }
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: { code: 'STATS_ERROR' } });
  }
});

// ============================================
// ROOT ENDPOINT
// ============================================

// ============================================
// EXPERTOS - Professional AI Twin for Franchise Owners
// ============================================

import { registerExpertOS } from '../../../hojai-expert-os/src/expertOS-integration';

const expertOSRouter = registerExpertOS('franchise-ai');
app.use('/api/expert-os', expertOSRouter);

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Franchise AI',
    description: 'Franchise Management AI Operating System',
    version: '1.0.0',
    port: config.port,
    endpoints: {
      health: '/health',
      franchises: '/api/franchises',
      performances: '/api/performances',
      standards: '/api/standards',
      stats: '/api/stats'
    },
    features: {
      aiEmployees: ['Performance Analyzer', 'Standards Manager', 'Revenue Tracker', 'ExpertOS'],
      capabilities: ['Franchise Management', 'Performance Tracking', 'Standards Management']
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
      logger.info(`Franchise AI started on port ${config.port}`, { port: config.port, env: config.nodeEnv });
      console.log(`\nFranchise AI running on port ${config.port}\n`);
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