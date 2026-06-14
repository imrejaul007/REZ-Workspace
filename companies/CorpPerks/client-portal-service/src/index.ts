import { logger } from '../../shared/logger';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';

const app = express();
const PORT = process.env.PORT || 4726;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    error: 'Too many login attempts, please try again later',
  },
});
app.use('/api/auth/login', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'corpperks-client-portal-service',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/client', clientRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   CorpPerks Client Portal Service                          ║
║   ─────────────────────────────────────────────────────   ║
║                                                            ║
║   Status:  RUNNING                                         ║
║   Port:    ${PORT}                                          ║
║   Env:     ${process.env.NODE_ENV || 'development'}                                ║
║                                                            ║
║   Endpoints:                                              ║
║   • POST /api/auth/login                                  ║
║   • GET  /api/auth/verify                                 ║
║   • GET  /api/client/profile                              ║
║   • GET  /api/client/dashboard                            ║
║   • GET  /api/client/projects                            ║
║   • GET  /api/client/invoices                            ║
║   • GET  /api/client/messages                            ║
║   • POST /api/client/messages                            ║
║   • GET  /api/client/documents                           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
