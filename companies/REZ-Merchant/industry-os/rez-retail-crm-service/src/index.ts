import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { connectDatabase } from './config/database';
import { initRedis } from './config/redis';
import { logger } from './utils/logger';

import customerRoutes from './routes/customer.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4101;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-retail-crm-service',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/customers', customerRoutes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'REZ Retail CRM Service',
    version: '1.0.0',
    description: 'Customer Management for Retail',
    endpoints: {
      health: '/health',
      customers: '/api/customers',
    },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    await initRedis();

    app.listen(PORT, () => {
      logger.info(`REZ Retail CRM Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down...');
  process.exit(0);
});

startServer();

export default app;
