import { logger } from '../../shared/logger';
import express from 'express';
import consultationCopilotRoutes from './routes/consultationCopilotRoutes.js';

const app = express();
const PORT = 4825;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  logger.info(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// CORS headers (for development)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.use('/', consultationCopilotRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'MyRisa Consultation Copilot',
      version: '1.0.0',
      description: 'Pre/Post Visit Intelligence for Medical Consultations',
      endpoints: {
        health: 'GET /health',
        consultations: {
          schedule: 'POST /api/consultations',
          upcoming: 'GET /api/consultations/upcoming',
          history: 'GET /api/consultations/history',
          cancel: 'POST /api/consultations/:consultationId/cancel',
          brief: 'GET /api/consultations/:consultationId/brief',
          preVisit: {
            generate: 'POST /api/consultations/:consultationId/pre-visit',
            get: 'GET /api/consultations/:consultationId/pre-visit',
          },
          postVisit: {
            record: 'POST /api/consultations/:consultationId/post-visit',
            get: 'GET /api/consultations/:consultationId/post-visit',
          },
          questions: {
            generate: 'POST /api/consultations/:consultationId/questions',
            list: 'GET /api/consultations/:consultationId/questions',
          },
          followUps: {
            create: 'POST /api/consultations/:consultationId/follow-ups',
            list: 'GET /api/consultations/:consultationId/follow-ups',
          },
        },
        followUps: {
          list: 'GET /api/follow-ups',
          update: 'PATCH /api/follow-ups/:taskId',
        },
        questions: {
          update: 'PATCH /api/questions/:questionId',
        },
      },
    },
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`[ERROR] ${err.message}`);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Start server


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'myrisa-consultation-copilot',
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
╔═══════════════════════════════════════════════════════════╗
║         MyRisa Consultation Copilot Service               ║
╠═══════════════════════════════════════════════════════════╣
║  Status:  RUNNING                                          ║
║  Port:    ${PORT}                                           ║
║  Health:  http://localhost:${PORT}/health                   ║
║  API:     http://localhost:${PORT}/api                      ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
