import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import logger from './utils/logger';
import audienceRoutes from './routes/audienceRoutes';
import syncRoutes from './routes/syncRoutes';
import crossDeviceRoutes from './routes/crossDeviceRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4816;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    tenantId: req.headers['x-tenant-id'],
    userId: req.headers['x-user-id']
  });
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'REZ-audience-sync',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Stats endpoint
app.get('/api/v1/stats', (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string || 'default';
  const audienceService = require('./services/audienceService').default;
  const stats = audienceService.getStats(tenantId);
  res.json({ success: true, data: stats });
});

// API routes
app.use('/api/v1/audiences', audienceRoutes);
app.use('/api/v1/sync', syncRoutes);
app.use('/api/v1/cross-device', crossDeviceRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', { error: err instanceof Error ? err.message : String(err) });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`REZ-audience-sync service running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API: http://localhost:${PORT}/api/v1`);
});

export default app;
