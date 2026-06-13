import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { twinRoutes, upsellRoutes } from './routes';
import { errorHandler } from './middleware';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 8448;

// ============ SECURITY MIDDLEWARE ============

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
});
app.use(limiter);

// ============ BODY PARSING ============

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============ COMPRESSION ============

app.use(compression());

// ============ HEALTH CHECK ============

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'upsell-engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    const mongoState = mongoose.connection.readyState;
    const mongoReady = mongoState === 1;

    if (mongoReady) {
      res.json({
        status: 'ready',
        service: 'upsell-engine',
        mongodb: 'connected',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        service: 'upsell-engine',
        mongodb: mongoState === 0 ? 'disconnected' : 'connecting',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      service: 'upsell-engine',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// ============ API ROUTES ============

app.use('/api/twins', twinRoutes);
app.use('/api/upsell', upsellRoutes);

// ============ API DOCUMENTATION ============

app.get('/api', (_req: Request, res: Response) => {
  res.json({
    service: 'Upsell Engine',
    version: '1.0.0',
    description: 'Revenue optimization and pricing service for Hotel OS',
    endpoints: {
      twins: {
        'POST /api/twins/guest': 'Create guest twin',
        'GET /api/twins/guest/:id': 'Get guest twin',
        'PUT /api/twins/guest/:id/preferences': 'Update guest preferences',
        'POST /api/twins/room': 'Create room twin',
        'GET /api/twins/room/:id/status': 'Get room status',
        'PUT /api/twins/room/:id/status': 'Update room status',
        'POST /api/twins/property': 'Create property twin',
        'GET /api/twins/property/:id': 'Get property twin',
      },
      upsell: {
        'POST /api/upsell/check-eligibility': 'Check guest upsell eligibility',
        'POST /api/upsell/offers': 'Generate upsell offers',
        'GET /api/upsell/offers/:guest_id': 'Get active offers for guest',
        'POST /api/upsell/offers/:offer_id/respond': 'Respond to offer',
        'POST /api/upsell/offers/:offer_id/shown': 'Mark offer as shown',
      },
      pricing: {
        'POST /api/upsell/pricing/calculate': 'Calculate dynamic pricing',
        'POST /api/upsell/pricing/upgrade': 'Optimize upgrade pricing',
        'POST /api/upsell/pricing/bundle': 'Calculate bundle pricing',
      },
    },
  });
});

// ============ ERROR HANDLING ============

app.use(errorHandler);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// ============ DATABASE CONNECTION ============

const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/upsell-engine';

  try {
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB', { uri: mongoUri });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    process.exit(1);
  }
};

// ============ SERVER STARTUP ============

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      logger.info(`Upsell Engine started on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;