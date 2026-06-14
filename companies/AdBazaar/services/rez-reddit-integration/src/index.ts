import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import postsRoutes from './routes/posts.routes';
import commentsRoutes from './routes/comments.routes';
import subredditsRoutes from './routes/subreddits.routes';
import usersRoutes from './routes/users.routes';
import messagesRoutes from './routes/messages.routes';

const app: Express = express();
const PORT = process.env.PORT || 4786;

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.path}`, {
      requestId,
      status: res.statusCode,
      duration: `${duration}ms`,
      tenantId: req.headers['x-tenant-id'] || 'unknown',
    });
  });

  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-reddit-integration',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/auth', authRoutes);
app.use('/posts', postsRoutes);
app.use('/comments', commentsRoutes);
app.use('/subreddits', subredditsRoutes);
app.use('/users', usersRoutes);
app.use('/messages', messagesRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'REZ Reddit Integration Service',
    version: '1.0.0',
    description: 'Reddit API integration service for ReZ platform',
    endpoints: {
      health: 'GET /health',
      auth: {
        getAuthUrl: 'GET /auth/url',
        callback: 'GET /auth/callback',
        setToken: 'POST /auth/token',
        disconnect: 'DELETE /auth/disconnect',
        status: 'GET /auth/status',
      },
      posts: {
        create: 'POST /posts',
        get: 'GET /posts/:id',
        edit: 'PATCH /posts/:id',
        delete: 'DELETE /posts/:id',
        getComments: 'GET /posts/:id/comments',
        vote: 'POST /posts/:id/vote',
        save: 'POST /posts/:id/save',
      },
      comments: {
        create: 'POST /comments',
        delete: 'DELETE /comments/:id',
        vote: 'POST /comments/:id/vote',
      },
      subreddits: {
        list: 'GET /subreddits',
        search: 'GET /subreddits/search?q=query',
        get: 'GET /subreddits/:name',
        subscribe: 'POST /subreddits/:name/subscribe',
        unsubscribe: 'DELETE /subreddits/:name/subscribe',
      },
      users: {
        me: 'GET /users/me',
        karma: 'GET /users/me/karma',
        get: 'GET /users/:username',
      },
      messages: {
        inbox: 'GET /messages/inbox',
        unreadCount: 'GET /messages/unread/count',
      },
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
    },
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal server error occurred',
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
    },
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`REZ Reddit Integration Service started`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
  logger.info(Reddit Integration Service running on port ${PORT}`);
});

export default app;
