import express, { Express, Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import insightsRoutes from './routes/insights.routes';

// Initialize Express app
const app: Express = express();
const isProduction = process.env.NODE_ENV === 'production';

// CORS configuration - restrict origins in production
const corsOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [];
const allowedOrigins = isProduction ? corsOrigins : (corsOrigins.length > 0 ? corsOrigins : ['http://localhost:3000', 'http://localhost:8080']);

if (isProduction && corsOrigins.length === 0) {
  logger.error('[FATAL] CORS_ORIGIN must be set in production');
  process.exit(1);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// CORS headers - CRITICAL FIX: Never use '*' in production
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;

  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else if (!isProduction && !origin) {
    // Allow no-origin in development (curl, Postman)
    res.header('Access-Control-Allow-Origin', '*');
  } else if (!isProduction && origin?.includes('localhost')) {
    // Allow localhost in development
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Internal-Token');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API Routes
app.use('/api/insights', insightsRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'ReZ Mind Healthcare Service',
    version: '1.0.0',
    description: 'Healthcare Mind AI Service for smart recommendations',
    endpoints: {
      health: '/api/insights/health',
      symptomAnalysis: 'POST /api/insights/analyze-symptoms',
      riskFactors: 'POST /api/insights/risk-factors',
      treatments: 'POST /api/insights/treatments',
      riskScore: 'POST /api/insights/risk-score',
      insights: 'POST /api/insights/insights',
      appointmentReminders: 'POST /api/insights/appointment-reminders',
      healthTrends: 'POST /api/insights/health-trends',
      comprehensive: 'POST /api/insights/comprehensive'
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3008;
const HOST = process.env.HOST || '0.0.0.0';



// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-mind-healthcare-service',
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
app.listen(Number(PORT), HOST, () => {
  logger.info(`ReZ Mind Healthcare Service running on http://${HOST}:${PORT}`);
  logger.info(`Health check: http://${HOST}:${PORT}/api/insights/health`);
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
