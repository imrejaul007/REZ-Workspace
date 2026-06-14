import { Router, Request, Response } from 'express';
import bidRoutes from './bid.routes.js';
import dealRoutes from './deal.routes.js';
import seatRoutes from './seat.routes.js';
import floorRoutes from './floor.routes.js';
import { healthCheck } from '../services/database.js';
import { config } from '../config/index.js';

const router = Router();

// Mount route modules
router.use('/bid', bidRoutes);
router.use('/deals', dealRoutes);
router.use('/seats', seatRoutes);
router.use('/floors', floorRoutes);

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const dbHealth = await healthCheck();

    const overallStatus =
      dbHealth.mongodb.status === 'up' && dbHealth.redis.status === 'up'
        ? 'healthy'
        : dbHealth.mongodb.status === 'up' || dbHealth.redis.status === 'up'
        ? 'degraded'
        : 'unhealthy';

    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: dbHealth,
      openRtbVersion: config.openRtbVersion,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      error: 'Health check failed',
    });
  }
});

// Ready check endpoint
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const dbHealth = await healthCheck();

    if (dbHealth.mongodb.status === 'up' && dbHealth.redis.status === 'up') {
      res.json({
        ready: true,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString(),
        services: dbHealth,
      });
    }
  } catch (error) {
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
      error: 'Ready check failed',
    });
  }
});

// API info endpoint
router.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Programmatic TV Service',
    description: 'OpenRTB 2.6 interface for CTV programmatic buying',
    version: '1.0.0',
    endpoints: {
      bid: {
        'POST /api/bid': 'Process OpenRTB bid request',
        'POST /api/bid/batch': 'Process batch bid requests',
        'GET /api/bid/health': 'Bid service health check',
      },
      deals: {
        'GET /api/deals': 'List available deals',
        'POST /api/deals': 'Create private deal',
        'GET /api/deals/:id': 'Get deal details',
        'PUT /api/deals/:id': 'Update deal',
        'DELETE /api/deals/:id': 'Delete deal',
      },
      seats: {
        'GET /api/seats': 'List bidder seats',
        'POST /api/seats': 'Register bidder seat',
        'GET /api/seats/:id': 'Get seat details',
        'PUT /api/seats/:id': 'Update seat',
        'DELETE /api/seats/:id': 'Delete seat',
      },
      floors: {
        'GET /api/floors': 'List floor price rules',
        'POST /api/floors': 'Create floor rule',
        'GET /api/floors/:id': 'Get floor rule details',
        'PUT /api/floors/:id': 'Update floor rule',
        'DELETE /api/floors/:id': 'Delete floor rule',
        'GET /api/floors/calculate': 'Calculate floor price',
      },
    },
  });
});

export default router;