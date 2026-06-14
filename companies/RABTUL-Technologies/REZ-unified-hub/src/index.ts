/**
 * REZ Unified Hub - Main Entry Point
 * Express server that orchestrates all REZ ecosystem services
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';

// Routes
import profileRoutes from './routes/profile';
import loyaltyRoutes from './routes/loyalty';
import commerceRoutes from './routes/commerce';
import hospitalityRoutes from './routes/hospitality';
import qrRoutes from './routes/qr';
import advertisingRoutes from './routes/advertising';
import employeeRoutes from './routes/employee';

// ============================================
// APP INITIALIZATION
// ============================================

const app = express();
const PORT = parseInt(process.env.PORT || '4600', 10);

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { success: false, error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'REZ Unified Hub',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/detailed', async (req: Request, res: Response) => {
  const checks = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  };

  res.json({
    status: 'healthy',
    service: 'REZ Unified Hub',
    version: '1.0.0',
    checks,
  });
});

// ============================================
// API ROUTES
// ============================================

// Profile routes
app.use('/api/v1/profile', profileRoutes);

// Loyalty routes
app.use('/api/v1/loyalty', loyaltyRoutes);

// Commerce routes
app.use('/api/v1/commerce', commerceRoutes);

// Hospitality routes
app.use('/api/v1/hospitality', hospitalityRoutes);

// QR routes
app.use('/api/v1/qr', qrRoutes);

// Advertising routes
app.use('/api/v1/ads', advertisingRoutes);

// Employee routes
app.use('/api/v1/employee', employeeRoutes);

// ============================================
// METRICS
// ============================================

app.get('/metrics', (req: Request, res: Response) => {
  const mem = process.memoryUsage();
  res.json({
    service: 'REZ Unified Hub',
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      rss: Math.round(mem.rss / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================
// SERVER START
// ============================================

app.listen(PORT, () => {
  logger.info(`🚀 REZ Unified Hub started on port ${PORT}`);
  logger.info(`📡 Health check: http://localhost:${PORT}/health`);
  logger.info(`📊 Metrics: http://localhost:${PORT}/metrics`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;
