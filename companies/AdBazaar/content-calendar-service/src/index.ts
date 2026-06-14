import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './utils/errors.js';
import { metricsMiddleware, getMetrics, getContentType } from './middleware/metrics.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { calendarRoutes, settingsRoutes } from './routes/index.js';
import { calendarEventsTotal } from './middleware/metrics.js';
import { CalendarEvent } from './models/index.js';

const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(metricsMiddleware);
app.use(rateLimitMiddleware);

app.get('/health', async (_req: Request, res: Response) => {
  try {
    const mongoStatus = (await import('mongoose')).default.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.json({
      success: true,
      data: {
        status: 'healthy',
        service: 'content-calendar-service',
        version: '1.0.0',
        port: config.port,
        uptime: process.uptime(),
        mongodb: mongoStatus,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        message: 'Service unhealthy',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    try {
      const eventCounts = await CalendarEvent.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      for (const { _id, count } of eventCounts) {
        calendarEventsTotal.labels(_id).set(count);
      }
    } catch {
      logger.warn('Failed to update event metrics');
    }

    res.setHeader('Content-Type', getContentType());
    res.send(await getMetrics());
  } catch (error) {
    logger.error('Metrics endpoint error', { error });
    res.status(500).send('Failed to collect metrics');
  }
});

app.use('/api/calendar', calendarRoutes);
app.use('/api/calendar/settings', settingsRoutes);

app.get('/api', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      service: 'content-calendar-service',
      version: '1.0.0',
      endpoints: {
        health: 'GET /health',
        metrics: 'GET /metrics',
        calendar: {
          month: 'GET /api/calendar',
          week: 'GET /api/calendar/week',
          day: 'GET /api/calendar/day',
          createEvent: 'POST /api/calendar/events',
          updateEvent: 'PATCH /api/calendar/events/:id',
          deleteEvent: 'DELETE /api/calendar/events/:id',
          getEvent: 'GET /api/calendar/events/:id',
          bulkMove: 'POST /api/calendar/bulk-move',
          conflicts: 'GET /api/calendar/conflicts',
          export: 'GET /api/calendar/export',
          import: 'POST /api/calendar/import',
          stats: 'GET /api/calendar/stats',
          suggestions: 'GET /api/calendar/suggestions',
        },
        settings: {
          get: 'GET /api/calendar/settings',
          update: 'PATCH /api/calendar/settings',
          blackoutDates: 'POST /api/calendar/settings/blackout-dates',
          platformColors: 'PATCH /api/calendar/settings/platform-colors/:platform',
          reset: 'POST /api/calendar/settings/reset',
        },
      },
    },
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint not found',
      statusCode: 404,
    },
  });
});

app.use(errorHandler);

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(config.port, () => {
      logger.info(`Content Calendar Service started`, {
        port: config.port,
        nodeEnv: config.nodeEnv,
        mongodb: config.mongodb.uri,
      });
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`Metrics: http://localhost:${config.port}/metrics`);
      logger.info(`API docs: http://localhost:${config.port}/api`);
    });

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();

export { app };
