import express, { Express, Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import insightsRoutes from './routes/insights.routes';

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/insights', insightsRoutes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'rez-mind-fitness-service',
    version: '1.0.0',
    description: 'Fitness Mind AI Service - Member insights and recommendations',
    endpoints: {
      health: '/api/insights/health',
      workoutRecommendations: 'POST /api/insights/workouts/recommendations',
      classSuggestions: 'POST /api/insights/classes/suggestions',
      trainerMatching: 'POST /api/insights/trainers/match',
      engagementScore: 'POST /api/insights/engagement/score',
      churnPrediction: 'POST /api/insights/churn/predict',
      activityMetrics: 'POST /api/insights/activity/metrics',
      batchEngagement: 'POST /api/insights/batch/engagement',
      batchChurn: 'POST /api/insights/batch/churn'
    }
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Start server
const PORT = process.env.PORT || 4010;

const server = 

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-mind-fitness-service',
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
  logger.info(`Fitness Mind AI Service started on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/api/insights/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
