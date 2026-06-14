import express, { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { config } from './config';
import { logger } from './utils/logger';
import { getMetrics, getContentType } from './utils/metrics';
import { connectRedis, disconnectRedis } from './utils/redis';
import { internalServiceAuth, optionalAuth, requestLogger, errorHandler, notFoundHandler } from './middleware';
import {
  dashboardService,
  salesLiftService,
  performanceService,
  trendService,
  exportService,
} from './services';

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    success: true,
    service: 'retail-analytics-dashboard',
    version: '1.0.0',
    port: config.port,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: mongoStatus,
      redis: 'connected',
    },
  });
});

app.get('/metrics', optionalAuth, async (req: Request, res: Response) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', getContentType());
    res.send(metrics);
  } catch (error) {
    logger.error('Failed to get metrics', { error });
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

const apiRouter = Router();

apiRouter.use(internalServiceAuth);

apiRouter.get('/dashboard/overview', async (req: Request, res: Response) => {
  try {
    const { retailerId, startDate, endDate } = req.query;

    const dateRange = startDate && endDate
      ? { start: new Date(startDate as string), end: new Date(endDate as string) }
      : undefined;

    const overview = await dashboardService.getOverview({
      retailerId: retailerId as string,
      dateRange,
    });

    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get dashboard overview', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard overview',
    });
  }
});

apiRouter.get('/dashboard/campaigns', async (req: Request, res: Response) => {
  try {
    const { retailerId, status, limit } = req.query;

    const campaigns = await dashboardService.getCampaigns({
      retailerId: retailerId as string,
      status: status as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: campaigns,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get campaigns', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get campaigns',
    });
  }
});

apiRouter.get('/dashboard/retailers', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;

    const retailers = await dashboardService.getRetailers({
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: retailers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get retailers', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get retailers',
    });
  }
});

apiRouter.get('/sales-lift', async (req: Request, res: Response) => {
  try {
    const { retailerId, campaignId, category, startDate, endDate, limit } = req.query;

    const dateRange = startDate && endDate
      ? { start: new Date(startDate as string), end: new Date(endDate as string) }
      : undefined;

    const metrics = await salesLiftService.getMetrics({
      retailerId: retailerId as string,
      campaignId: campaignId as string,
      category: category as string,
      dateRange,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get sales lift metrics', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get sales lift metrics',
    });
  }
});

apiRouter.get('/sales-lift/by-retailer', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateRange = startDate && endDate
      ? { start: new Date(startDate as string), end: new Date(endDate as string) }
      : undefined;

    const byRetailer = await salesLiftService.getByRetailer(dateRange);

    res.json({
      success: true,
      data: byRetailer,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get sales lift by retailer', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get sales lift by retailer',
    });
  }
});

apiRouter.get('/sales-lift/by-category', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateRange = startDate && endDate
      ? { start: new Date(startDate as string), end: new Date(endDate as string) }
      : undefined;

    const byCategory = await salesLiftService.getByCategory(dateRange);

    res.json({
      success: true,
      data: byCategory,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get sales lift by category', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get sales lift by category',
    });
  }
});

apiRouter.get('/sales-lift/trends', async (req: Request, res: Response) => {
  try {
    const { campaignId, retailerId, period } = req.query;

    const trends = await salesLiftService.getTrends({
      campaignId: campaignId as string,
      retailerId: retailerId as string,
      period: (period as 'daily' | 'weekly' | 'monthly') || 'daily',
    });

    res.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get sales lift trends', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get sales lift trends',
    });
  }
});

apiRouter.get('/performance', async (req: Request, res: Response) => {
  try {
    const { retailerId, campaignId, metricType, source, startDate, endDate, granularity, limit } = req.query;

    const dateRange = startDate && endDate
      ? { start: new Date(startDate as string), end: new Date(endDate as string) }
      : undefined;

    const metrics = await performanceService.getMetrics({
      retailerId: retailerId as string,
      campaignId: campaignId as string,
      metricType: metricType as string,
      source: source as string,
      dateRange,
      granularity: granularity as 'hourly' | 'daily' | 'weekly' | 'monthly',
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get performance metrics', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get performance metrics',
    });
  }
});

apiRouter.get('/performance/by-source', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateRange = startDate && endDate
      ? { start: new Date(startDate as string), end: new Date(endDate as string) }
      : undefined;

    const bySource = await performanceService.getBySource(dateRange);

    res.json({
      success: true,
      data: bySource,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get performance by source', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get performance by source',
    });
  }
});

apiRouter.get('/performance/hourly/:retailerId', async (req: Request, res: Response) => {
  try {
    const { retailerId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
      return;
    }

    const hourly = await performanceService.getHourlyBreakdown(
      retailerId,
      { start: new Date(startDate as string), end: new Date(endDate as string) }
    );

    res.json({
      success: true,
      data: hourly,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get hourly breakdown', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get hourly breakdown',
    });
  }
});

apiRouter.get('/trends', async (req: Request, res: Response) => {
  try {
    const { retailerId, category, metricName, limit } = req.query;

    const trends = await trendService.getTrends({
      retailerId: retailerId as string,
      category: category as string,
      metricName: metricName as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get trends', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get trends',
    });
  }
});

apiRouter.get('/trends/forecast', async (req: Request, res: Response) => {
  try {
    const { metricName, retailerId, horizon } = req.query;

    if (!metricName) {
      res.status(400).json({
        success: false,
        error: 'metricName is required',
      });
      return;
    }

    const forecast = await trendService.getForecast({
      metricName: metricName as string,
      retailerId: retailerId as string,
      horizon: (parseInt(horizon as string, 10) as 7 | 14 | 30) || 7,
    });

    res.json({
      success: true,
      data: forecast,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get forecast', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get forecast',
    });
  }
});

apiRouter.get('/trends/seasonality', async (req: Request, res: Response) => {
  try {
    const { metricName, retailerId } = req.query;

    if (!metricName) {
      res.status(400).json({
        success: false,
        error: 'metricName is required',
      });
      return;
    }

    const seasonality = await trendService.getSeasonality({
      metricName: metricName as string,
      retailerId: retailerId as string,
    });

    res.json({
      success: true,
      data: seasonality,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get seasonality', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get seasonality',
    });
  }
});

apiRouter.get('/trends/anomalies', async (req: Request, res: Response) => {
  try {
    const { retailerId, metricName, limit } = req.query;

    const anomalies = await trendService.getAnomalies({
      retailerId: retailerId as string,
      metricName: metricName as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: anomalies,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get anomalies', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get anomalies',
    });
  }
});

apiRouter.get('/attribution', async (req: Request, res: Response) => {
  try {
    const { retailerId, campaignId, model, startDate, endDate } = req.query;

    const dateRange = startDate && endDate
      ? { start: new Date(startDate as string), end: new Date(endDate as string) }
      : undefined;

    res.json({
      success: true,
      data: {
        attribution: [],
        summary: {
          totalCampaigns: 0,
          averageAttributionAccuracy: 0,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get attribution', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get attribution',
    });
  }
});

apiRouter.get('/export', async (req: Request, res: Response) => {
  try {
    const { type, format, retailerId, campaignId, startDate, endDate } = req.query;

    if (!type || !format) {
      res.status(400).json({
        success: false,
        error: 'type and format are required',
      });
      return;
    }

    const dateRange = startDate && endDate
      ? { start: new Date(startDate as string), end: new Date(endDate as string) }
      : undefined;

    const result = await exportService.export({
      type: type as 'sales_lift' | 'performance' | 'trends' | 'attribution' | 'full',
      format: format as 'csv' | 'json' | 'xlsx' | 'pdf',
      retailerId: retailerId as string,
      campaignId: campaignId as string,
      dateRange,
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.setHeader('Content-Type', result.contentType!);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.send(result.data);
  } catch (error) {
    logger.error('Failed to export data', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to export data',
    });
  }
});

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    logger.info('Connecting to MongoDB...', { uri: config.mongodb.uri });
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('MongoDB connected successfully');

    logger.info('Connecting to Redis...', {
      host: config.redis.host,
      port: config.redis.port,
    });
    await connectRedis();
    logger.info('Redis connected successfully');

    app.listen(config.port, () => {
      logger.info(`Retail Analytics Dashboard started on port ${config.port}`, {
        port: config.port,
        nodeEnv: config.nodeEnv,
        version: '1.0.0',
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    await disconnectRedis();
    await mongoose.connection.close();
    logger.info('All connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

export default app;