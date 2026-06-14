import { logger } from '../../shared/logger';
import express, { Request, Response, NextFunction } from 'express';
import relationshipsRoutes from './routes/relationshipsRoutes.js';

const app = express();
const PORT = 4823;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  logger.info(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'MyRisa Relationships Service',
    version: '1.0.0',
    description: 'Partner tracking, quality time, intimacy management',
    endpoints: {
      healthCheck: 'GET /health',
      relationships: {
        list: 'GET /api/relationships',
        get: 'GET /api/relationships/:id',
        create: 'POST /api/relationships',
        update: 'PUT /api/relationships/:id',
        delete: 'DELETE /api/relationships/:id'
      },
      interactions: {
        list: 'GET /api/relationships/:relationshipId/interactions',
        create: 'POST /api/relationships/:relationshipId/interactions'
      },
      healthScores: {
        user: 'GET /api/health',
        relationship: 'GET /api/relationships/:relationshipId/health'
      },
      goals: {
        list: 'GET /api/goals',
        create: 'POST /api/goals',
        updateProgress: 'PUT /api/goals/:id/progress'
      },
      insights: 'GET /api/insights'
    }
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'myrisa-relationships-service',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// API routes - must be after root but before 404 handler
app.use('/api', relationshipsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`MyRisa Relationships Service started on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API base: http://localhost:${PORT}/api`);
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
