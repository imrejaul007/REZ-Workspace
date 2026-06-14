// ==========================================
// AI Agents Service - Main Entry Point
// Port: 4750
// ==========================================

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Import utilities and routes
import { logger } from './utils/logger';
import agentRoutes from './routes/agentRoutes';
import {
  requestIdMiddleware,
  requestLoggerMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
  securityHeadersMiddleware,
  errorHandlerMiddleware,
} from './middleware';

// ==========================================
// App Configuration
// ==========================================

const app: Express = express();
const PORT = process.env.PORT || 4750;

// Create logs directory
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ==========================================
// Middleware Stack
// ==========================================

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
}));

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:19006',
    'http://localhost:8081',
    'exp://localhost:19000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-User-ID', 'X-Internal-Token'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID and logging
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
app.use(corsMiddleware);

// Rate limiting (100 requests per minute per IP)
app.use(rateLimitMiddleware(100, 60000));

// Security headers
app.use(securityHeadersMiddleware);

// ==========================================
// Health Check Endpoint
// ==========================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'ai-agents-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/ready', (req: Request, res: Response) => {
  // Add readiness checks (database, redis, etc.)
  res.json({
    status: 'ready',
    service: 'ai-agents-service',
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// API Routes
// ==========================================

// Mount agent routes
app.use('/api/agents', agentRoutes);

// Conversation routes (convenience aliases)
app.use('/api', agentRoutes);

// ==========================================
// API Documentation
// ==========================================

app.get('/api', (req: Request, res: Response) => {
  res.json({
    service: 'AI Agents Service',
    version: '1.0.0',
    description: 'AI Agents for MyTalent Employee Life OS',
    endpoints: {
      agents: {
        'GET /api/agents': 'List all available AI agents',
        'GET /api/agents/:id': 'Get agent details by ID',
        'GET /api/agents/:id/status': 'Get agent status',
        'POST /api/agents/:id/chat': 'Chat with a specific agent',
        'POST /api/agents/:id/configure': 'Configure agent for user',
        'GET /api/agents/:id/config': 'Get agent configuration',
      },
      conversations: {
        'GET /api/conversations': 'Get user conversations',
        'GET /api/conversations/me': 'Get current user conversations',
        'GET /api/conversations/:id': 'Get specific conversation',
        'DELETE /api/conversations/:id': 'Delete a conversation',
      },
      insights: {
        'GET /api/insights/daily': 'Get daily AI insights',
        'GET /api/insights/weekly': 'Get weekly digest',
      },
      health: {
        'GET /health': 'Health check',
        'GET /ready': 'Readiness check',
      },
    },
    agents: [
      { id: 'career-coach', name: 'Career Coach', description: 'Career planning & growth' },
      { id: 'productivity-advisor', name: 'Productivity Advisor', description: 'Time management & focus' },
      { id: 'learning-coach', name: 'Learning Coach', description: 'Skills & courses' },
      { id: 'financial-advisor', name: 'Financial Advisor', description: 'Money & investments' },
      { id: 'benefits-assistant', name: 'Benefits Assistant', description: 'Benefits & policies' },
      { id: 'hr-assistant', name: 'HR Assistant', description: 'Company info & HR' },
    ],
  });
});

// ==========================================
// Error Handling
// ==========================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Error handler
app.use(errorHandlerMiddleware);

// ==========================================
// Server Startup
// ==========================================

const server = app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║           AI Agents Service Started                      ║
╠═══════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                           ║
║  Version:  1.0.0                                        ║
║  Status:   ONLINE                                       ║
╠═══════════════════════════════════════════════════════════╣
║  Endpoints:                                             ║
║  - GET  /health                                        ║
║  - GET  /api/agents                                    ║
║  - POST /api/agents/:id/chat                           ║
║  - GET  /api/conversations                             ║
║  - GET  /api/insights/daily                            ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

export default app;
