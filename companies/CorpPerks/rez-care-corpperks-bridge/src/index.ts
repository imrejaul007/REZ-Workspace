import { logger } from '../../shared/logger';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { ticketRoutes, whatsappRoutes, analyticsRoutes } from './routes/index.js';
import { errorHandler, notFoundHandler, setupGlobalErrorHandlers } from './middleware/errorHandler.js';
import { connectDatabase, setupGracefulShutdown } from './config/database.js';

dotenv.config();

const app: Express = express();

app.use(helmet({ contentSecurityPolicy: false }));

const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Service-Name'],
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'rez-care-corpperks-bridge',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/ready', (_req: Request, res: Response) => {
  res.json({ success: true, status: 'ready', timestamp: new Date().toISOString() });
});

app.use('/api/support', ticketRoutes);
app.use('/api/support', whatsappRoutes);
app.use('/api/support', analyticsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '4722');

async function startServer() {
  try {
    await connectDatabase();
    setupGracefulShutdown();

    app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║         REZ-CARE-CORPPERKS-BRIDGE Started              ║
╠═══════════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                                   ║
║  Environment: ${process.env.NODE_ENV || 'development'}                                  ║
║                                                               ║
║  Routes:                                                      ║
║    Support Tickets:                                           ║
║      POST /api/support/tickets           - Create ticket     ║
║      GET  /api/support/tickets           - List tickets     ║
║      GET  /api/support/tickets/:id       - Get ticket       ║
║      PATCH /api/support/tickets/:id      - Update ticket    ║
║      POST /api/support/tickets/:id/comments - Add comment   ║
║      GET  /api/support/tickets/employee/:id - Employee tickets║
║      POST /api/support/tickets/:id/rate   - Rate satisfaction║
║                                                               ║
║    WhatsApp Support:                                         ║
║      POST /api/support/whatsapp         - Start session    ║
║      GET  /api/support/whatsapp/session - Get session      ║
║      POST /api/support/whatsapp/:id/messages - Send message ║
║      GET  /api/support/whatsapp/:id/messages - Get messages║
║      POST /api/support/whatsapp/:id/close - Close session  ║
║                                                               ║
║    Analytics:                                                ║
║      GET  /api/support/analytics/employee/:id - Employee stats║
║      GET  /api/support/analytics/company   - Company stats   ║
║      GET  /api/support/analytics/agents    - Agent metrics   ║
║      GET  /api/support/analytics/trends   - Support trends  ║
║                                                               ║
║  Health:                                                      ║
║    GET  /health                 - Health check              ║
║    GET  /ready                  - Readiness check           ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

setupGlobalErrorHandlers();
startServer();

export { app };
