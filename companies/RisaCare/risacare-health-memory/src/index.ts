import { logger } from '../../shared/logger';
/**
 * risacare-health-memory
 *
 * Health Memory Platform - The foundation for MyRisa Health Intelligence
 *
 * Following RTNM Doctrine:
 * CorpID → Memory → Knowledge Graph → Twin → Agent → Intelligence
 *
 * Port: 4801
 */

import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initializeDatabase } from './models/database.js';
import healthMemoryRoutes from './routes/healthMemoryRoutes.js';

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors({
  origin: config.security.corsOrigins,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
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

app.get('/health', (req, res) => {
  res.json({
    service: 'risacare-health-memory',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'risacare-health-memory',
    description: 'Health Memory Platform - The foundation for MyRisa Health Intelligence',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      health: '/health',
      person: '/api/health/person',
      reports: '/api/health/reports',
      medications: '/api/health/medications',
      symptoms: '/api/health/symptoms',
      conditions: '/api/health/conditions',
      appointments: '/api/health/appointments',
      allergies: '/api/health/allergies',
      menstrual: '/api/health/menstrual',
      pregnancy: '/api/health/pregnancy',
      fertility: '/api/health/fertility',
      family: '/api/health/family',
      lifeEvents: '/api/health/life-events',
      timeline: '/api/health/timeline',
      summary: '/api/health/summary'
    }
  });
});

// ============================================
// API ROUTES
// ============================================

app.use('/api/health', healthMemoryRoutes);

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// SERVER STARTUP
// ============================================

const startServer = async () => {
  try {
    // Initialize database
    logger.info('🔄 Initializing Health Memory Database...');
    await initializeDatabase();
    logger.info('✅ Database initialized');

    // Start server
    app.listen(config.service.port, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏥 risacare-health-memory                              ║
║                                                           ║
║   Health Memory Platform                                  ║
║   Foundation for MyRisa Health Intelligence               ║
║                                                           ║
║   Port: ${config.service.port}                                              ║
║   Env:  ${config.service.env}                                              ║
║                                                           ║
║   Following RTNM Doctrine:                                ║
║   CorpID → Memory → Knowledge → Twin → Agent → Intel     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();