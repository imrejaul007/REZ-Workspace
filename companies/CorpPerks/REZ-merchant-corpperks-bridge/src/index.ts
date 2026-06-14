/**
 * REZ Merchant CorpPerks Bridge Service
 *
 * Express server that bridges CorpPerks employee benefits data
 * to the REZ ecosystem for People app integration
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import winston from 'winston';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { validateRequest } from './middleware/validation.middleware';
import { authenticateInternalService } from './middleware/auth.middleware';
import benefitsRoutes from './routes/benefitsRoutes';

// Load environment variables
dotenv.config();

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-merchant-corpperks';

async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.warn('MongoDB connection failed, using mock data:', error);
  }
}

// Express app
const app = express();
const PORT = process.env.PORT || 4008;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
}));

// Compression and parsing
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests' },
});
app.use('/api/', limiter);

// Health check (no auth required)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'REZ Merchant CorpPerks Bridge',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// API info (no auth required)
app.get('/api', (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'REZ Merchant CorpPerks Bridge',
    version: '1.0.0',
    description: 'Bridges CorpPerks employee benefits to REZ ecosystem',
    endpoints: {
      benefits: {
        'GET /api/benefits/employee/:employeeId': 'Get employee benefits',
        'GET /api/benefits/summary/:employeeId': 'Get benefits summary',
      },
      offers: {
        'GET /api/offers': 'Get all partner offers',
        'POST /api/offers/claim': 'Claim an offer',
        'GET /api/offers/category/:category': 'Get offers by category',
      },
    },
  });
});

// Internal API routes (protected by internal token)
app.use('/api/benefits', benefitsRoutes);
app.use('/api/offers', benefitsRoutes);

// Public routes for People app (simplified auth for mobile)
app.get('/api/v1/benefits/employee/:employeeId', benefitsRoutes);
app.get('/api/v1/offers', benefitsRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  // Try to connect to MongoDB
  await connectDatabase();

  app.listen(PORT, () => {
    logger.info(`REZ Merchant CorpPerks Bridge running on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`API docs: http://localhost:${PORT}/api`);
  });
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
