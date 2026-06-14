import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import logger from './utils/logger';
import { FeedStorage } from './models/Storage';
import { FeedParserService } from './services/FeedParser';
import { SyndicationService } from './services/SyndicationService';
import { SchedulerService } from './services/SchedulerService';
import { createFeedRoutes } from './routes/feedRoutes';
import { createContentRoutes } from './routes/contentRoutes';
import { createSystemRoutes } from './routes/systemRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4760;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    tenantId: req.headers['x-tenant-id'],
    userId: req.headers['x-user-id']
  });
  next();
});

// Initialize services
const storage = new FeedStorage();
const parser = new FeedParserService(storage);
const syndication = new SyndicationService(storage);
const scheduler = new SchedulerService(storage, parser, syndication);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'REZ-content-syndication',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: [
      'RSS/Atom feed parsing',
      'Auto-post to platforms',
      'Content transformation',
      'Scheduling with cron'
    ]
  });
});

// API info
app.get('/api', (req: Request, res: Response) => {
  res.json({
    service: 'REZ-content-syndication',
    version: '1.0.0',
    endpoints: {
      feeds: {
        'GET /api/v1/feeds': 'List all feeds',
        'GET /api/v1/feeds/:id': 'Get feed details',
        'POST /api/v1/feeds': 'Create new feed',
        'PATCH /api/v1/feeds/:id': 'Update feed',
        'DELETE /api/v1/feeds/:id': 'Delete feed',
        'POST /api/v1/feeds/:id/fetch': 'Fetch feed now',
        'POST /api/v1/feeds/:id/post': 'Post all unposted items',
        'POST /api/v1/feeds/:id/retry': 'Retry failed posts',
        'GET /api/v1/feeds/:id/items': 'Get feed content items',
        'POST /api/v1/feeds/validate': 'Validate feed URL'
      },
      content: {
        'GET /api/v1/content': 'List all content items',
        'GET /api/v1/content/:id': 'Get single item',
        'POST /api/v1/content/:id/preview': 'Preview transformed content',
        'GET /api/v1/content/stats/overview': 'Get content statistics'
      },
      system: {
        'POST /api/v1/system/feeds/check': 'Trigger feed check',
        'POST /api/v1/system/feeds/syndicate': 'Trigger syndication',
        'GET /api/v1/system/scheduler/status': 'Get scheduler status',
        'POST /api/v1/system/scheduler/interval': 'Update check interval'
      }
    }
  });
});

// API routes
app.use('/api/v1/feeds', createFeedRoutes(storage, parser, syndication, scheduler));
app.use('/api/v1/content', createContentRoutes(storage));
app.use('/api/v1/system', createSystemRoutes(scheduler, parser, syndication));

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', { error: err instanceof Error ? err.message : String(err) });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`REZ-content-syndication service running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API docs: http://localhost:${PORT}/api`);

  // Start scheduler
  scheduler.start();
});

export default app;
