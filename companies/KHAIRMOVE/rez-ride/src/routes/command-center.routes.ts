import { Router, Request, Response } from 'express';
import { CommandCenterService } from '../services/command-center.service';
import { MLService } from '../services/ml.service';
import { EventPipelineService } from '../services/event-pipeline.service';

const router = Router();
const commandCenter = new CommandCenterService();
const mlService = new MLService();
const eventPipeline = new EventPipelineService();

// ===========================================
// DASHBOARD
// ===========================================

/**
 * @route GET /api/command/metrics
 * @desc Get real-time dashboard metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await commandCenter.getDashboardMetrics();
    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/command/alerts
 * @desc Get active alerts
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const alerts = await commandCenter.getAlerts();
    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route PATCH /api/command/alerts/:alertId/acknowledge
 * @desc Acknowledge alert
 */
router.patch('/alerts/:alertId/acknowledge', async (req: Request, res: Response) => {
  try {
    await commandCenter.acknowledgeAlert(req.params.alertId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// HEAT MAPS
// ===========================================

/**
 * @route GET /api/command/heatmaps/drivers
 * @desc Get driver heat map
 */
router.get('/heatmaps/drivers', async (req: Request, res: Response) => {
  try {
    const heatmap = await commandCenter.getDriverHeatMap();
    res.json({ success: true, heatmap });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/command/heatmaps/demand
 * @desc Get demand heat map
 */
router.get('/heatmaps/demand', async (req: Request, res: Response) => {
  try {
    const heatmap = await commandCenter.getDemandHeatMap();
    res.json({ success: true, heatmap });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/command/heatmaps/supply-demand
 * @desc Get combined supply-demand map
 */
router.get('/heatmaps/supply-demand', async (req: Request, res: Response) => {
  try {
    const heatmap = await commandCenter.getSupplyDemandMap();
    res.json({ success: true, heatmap });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// LIVE RIDES
// ===========================================

/**
 * @route GET /api/command/rides/live
 * @desc Get all live rides
 */
router.get('/rides/live', async (req: Request, res: Response) => {
  try {
    const rides = await commandCenter.getLiveRides();
    res.json({ success: true, rides });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/command/rides/:rideId/stream
 * @desc Get ride stream data
 */
router.get('/rides/:rideId/stream', async (req: Request, res: Response) => {
  try {
    const stream = await commandCenter.getRideStream(req.params.rideId);
    res.json({ success: true, stream });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// ZONE MANAGEMENT
// ===========================================

/**
 * @route GET /api/command/zones/allocation
 * @desc Get driver allocation by zone
 */
router.get('/zones/allocation', async (req: Request, res: Response) => {
  try {
    const allocation = await commandCenter.getDriverAllocation();
    res.json({ success: true, allocation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/command/zones/redeploy
 * @desc Redeploy drivers between zones
 */
router.post('/zones/redeploy', async (req: Request, res: Response) => {
  try {
    const { fromZone, toZone, count } = req.body;
    const result = await commandCenter.redeployDrivers(fromZone, toZone, count);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// ===========================================
// ML PREDICTIONS
// ===========================================

/**
 * @route GET /api/command/ml/eta
 * @desc Predict ETA
 */
router.get('/ml/eta', async (req: Request, res: Response) => {
  try {
    const { pickupLat, pickupLng, dropLat, dropLng, vehicleType } = req.query;

    const prediction = await mlService.predictETA({
      pickupLat: parseFloat(pickupLat as string),
      pickupLng: parseFloat(pickupLng as string),
      dropLat: parseFloat(dropLat as string),
      dropLng: parseFloat(dropLng as string),
      vehicleType: vehicleType as string,
    });

    res.json({ success: true, prediction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/command/ml/demand
 * @desc Forecast demand
 */
router.get('/ml/demand', async (req: Request, res: Response) => {
  try {
    const { zoneId, hoursAhead } = req.query;

    const forecast = await mlService.forecastDemand(
      zoneId as string,
      parseInt(hoursAhead as string) || 1
    );

    res.json({ success: true, forecast });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/command/ml/fraud-detect
 * @desc Detect fraud for ride
 */
router.post('/ml/fraud-detect', async (req: Request, res: Response) => {
  try {
    const { rideId, userId, driverId } = req.body;

    const result = await mlService.detectFraud(rideId, userId, driverId);

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// EVENTS
// ===========================================

/**
 * @route POST /api/command/events
 * @desc Publish event
 */
router.post('/events', async (req: Request, res: Response) => {
  try {
    const event = req.body;
    await eventPipeline.publish(event);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/command/events
 * @desc Query events
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const { type, limit, startTime, endTime } = req.query;

    const events = await eventPipeline.getEvents(
      type as any,
      {
        limit: parseInt(limit as string) || 100,
        startTime: startTime ? new Date(startTime as string) : undefined,
        endTime: endTime ? new Date(endTime as string) : undefined,
      }
    );

    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/command/events/summary
 * @desc Get analytics summary
 */
router.get('/events/summary', async (req: Request, res: Response) => {
  try {
    const summary = await eventPipeline.getAnalyticsSummary();
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
