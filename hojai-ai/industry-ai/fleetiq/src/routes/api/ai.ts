/**
 * FLEETIQ - AI Agent Routes
 * AI-powered fleet management endpoints
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate, schemas } from '../../middleware/validation';
import { asyncHandler } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import { optimizeDispatch, getDispatchOptions } from '../../services/dispatchService';
import { calculateRoute, estimateETA } from '../../services/routeService';
import { analyzeFleet, getFleetStatus, checkMaintenanceNeeds, getDashboardData } from '../../services/fleetService';
import { coachDriver, getDriverPerformance } from '../../services/driverService';
import { fleetAIBrain } from '../../services/aiBrain';

const router = Router();

// ============================================
// AI STATUS
// ============================================

router.get(
  '/status',
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();

    res.json({
      success: true,
      status: {
        active: true,
        version: '1.0.0',
        uptime: process.uptime(),
        employees: [
          {
            name: 'Dispatch Agent',
            status: 'active',
            capabilities: [
              'vehicle_allocation',
              'order_prioritization',
              'capacity_optimization',
              'time_slot_matching'
            ],
            lastTask: null
          },
          {
            name: 'Route Optimizer',
            status: 'active',
            capabilities: [
              'multi_stop_optimization',
              'traffic_avoidance',
              'fuel_efficiency',
              'delivery_scheduling'
            ],
            lastTask: null
          },
          {
            name: 'Fleet Manager',
            status: 'active',
            capabilities: [
              'vehicle_monitoring',
              'maintenance_scheduling',
              'performance_tracking',
              'cost_analysis'
            ],
            lastTask: null
          },
          {
            name: 'Driver Coach',
            status: 'active',
            capabilities: [
              'navigation_assistance',
              'delivery_confirmation',
              'issue_reporting',
              'performance_review'
            ],
            lastTask: null
          }
        ]
      },
      responseTime: `${Date.now() - startTime}ms`
    });
  })
);

// ============================================
// DISPATCH OPTIMIZE
// ============================================

router.post(
  '/dispatch/optimize',
  authenticate,
  validate(schemas.dispatchOptimize, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { origin, destination, cargoWeight, urgency, preferences } = req.body;

    logger.info('Dispatch optimization requested', { origin, destination, cargoWeight, urgency });

    const result = await optimizeDispatch({
      origin,
      destination,
      cargoWeight,
      urgency,
      preferences
    });

    logger.info('Dispatch optimization completed', {
      vehicleId: result.allocation?.vehicle?._id,
      driverId: result.allocation?.driver?._id,
      duration: `${Date.now() - startTime}ms`
    });

    res.json({
      success: true,
      recommendation: result,
      metadata: {
        agent: 'Dispatch Agent',
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
  })
);

// ============================================
// ROUTE CALCULATE
// ============================================

router.post(
  '/route/calculate',
  authenticate,
  validate(schemas.routeCalculate, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { stops, optimize, preferences } = req.body;

    logger.info('Route calculation requested', { stopCount: stops.length });

    const result = await calculateRoute({
      stops,
      optimize,
      preferences
    });

    logger.info('Route calculation completed', {
      totalDistance: result.route?.totalDistance,
      totalDuration: result.route?.totalDuration,
      duration: `${Date.now() - startTime}ms`
    });

    res.json({
      success: true,
      route: result,
      metadata: {
        agent: 'Route Optimizer',
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
  })
);

// ============================================
// FLEET ANALYZE
// ============================================

router.post(
  '/fleet/analyze',
  authenticate,
  validate(schemas.fleetAnalyze, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { metrics, period } = req.body;

    logger.info('Fleet analysis requested', { metrics, period });

    const result = await analyzeFleet(
      period || 'week',
      metrics
    );

    logger.info('Fleet analysis completed', {
      totalVehicles: result.metrics.totalVehicles,
      alerts: result.alerts.length,
      duration: `${Date.now() - startTime}ms`
    });

    res.json({
      success: true,
      analysis: result,
      metadata: {
        agent: 'Fleet Manager',
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
  })
);

// ============================================
// DRIVER COACH
// ============================================

router.post(
  '/driver/coach',
  authenticate,
  validate(schemas.driverCoach, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { driverId, situation, context } = req.body;

    logger.info('Driver coaching requested', { driverId, situation });

    const result = await coachDriver({
      driverId,
      situation,
      context
    });

    logger.info('Driver coaching completed', {
      driverId,
      situation,
      success: result.success,
      duration: `${Date.now() - startTime}ms`
    });

    res.json({
      success: true,
      coaching: result,
      metadata: {
        agent: 'Driver Coach',
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
  })
);

// ============================================
// VEHICLE ASSIGNMENT SUGGESTION
// ============================================

router.post(
  '/dispatch/suggest',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { requirements } = req.body;

    const result = await getDispatchOptions({
      origin: requirements.origin || { lat: 0, lng: 0 },
      destination: requirements.destination || { lat: 0, lng: 0 },
      cargoWeight: requirements.cargoWeight
    });

    res.json({
      success: true,
      suggestions: result,
      metadata: {
        agent: 'Dispatch Agent',
        timestamp: new Date().toISOString()
      }
    });
  })
);

// ============================================
// MAINTENANCE PREDICTION
// ============================================

router.get(
  '/fleet/maintenance/predict',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const fleetStatus = await getFleetStatus();
    const predictions = [];

    for (const vehicle of fleetStatus.vehicles) {
      const needs = await checkMaintenanceNeeds(vehicle.id);
      if (needs.urgent.length > 0 || needs.warnings.length > 0) {
        predictions.push({
          vehicleId: vehicle.id,
          registrationNumber: vehicle.registrationNumber,
          status: vehicle.status,
          urgent: needs.urgent,
          warnings: needs.warnings,
          recommendations: needs.recommendations
        });
      }
    }

    res.json({
      success: true,
      predictions,
      metadata: {
        agent: 'Fleet Manager',
        timestamp: new Date().toISOString()
      }
    });
  })
);

// ============================================
// DRIVER PERFORMANCE INSIGHTS
// ============================================

router.get(
  '/driver/:id/insights',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const insights = await getDriverPerformance(req.params.id);

    res.json({
      success: true,
      insights,
      metadata: {
        agent: 'Driver Coach',
        timestamp: new Date().toISOString()
      }
    });
  })
);

// ============================================
// OPTIMIZE FUEL CONSUMPTION
// ============================================

router.post(
  '/route/fuel-optimize',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { origin, destination } = req.body;

    const eta = await estimateETA(origin, destination);

    res.json({
      success: true,
      optimization: {
        distance: eta.distance,
        estimatedDuration: eta.duration,
        eta: eta.eta,
        fuelSavingTips: [
          'Maintain steady speed between 60-80 km/h',
          'Avoid rapid acceleration and braking',
          'Use air conditioning sparingly',
          'Plan routes to minimize idling time'
        ]
      },
      metadata: {
        agent: 'Route Optimizer',
        timestamp: new Date().toISOString()
      }
    });
  })
);

// ============================================
// AI BRAIN - ROUTE OPTIMIZATION
// ============================================

router.post(
  '/routes/optimize',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { stops, vehicleType, preferences } = req.body;

    logger.info('AI Brain: Route optimization requested', { stopCount: stops?.length, vehicleType });

    const result = await fleetAIBrain.optimizeRoutes({
      stops,
      vehicleType: vehicleType || 'truck',
      preferences
    });

    logger.info('AI Brain: Route optimization completed', {
      totalDistance: result.totalDistance,
      estimatedTime: result.estimatedTime,
      duration: `${Date.now() - startTime}ms`
    });

    res.json({
      success: true,
      result,
      metadata: {
        agent: 'Fleet AI Brain',
        processingTime: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
  })
);

// ============================================
// AI BRAIN - MAINTENANCE PREDICTION
// ============================================

router.post(
  '/maintenance/predict',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { vehicleId, odometer, lastServiceDate, serviceHistory, usagePattern } = req.body;

    logger.info('AI Brain: Maintenance prediction requested', { vehicleId, odometer });

    const result = await fleetAIBrain.predictMaintenance({
      vehicleId,
      odometer,
      lastServiceDate: lastServiceDate || new Date().toISOString(),
      serviceHistory,
      usagePattern
    });

    logger.info('AI Brain: Maintenance prediction completed', {
      vehicleId,
      nextService: result.nextService,
      urgency: result.urgency,
      duration: `${Date.now() - startTime}ms`
    });

    res.json({
      success: true,
      result,
      metadata: {
        agent: 'Fleet AI Brain',
        processingTime: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
  })
);

// ============================================
// AI BRAIN - DRIVER ANALYSIS
// ============================================

router.post(
  '/driver/analyze',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { driverId, trips, telematics } = req.body;

    logger.info('AI Brain: Driver analysis requested', { driverId });

    const result = await fleetAIBrain.analyzeDriver({
      driverId,
      trips: trips || [],
      telematics
    });

    logger.info('AI Brain: Driver analysis completed', {
      driverId,
      score: result.score,
      grade: result.grade,
      duration: `${Date.now() - startTime}ms`
    });

    res.json({
      success: true,
      result,
      metadata: {
        agent: 'Fleet AI Brain',
        processingTime: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
  })
);

// ============================================
// AI BRAIN - FUEL FORECAST
// ============================================

router.post(
  '/fuel/forecast',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { vehicleId, route, historical, loadWeight } = req.body;

    logger.info('AI Brain: Fuel forecast requested', { vehicleId, routeLength: route?.length });

    const result = await fleetAIBrain.forecastFuel({
      vehicleId,
      route: route || [],
      historical,
      loadWeight
    });

    logger.info('AI Brain: Fuel forecast completed', {
      vehicleId,
      consumption: result.consumption,
      cost: result.cost,
      duration: `${Date.now() - startTime}ms`
    });

    res.json({
      success: true,
      result,
      metadata: {
        agent: 'Fleet AI Brain',
        processingTime: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
  })
);

// ============================================
// AI BRAIN - UTILIZATION ANALYSIS
// ============================================

router.post(
  '/utilization/analyze',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { fleetId, period, vehicles } = req.body;

    logger.info('AI Brain: Utilization analysis requested', { fleetId, period });

    const result = await fleetAIBrain.analyzeUtilization({
      fleetId,
      period: period || 'monthly',
      vehicles
    });

    logger.info('AI Brain: Utilization analysis completed', {
      fleetId,
      utilization: result.utilization,
      duration: `${Date.now() - startTime}ms`
    });

    res.json({
      success: true,
      result,
      metadata: {
        agent: 'Fleet AI Brain',
        processingTime: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
  })
);

// ============================================
// AI BRAIN - DRIVER SCHEDULING
// ============================================

router.post(
  '/driver/schedule',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { fleetId, date, requirements, availableDrivers } = req.body;

    logger.info('AI Brain: Driver scheduling requested', { fleetId, date, requirements: requirements?.length });

    const result = await fleetAIBrain.scheduleDrivers({
      fleetId,
      date: date || new Date().toISOString().split('T')[0],
      requirements: requirements || [],
      availableDrivers: availableDrivers || []
    });

    logger.info('AI Brain: Driver scheduling completed', {
      fleetId,
      assignments: result.assignments.length,
      unscheduled: result.unscheduledRequirements.length,
      duration: `${Date.now() - startTime}ms`
    });

    res.json({
      success: true,
      result,
      metadata: {
        agent: 'Fleet AI Brain',
        processingTime: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
  })
);

export default router;