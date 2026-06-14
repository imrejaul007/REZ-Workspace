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
import tweetsRoutes from './routes/tweets.routes';
import mentionsRoutes from './routes/mentions.routes';
import analyticsRoutes from './routes/analytics.routes';
import scheduleRoutes from './routes/schedule.routes';
import searchRoutes from './routes/search.routes';
import usersRoutes from './routes/users.routes';
import bookmarksRoutes from './routes/bookmarks.routes';
import mediaRoutes from './routes/media.routes';

const app: Express = express();
const PORT = process.env.PORT || 4780;

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
    service: 'rez-twitter-integration',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/auth', authRoutes);
app.use('/tweets', tweetsRoutes);
app.use('/mentions', mentionsRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/schedule', scheduleRoutes);
app.use('/search', searchRoutes);
app.use('/users', usersRoutes);
app.use('/bookmarks', bookmarksRoutes);
app.use('/media', mediaRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'REZ Twitter Integration Service',
    version: '1.1.0',
    description: 'Twitter/X API v2 integration service for ReZ platform',
    endpoints: {
      health: 'GET /health',
      auth: {
        getAuthUrl: 'GET /auth/url',
        callback: 'GET /auth/callback',
        setToken: 'POST /auth/token',
        disconnect: 'DELETE /auth/disconnect',
        status: 'GET /auth/status',
      },
      tweets: {
        create: 'POST /tweets',
        createThread: 'POST /tweets/thread',
        get: 'GET /tweets/:id',
        delete: 'DELETE /tweets/:id',
        quote: 'POST /tweets/:id/quote',
        retweet: 'POST /tweets/:id/retweet',
        unretweet: 'DELETE /tweets/:id/retweet',
        like: 'POST /tweets/:id/like',
        unlike: 'DELETE /tweets/:id/like',
      },
      users: {
        me: 'GET /users/me',
        getById: 'GET /users/:id',
        followers: 'GET /users/:id/followers',
        following: 'GET /users/:id/following',
        follow: 'POST /users/:id/follow',
        unfollow: 'DELETE /users/:id/follow',
      },
      bookmarks: {
        list: 'GET /bookmarks',
        add: 'POST /bookmarks/:id',
        remove: 'DELETE /bookmarks/:id',
      },
      media: {
        upload: 'POST /media/upload',
      },
      mentions: {
        list: 'GET /mentions',
        replies: 'GET /mentions/replies/:tweetId',
      },
      analytics: {
        tweet: 'GET /analytics/tweet/:id',
        batch: 'POST /analytics/tweets/batch',
      },
      schedule: {
        create: 'POST /schedule',
        list: 'GET /schedule',
        cancel: 'DELETE /schedule/:id',
        get: 'GET /schedule/:id',
        update: 'PUT /schedule/:id',
      },
      search: {
        tweets: 'GET /search/tweets?q=query',
        users: 'GET /search/users?id=userId',
        me: 'GET /search/me',
        userTweets: 'GET /search/users/:id/tweets',
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
  logger.info(`REZ Twitter Integration Service started`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
  logger.info(Twitter Integration Service running on port ${PORT}`);
});

export default app;
