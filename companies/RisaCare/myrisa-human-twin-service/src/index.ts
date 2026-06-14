import { logger } from '../../shared/logger';
import express, { Express, Request, Response, NextFunction } from 'express';
import humanTwinRoutes from './routes/humanTwinRoutes.js';

const app: Express = express();
const PORT = 4824;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// CORS headers for development
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// API Routes
app.use('/api/v1', humanTwinRoutes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'MyRisa Human Twin Service',
    version: '1.0.0',
    description: 'Unified Human Twin - Physical Health, Mental Wellness, Sexual Wellness, Lifestyle, Work-Life, Family, Relationship',
    port: PORT,
    endpoints: {
      health: 'GET /api/v1/health',
      twin: 'GET /api/v1/twin/:userId',
      domains: 'GET /api/v1/twin/:userId/domains',
      domainScore: 'GET /api/v1/twin/:userId/domain/:domain',
      updateDomain: 'PUT /api/v1/twin/:userId/domain/:domain',
      insights: 'GET /api/v1/twin/:userId/insights',
      predictions: 'GET /api/v1/twin/:userId/predictions',
      score: 'GET /api/v1/twin/:userId/score',
      timeline: 'GET /api/v1/twin/:userId/timeline',
      clearCache: 'DELETE /api/v1/twin/:userId/cache',
    },
    domains: [
      'physical_health',
      'mental_wellness',
      'sexual_wellness',
      'lifestyle',
      'work_life',
      'family',
      'relationship',
    ],
    sourceServices: {
      womensHealth: 4820,
      sexualWellness: 4821,
      workLife: 4822,
      wellness: 4703,
      mentalHealth: 4722,
      sleep: 4729,
    },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString(),
  });
});

// Start server


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'myrisa-human-twin-service',
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
  logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   MyRisa Human Twin Service                                   ║
║   ───────────────────────────────────────────────────────── ║
║                                                               ║
║   Port: ${PORT}                                              ║
║   Status: Running ║
║                                                               ║
║   Endpoints:                                                  ║
║   • GET  /api/v1/health              - Health check           ║
║   • GET  /api/v1/twin/:userId        - Get complete twin ║
║   • GET  /api/v1/twin/:userId/domains    - All domain scores  ║
║   • GET  /api/v1/twin/:userId/domain/:domain  - Single domain ║
║   • PUT  /api/v1/twin/:userId/domain/:domain  - Update score  ║
║   • GET  /api/v1/twin/:userId/insights  - Cross-domain AI    ║
║   • GET  /api/v1/twin/:userId/predictions - Health predictions║
║   • GET  /api/v1/twin/:userId/score  - Overall score ║
║   • GET  /api/v1/twin/:userId/timeline - Life events          ║
║   • DELETE /api/v1/twin/:userId/cache - Clear cache          ║
║                                                               ║
║   Source Services:                                            ║
║   • Women's Health (4820)                                     ║
║   • Sexual Wellness (4821)                                    ║
║   • Work-Life (4822)                                          ║
║   • Wellness (4703)                                           ║
║   • Mental Health (4722)                                      ║
║   • Sleep (4729)                                               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

export default app;