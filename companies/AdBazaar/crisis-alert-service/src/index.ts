/**
 * Crisis Alert Service - Main Entry Point
 * Real-time crisis detection and alerts for AdBazaar
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import config from './config';
import logger from './utils/logger';
import { crisisMetrics } from './utils/metrics';
import authMiddleware, { AuthRequest } from './middleware/auth';
import { alertsRouter } from './routes/alerts';
import { monitoringRouter } from './routes/monitoring';
import { playbooksRouter } from './routes/playbooks';
import { postMortemRouter } from './routes/postMortem';

const app: Express = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new SocketServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request timing middleware
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    crisisMetrics.recordRequestDuration(req.path, req.method, res.statusCode, duration);
    logger.httpRequest(req.method, req.path, res.statusCode, duration);
  });
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : 'disconnected';

  res.json({
    success: true,
    service: 'crisis-alert-service',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime: process.uptime(),
  });
});

// Metrics endpoint
app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', crisisMetrics.register.contentType);
    res.end(await crisisMetrics.register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// Apply auth middleware to API routes
app.use('/api', authMiddleware);

// API Routes
app.use('/api/alerts', alertsRouter);
app.use('/api/monitoring', monitoringRouter);
app.use('/api/playbooks', playbooksRouter);
app.use('/api/post-mortem', postMortemRouter);

// Daily digest endpoint
app.get('/api/digest', async (_req: Request, res: Response) => {
  try {
    const { AlertService } = await import('./services/alertService');
    const digest = await AlertService.getDailyDigest();
    res.json({ success: true, data: digest });
  } catch (error) {
    logger.error('Failed to generate digest', { error });
    res.status(500).json({ success: false, error: 'Failed to generate digest' });
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: AuthRequest, res: Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  // Join room for specific alert updates
  socket.on('subscribe:alerts', (severity?: string) => {
    if (severity) {
      socket.join(`alerts:${severity}`);
    } else {
      socket.join('alerts:all');
    }
    logger.info('Client subscribed to alerts', { socketId: socket.id, severity });
  });

  socket.on('subscribe:brand', (brandId: string) => {
    socket.join(`brand:${brandId}`);
    logger.info('Client subscribed to brand alerts', { socketId: socket.id, brandId });
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

// Export io for use in services
export { io };

// Database connection
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri);
    logger.info('Connected to MongoDB', { uri: config.mongodbUri });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

// Graceful shutdown
function setupGracefulShutdown(): void {
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

  signals.forEach((signal) => {
    process.on(signal, async () => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');

        httpServer.close(() => {
          logger.info('HTTP server closed');
          process.exit(0);
        });

        // Force exit after 10 seconds
        setTimeout(() => {
          logger.error('Forced shutdown after timeout');
          process.exit(1);
        }, 10000);
      } catch (error) {
        logger.error('Error during shutdown', { error });
        process.exit(1);
      }
    });
  });
}

// Start server
async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    setupGracefulShutdown();

    httpServer.listen(config.port, () => {
      logger.info(`Crisis Alert Service started`, {
        port: config.port,
        env: config.nodeEnv,
        url: `http://localhost:${config.port}`,
      });

      logger.info('Available endpoints:', {
        health: `http://localhost:${config.port}/health`,
        metrics: `http://localhost:${config.port}/metrics`,
        api: `http://localhost:${config.port}/api`,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the application
startServer();

export default app;
