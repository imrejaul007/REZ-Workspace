import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { redisService, adInsertionService } from '../services/index.js';
import { getMetrics, getContentType, updateStreamMetrics, updateAdBreakMetrics } from '../middleware/metrics.js';
import type { HealthStatus } from '../types/index.js';

const router = Router();

const startTime = Date.now();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const activeStreams = await adInsertionService.getActiveStreams();
    const activeAdBreaks = await adInsertionService.getActiveAdBreaksCount();

    updateStreamMetrics(activeStreams.length);
    updateAdBreakMetrics(activeAdBreaks);

    const mongoConnected = mongoose.connection.readyState === 1;
    const redisConnected = redisService.isHealthy();

    let status: HealthStatus['status'] = 'healthy';
    if (!mongoConnected || !redisConnected) {
      status = 'degraded';
    }

    const health: HealthStatus = {
      status,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      services: {
        mongodb: mongoConnected,
        redis: redisConnected,
      },
      metrics: {
        activeStreams: activeStreams.length,
        activeAdBreaks,
        requestsProcessed: 0,
      },
    };

    const statusCode = status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      success: true,
      data: health,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: error instanceof Error ? error.message : 'Health check failed',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

router.get('/live', async (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

router.get('/ready', async (_req: Request, res: Response) => {
  try {
    const mongoConnected = mongoose.connection.readyState === 1;
    const redisConnected = redisService.isHealthy();

    if (mongoConnected && redisConnected) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        services: {
          mongodb: mongoConnected,
          redis: redisConnected,
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Service unavailable',
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', getContentType());
    res.send(metrics);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_ERROR',
        message: 'Failed to get metrics',
      },
    });
  }
});

export default router;