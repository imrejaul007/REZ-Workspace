import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import analyticsRoutes from './routes/analytics.routes';
import metricsRoutes from './routes/metrics.routes';
import reportsRoutes from './routes/reports.routes';
import trendsRoutes from './routes/trends.routes';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = createLogger('Server');

// Create Express app
const app: Application = express();
const PORT = process.env.PORT || 4801;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.logApiRequest(req.path, req.method, duration, res.statusCode);
  });

  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'REZ-cross-analytics',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API info endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'REZ Cross-Platform Analytics Service',
    version: '1.0.0',
    description: 'Unified analytics service for cross-platform social media metrics',
    endpoints: {
      analytics: {
        'GET /api/analytics/summary': 'Get cross-platform analytics summary',
        'GET /api/analytics/dashboard': 'Get full dashboard data',
        'GET /api/analytics/engagement': 'Get engagement metrics',
        'GET /api/analytics/roi': 'Get ROI metrics',
        'GET /api/analytics/compare': 'Compare current period with previous',
        'GET /api/analytics/rankings': 'Get content performance rankings',
      },
      metrics: {
        'GET /api/metrics': 'Get unified metrics from all platforms',
        'GET /api/metrics/platform/:platform': 'Get metrics from specific platform',
        'GET /api/metrics/aggregated': 'Get aggregated metrics by platform',
        'GET /api/metrics/timeseries': 'Get time-series metrics for charts',
        'GET /api/metrics/top': 'Get top performing content',
      },
      reports: {
        'POST /api/reports': 'Generate a new report',
        'GET /api/reports': 'List all reports',
        'GET /api/reports/:id': 'Get specific report',
        'POST /api/reports/:id/export': 'Export report (csv, pdf, json)',
        'DELETE /api/reports/:id': 'Delete a report',
        'GET /api/reports/templates/summary': 'Get summary report template',
        'GET /api/reports/templates/roi': 'Get ROI report template',
      },
      trends: {
        'GET /api/trends': 'Get trend analysis data',
        'GET /api/trends/platform/:platform': 'Get trend data for specific platform',
        'GET /api/trends/growth': 'Get growth rate analysis',
        'GET /api/trends/compare': 'Compare trends across platforms',
        'GET /api/trends/forecast': 'Get trend forecasting',
      },
    },
    platforms: ['twitter', 'instagram', 'linkedin', 'tiktok', 'facebook', 'youtube'],
    queryParameters: {
      start: 'Start date (ISO 8601 format)',
      end: 'End date (ISO 8601 format)',
      platforms: 'Comma-separated list of platforms',
      granularity: 'hour, day, week, month',
      metric: 'impressions, engagements, likes, comments, shares',
    },
  });
});

// API Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/trends', trendsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err instanceof Error ? err.message : String(err) });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`REZ Cross-Analytics Service started on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API info: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
