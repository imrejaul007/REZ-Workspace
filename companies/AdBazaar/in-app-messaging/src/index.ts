import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import logger from './utils/logger';
import { register, httpRequestsTotal, httpRequestDuration } from './utils/metrics';
import { messageRoutes } from './routes';
import { messagingService } from './services';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});
const PORT = process.env.PORT || 5041;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.labels(req.method, req.path, res.statusCode.toString()).inc();
    httpRequestDuration.labels(req.method, req.path, res.statusCode.toString()).observe(duration);
  });
  next();
});

messagingService.setSocketIO(io);

io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  socket.on('join', (userId: string) => {
    socket.join(`user:${userId}`);
    logger.info(`User ${userId} joined their room`);
  });

  socket.on('join-conversation', (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
    logger.info(`Socket joined conversation ${conversationId}`);
  });

  socket.on('leave-conversation', (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('typing', (data: { conversationId: string; userId: string }) => {
    socket.to(`conversation:${data.conversationId}`).emit('user-typing', data);
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'in-app-messaging',
    timestamp: new Date().toISOString(),
  });
});

app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

app.use('/api', messageRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

async function startServer(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazaar_messaging';
    await mongoose.connect(mongoUri);
    logger.info('MongoDB connected');

    await messagingService.initialize();

    httpServer.listen(PORT, () => {
      logger.info(`In-app messaging service running on port ${PORT}`);
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  io.close();
  await messagingService.cleanup();
  await mongoose.disconnect();
  process.exit(0);
});

startServer();

export default app;