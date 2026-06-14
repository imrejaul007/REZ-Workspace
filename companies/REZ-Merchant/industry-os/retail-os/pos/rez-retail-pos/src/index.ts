import express, { Application, Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import salesRoutes from './routes/sales';
import receiptsRoutes from './routes/receipts';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4020;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_retail_pos';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.get('/api/pos/health', (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status: 'ok',
    service: 'rez-retail-pos',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mongodb: mongoStatus,
    uptime: process.uptime()
  });
});

app.use('/api/pos/sales', salesRoutes);
app.use('/api/pos/receipts', receiptsRoutes);

app.get('/api/pos', (req: Request, res: Response) => {
  res.json({
    service: 'Retail POS Service',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/pos/health',
      sales: {
        create: 'POST /api/pos/sales',
        list: 'GET /api/pos/sales',
        get: 'GET /api/pos/sales/:id',
        pay: 'POST /api/pos/sales/:id/pay',
        void: 'POST /api/pos/sales/:id/void',
        return: 'POST /api/pos/sales/:id/return'
      },
      receipts: {
        get: 'GET /api/pos/receipts/:id',
        invoice: 'GET /api/pos/receipts/:id/invoice',
        bySaleId: 'GET /api/pos/receipts/sale/:saleId'
      }
    }
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

async function connectDatabase(): Promise<void> {
  try {
    logger.info('Connecting to MongoDB...');
    console.log('URI:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    logger.warn('Server will start but database operations will fail');
  }
}

async function startServer(): Promise<void> {
  await connectDatabase();

  

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-retail-pos',
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
app.listen(PORT, () => {
    console.log('='.repeat(50));
    logger.info('Retail POS Service');
    console.log('='.repeat(50));
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/api/pos/health`);
    logger.info(`API docs: http://localhost:${PORT}/api/pos`);
    console.log('='.repeat(50));
  });
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
