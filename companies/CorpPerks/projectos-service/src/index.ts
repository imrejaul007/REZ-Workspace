import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDatabase, getConnectionStatus } from './config/database.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler, authMiddleware } from './middleware/index.js';
import {
  projectRoutes,
  taskRoutes,
  sprintRoutes,
  timeRoutes,
  analyticsRoutes
} from './routes/index.js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4715;

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Department-Id']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// =============================================================================
// ROUTES
// =============================================================================

// Health check (no auth)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'projectos-service',
    port: PORT,
    dbConnected: getConnectionStatus(),
    timestamp: new Date().toISOString()
  });
});

// API routes with authentication
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/sprints', authMiddleware, sprintRoutes);
app.use('/api/time', authMiddleware, timeRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

// Legacy routes (backward compatibility)
app.use('/api', authMiddleware, (req, res, next) => {
  if (req.path.startsWith('/projects')) {
    return projectRoutes(req, res, next);
  }
  if (req.path.startsWith('/tasks')) {
    return taskRoutes(req, res, next);
  }
  if (req.path.startsWith('/sprints')) {
    return sprintRoutes(req, res, next);
  }
  if (req.path.startsWith('/time')) {
    return timeRoutes(req, res, next);
  }
  next();
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.use(notFoundHandler);
app.use(errorHandler);

// =============================================================================
// SERVER STARTUP
// =============================================================================

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    app.listen(PORT, () => {
      logger.info(`ProjectOS Service started on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API Base: http://localhost:${PORT}/api`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
