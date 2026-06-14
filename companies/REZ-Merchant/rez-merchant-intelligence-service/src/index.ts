import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import mongoose from 'mongoose';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { initSentry } from './config/sentry';
import config from './config';
import routes from './routes';
import { errorHandler, notFoundHandler, requestLogger, validationErrorHandler } from './middleware';
import { logger } from './utils/logger';

// Initialize Sentry
initSentry();

// Create Express app
const app: Application = express();

// Trust proxy (for load balancers)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Request ID middleware
app.use((req, res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || generateRequestId();
  res.setHeader('X-Request-ID', req.headers['x-request-id']);
  next();
});

// Request logging middleware
app.use(requestLogger);

// Swagger documentation
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Merchant Intelligence Service API',
      version: '1.0.0',
      description: 'API for merchant intelligence, analytics, and insights',
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Profile', description: 'Merchant profile endpoints' },
      { name: 'Insights', description: 'Merchant insights endpoints' },
      { name: 'Recommendations', description: 'Merchant recommendations endpoints' },
      { name: 'Competitors', description: 'Competitor analysis endpoints' },
      { name: 'Health', description: 'Health score endpoints' },
      { name: 'Events', description: 'Event capture endpoints' },
      { name: 'Trends', description: 'Trend analysis endpoints' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Merchant Intelligence API Docs',
}));

// API routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Merchant Intelligence Service',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/api/v1/health',
  });
});

// Validation error handler
app.use(validationErrorHandler);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

/**
 * Generate unique request ID
 * FIX (security): Replaced Math.random() with crypto.randomUUID()
 */
function generateRequestId(): string {
  try {
    const { randomUUID } = require('crypto');
    return `${Date.now()}-${randomUUID().replace(/-/g, '')}`;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

/**
 * Connect to MongoDB
 */
async function connectToMongoDB(): Promise<void> {
  try {
    const mongoUri = `${config.mongodb.uri}/${config.mongodb.db}`;

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('Connected to MongoDB', { database: config.mongodb.db });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error);
    throw error;
  }
}

/**
 * Start server
 */
async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectToMongoDB();

    // Start listening
    

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-merchant-intelligence-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
app.listen(config.port, () => {
      logger.info(`Merchant Intelligence Service started`, {
        port: config.port,
        environment: config.nodeEnv,
        mongodb: config.mongodb.db,
        docs: `http://localhost:${config.port}/api-docs`,
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function gracefulShutdown(): Promise<void> {
  logger.info('Received shutdown signal, closing connections...');

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
