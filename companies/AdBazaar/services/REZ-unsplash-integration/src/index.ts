import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { createLogger, LogLevel } from './utils/logger';
import photoRoutes from './routes/photo.routes';
import randomRoutes from './routes/random.routes';
import collectionRoutes from './routes/collection.routes';
import downloadRoutes from './routes/download.routes';

// Load environment variables
dotenv.config();

const logger = createLogger('REZ-UnsplashIntegration', LogLevel.INFO);
const app = express();
const PORT = process.env.PORT || 4797;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'REZ-UnsplashIntegration',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/photos', photoRoutes);
app.use('/api/photos', randomRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/downloads', downloadRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`REZ-UnsplashIntegration started on port ${PORT}`);
});

export default app;
