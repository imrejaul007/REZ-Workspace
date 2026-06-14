import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import promClient from 'prom-client';
import { config } from './config';
import { logger } from 'utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware';
import { createInboxRouter, createTemplateRouter, createSettingsRouter } from './routes';
import {
  ConversationService,
  MessageService,
  TemplateService,
  SettingsService,
  PlatformConnectorService,
  SentimentService,
} from './services';

// Initialize Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Create Express app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.io server
const io = new SocketIOServer(httpServer, {
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

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;

  res.json({
    status: dbConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    mongodb: dbConnected ? 'connected' : 'disconnected',
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end();
  }
});

// Mount io on app for routes to use
app.set('io', io);

// Initialize services
const platformConnector = new PlatformConnectorService();
const conversationService = new ConversationService();
const messageService = new MessageService(platformConnector);
const templateService = new TemplateService();
const settingsService = new SettingsService();
const sentimentService = new SentimentService();

// Mount routes
app.use('/api/inbox', createInboxRouter(
  conversationService,
  messageService,
  sentimentService,
  settingsService,
  platformConnector
));
app.use('/api/templates', createTemplateRouter(templateService));
app.use('/api/settings', createSettingsRouter(settingsService));

// Socket.io connection handling
io.on('connection', (socket: Socket) => {
  logger.info('Socket connected', { socketId: socket.id });

  // Join account room
  socket.on('account:join', (accountId: string) => {
    socket.join(`account:${accountId}`);
    logger.info('Socket joined account room', { socketId: socket.id, accountId });
  });

  // Join conversation room
  socket.on('conversation:join', (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
    logger.info('Socket joined conversation room', { socketId: socket.id, conversationId });
  });

  // Leave rooms on disconnect
  socket.on('disconnect', () => {
    logger.info('Socket disconnected', { socketId: socket.id });
  });

  // Typing indicator
  socket.on('typing:start', (data: { conversationId: string; userId: string }) => {
    socket.to(`conversation:${data.conversationId}`).emit('typing:start', data);
  });

  socket.on('typing:stop', (data: { conversationId: string; userId: string }) => {
    socket.to(`conversation:${data.conversationId}`).emit('typing:stop', data);
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection
const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('MongoDB connected', { uri: config.mongodb.uri });
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
};

// Graceful shutdown
const shutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  // Close Socket.io connections
  io.close();

  // Close HTTP server
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  // Close MongoDB connection
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');

  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    httpServer.listen(config.port, () => {
      logger.info(`Server started`, {
        port: config.port,
        env: config.nodeEnv,
        socketPort: config.socket.port,
      });
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`Metrics: http://localhost:${config.port}/metrics`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();

export { app, io };
