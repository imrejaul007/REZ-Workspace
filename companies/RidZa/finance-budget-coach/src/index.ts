/**
 * AI Budget Coach - Budget planning, advice, and simulation
 * Production-ready Express server with MongoDB integration
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { requestId, requestLogger, logger } from './middleware/logging';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import budgetRoutes from './routes/budget';
import { verifyToken } from './integrations/rabtulClient';

// Initialize Express app
const app: Application = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many authentication attempts' },
});
app.use('/auth', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID and logging
app.use(requestId);
app.use(requestLogger);

// Health check endpoints (no auth required)
app.get('/health', async (_req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    status: 'healthy',
    service: 'finance-budget-coach',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dependencies: {
      mongodb: mongoStatus,
    },
  });
});

app.get('/health/live', (_req, res) => {
  res.json({ status: 'alive' });
});

app.get('/health/ready', async (_req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  
  if (!mongoReady) {
    res.status(503).json({
      status: 'not ready',
      reason: 'MongoDB not connected',
    });
    return;
  }
  
  res.json({ status: 'ready' });
});

// API info endpoint
app.get('/api', (_req, res) => {
  res.json({
    service: 'Finance Budget Coach',
    version: '1.0.0',
    description: 'AI-powered budget planning, advice, and scenario simulation',
    endpoints: {
      budgets: '/api/budgets/:tenantId',
      advice: '/api/budgets/:tenantId/advice',
      simulate: '/api/budgets/:tenantId/simulate',
      categories: '/api/budgets/categories',
      health: '/health',
    },
  });
});

// Mount budget routes
app.use('/api/budgets', budgetRoutes);

// Additional advice endpoint at root level
app.get('/api/advice/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { fiscalYear } = req.query;
    
    // Verify token if provided
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        await verifyToken(token);
      } catch {
        // Continue without auth - tenant ID from path is sufficient
      }
    }
    
    // Import and run analysis
    const { analyzeBudget } = await import('./services/budgetAnalysis');
    const analysis = await analyzeBudget(
      tenantId,
      fiscalYear ? parseInt(fiscalYear as string, 10) : undefined
    );
    
    res.json({
      advice: analysis.recommendations.map(rec => ({
        category: rec.category,
        title: rec.title,
        tip: rec.description,
        priority: rec.priority,
        actions: rec.actions,
      })),
      insights: analysis.insights,
      overallHealth: analysis.overallHealth,
    });
  } catch (error) {
    logger.error('Error generating advice', { error: (error as Error).message, tenantId: req.params.tenantId });
    res.status(500).json({ error: 'Failed to generate advice' });
  }
});

// Additional simulate endpoint at root level
app.post('/api/simulate/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { scenarios } = req.body;
    
    if (!scenarios || !Array.isArray(scenarios)) {
      res.status(400).json({ error: 'Scenarios array is required' });
      return;
    }
    
    // Verify token if provided
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        await verifyToken(token);
      } catch {
        // Continue without auth
      }
    }
    
    // Import and run simulation
    const { simulateScenario } = await import('./services/budgetAnalysis');
    const result = await simulateScenario(tenantId, scenarios);
    
    res.json({
      originalTotal: result.originalTotal,
      newTotal: result.newTotal,
      impact: result.impact,
      impactPercent: result.impactPercent.toFixed(2) + '%',
      recommendations: result.recommendations,
      warnings: result.warnings,
    });
  } catch (error) {
    logger.error('Error running simulation', { error: (error as Error).message, tenantId: req.params.tenantId });
    res.status(500).json({ error: 'Failed to run simulation' });
  }
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// MongoDB connection
async function connectToMongoDB(): Promise<void> {
  try {
    const mongoUri = config.mongodb.uri;
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: config.mongodb.options.maxPoolSize,
      serverSelectionTimeoutMS: config.mongodb.options.serverSelectionTimeoutMS,
      socketTimeoutMS: config.mongodb.options.socketTimeoutMS,
    });
    
    logger.info('Connected to MongoDB', { uri: mongoUri.replace(/\/\/.*@/, '//***@') });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
    throw error;
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Close MongoDB connection
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
  
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    
    // Start Express server
    const port = config.port;
    app.listen(port, () => {
      logger.info(`AI Budget Coach running on port ${port}`, {
        nodeEnv: config.nodeEnv,
        port,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

startServer();

export default app;
