/**
 * FLEETIQ - AI Routes
 * Routes for AI Agent endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate, schemas } from '../../middleware/validation';
import { asyncHandler } from '../../middleware/errorHandler';
import { aiAgentLimiter } from '../../middleware/rateLimiter';
import { optimizeDispatch, getDispatchOptions } from '../../services/dispatchService';
import { calculateRoute, estimateETA } from '../../services/routeService';
import { analyzeFleet, getFleetStatus, checkMaintenanceNeeds } from '../../services/fleetService';
import { coachDriver } from '../../services/driverService';
import { logger } from '../../utils/logger';

const router = Router();

// ============================================
// AI STATUS ENDPOINT
// ============================================

router.get('/status', (req: Request, res: Response) => {
  res.json({
    active: true,
    service: 'FLEETIQ AI',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    employees: {
      dispatch: {
        name: 'Dispatch Agent',
        status: 'active',
        capabilities: ['optimal_allocation', 'cost_optimization', 'vehicle_matching']
      },
      route: {
        name: 'Route Agent',
        status: 'active',
        capabilities: ['route_optimization', 'eta_calculation', 'traffic_awareness']
      },
      fleet: {
        name: 'Fleet Manager',
        status: 'active',
        capabilities: ['analytics', 'maintenance_tracking', 'performance_monitoring']
      },
      driver: {
        name: 'Driver Coach',
        status: 'active',
        capabilities: ['coaching', 'safety_tips', 'performance_review']
      }
    },
    metrics: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      requestsHandled: 0
    }
  });
});

// ============================================
// DISPATCH AI ENDPOINTS
// ============================================

/**
 * POST /api/ai/dispatch/optimize
 * Optimize dispatch allocation for a trip
 */
router.post(
  '/dispatch/optimize',
  authenticate,
  aiAgentLimiter,
  validate(schemas.dispatchOptimize, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Dispatch optimization request', {
      origin: req.body.origin,
      destination: req.body.destination,
      userId: (req as any).userId
    });

    const result = await optimizeDispatch(req.body);

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * GET /api/ai/dispatch/options
 * Get available dispatch options
 */
router.get(
  '/dispatch/options',
  authenticate,
  aiAgentLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { originLat, originLng, destLat, destLng, cargoWeight } = req.query;

    const options = await getDispatchOptions({
      origin: {
        lat: parseFloat(originLat as string) || 19.076,
        lng: parseFloat(originLng as string) || 72.877
      },
      destination: {
        lat: parseFloat(destLat as string) || 18.922,
        lng: parseFloat(destLng as string) || 72.833
      },
      cargoWeight: cargoWeight ? parseFloat(cargoWeight as string) : undefined
    });

    res.json({
      success: true,
      ...options,
      timestamp: new Date().toISOString()
    });
  })
);

// ============================================
// ROUTE AI ENDPOINTS
// ============================================

/**
 * POST /api/ai/route/calculate
 * Calculate optimal route
 */
router.post(
  '/route/calculate',
  authenticate,
  aiAgentLimiter,
  validate(schemas.routeCalculate, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Route calculation request', {
      stops: req.body.stops.length,
      optimize: req.body.optimize,
      userId: (req as any).userId
    });

    const result = await calculateRoute(req.body);

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * POST /api/ai/route/eta
 * Estimate time of arrival
 */
router.post(
  '/route/eta',
  authenticate,
  aiAgentLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { origin, destination, trafficFactor } = req.body;

    const eta = await estimateETA(origin, destination, trafficFactor || 1.0);

    res.json({
      success: true,
      origin,
      destination,
      eta: eta.eta.toISOString(),
      durationMinutes: eta.duration,
      distanceKm: eta.distance,
      timestamp: new Date().toISOString()
    });
  })
);

// ============================================
// FLEET AI ENDPOINTS
// ============================================

/**
 * POST /api/ai/fleet/analyze
 * Analyze fleet performance
 */
router.post(
  '/fleet/analyze',
  authenticate,
  aiAgentLimiter,
  validate(schemas.fleetAnalyze, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Fleet analysis request', {
      period: req.body.period,
      userId: (req as any).userId
    });

    const result = await analyzeFleet(req.body.period, req.body.metrics);

    res.json({
      success: true,
      ...result
    });
  })
);

/**
 * GET /api/ai/fleet/status
 * Get current fleet status
 */
router.get(
  '/fleet/status',
  authenticate,
  aiAgentLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const status = await getFleetStatus();

    res.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * POST /api/ai/fleet/maintenance
 * Check maintenance needs
 */
router.post(
  '/fleet/maintenance',
  authenticate,
  aiAgentLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { vehicleId } = req.body;

    if (!vehicleId) {
      res.status(400).json({
        success: false,
        error: 'Vehicle ID is required',
        code: 'MISSING_VEHICLE_ID'
      });
      return;
    }

    const result = await checkMaintenanceNeeds(vehicleId);

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  })
);

// ============================================
// DRIVER AI ENDPOINTS
// ============================================

/**
 * POST /api/ai/driver/coach
 * Coach driver based on situation
 */
router.post(
  '/driver/coach',
  authenticate,
  aiAgentLimiter,
  validate(schemas.driverCoach, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Driver coaching request', {
      driverId: req.body.driverId,
      situation: req.body.situation,
      userId: (req as any).userId
    });

    const result = await coachDriver({
      driverId: req.body.driverId,
      situation: req.body.situation,
      context: req.body.context
    });

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  })
);

export default router;