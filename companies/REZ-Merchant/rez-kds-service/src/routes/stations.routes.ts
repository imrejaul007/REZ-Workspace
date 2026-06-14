import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { stationRoutingService } from '../services/StationRoutingService';
import { timingService } from '../services/TimingService';
import { StationType } from '../config';

const router = Router();

// Validation schemas
const UpdateStationConfigSchema = z.object({
  name: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  soundEnabled: z.boolean().optional(),
  autoBumpEnabled: z.boolean().optional(),
  averageItemTime: z.number().min(0).optional()
});

const AddRoutingRuleSchema = z.object({
  itemType: z.string().min(1),
  targetStations: z.array(z.enum(Object.values(StationType) as [string, ...string[]])).min(1),
  priority: z.enum(['primary', 'secondary', 'fallback']).default('primary'),
  estimatedTime: z.number().min(0)
});

// Error handling wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Get all stations
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const stationType = req.query.type as StationType | undefined;
  const stations = await stationRoutingService.getStations(stationType);

  res.json({
    success: true,
    data: stations,
    meta: {
      count: stations.length,
      timestamp: new Date().toISOString()
    }
  });
}));

// Get station by ID
router.get('/:stationId', asyncHandler(async (req: Request, res: Response) => {
  const { stationId } = req.params;
  const station = await stationRoutingService.getStationById(stationId);

  if (!station) {
    res.status(404).json({
      error: 'Station not found',
      stationId
    });
    return;
  }

  res.json({
    success: true,
    data: station
  });
}));

// Get station load metrics
router.get('/:stationType/load', asyncHandler(async (req: Request, res: Response) => {
  const { stationType } = req.params;

  if (!Object.values(StationType).includes(stationType as StationType)) {
    res.status(400).json({
      error: 'Invalid station type',
      validTypes: Object.values(StationType)
    });
    return;
  }

  const load = await stationRoutingService.getStationLoad(stationType as StationType);

  res.json({
    success: true,
    data: load
  });
}));

// Get all station loads
router.get('/loads/all', asyncHandler(async (req: Request, res: Response) => {
  const loads = await stationRoutingService.getAllStationLoads();

  res.json({
    success: true,
    data: Array.from(loads.values())
  });
}));

// Get station metrics
router.get('/:stationType/metrics', asyncHandler(async (req: Request, res: Response) => {
  const { stationType } = req.params;

  if (!Object.values(StationType).includes(stationType as StationType)) {
    res.status(400).json({
      error: 'Invalid station type',
      validTypes: Object.values(StationType)
    });
    return;
  }

  const metrics = await stationRoutingService.getStationMetrics(stationType as StationType);

  res.json({
    success: true,
    data: metrics
  });
}));

// Update station configuration
router.patch('/:stationId/config', asyncHandler(async (req: Request, res: Response) => {
  const { stationId } = req.params;
  const validation = UpdateStationConfigSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: validation.error.errors
    });
    return;
  }

  const station = await stationRoutingService.updateStationConfig(stationId, validation.data);

  if (!station) {
    res.status(404).json({
      error: 'Station not found',
      stationId
    });
    return;
  }

  res.json({
    success: true,
    data: station,
    message: 'Station configuration updated'
  });
}));

// Toggle station active status
router.post('/:stationId/toggle', asyncHandler(async (req: Request, res: Response) => {
  const { stationId } = req.params;
  const { isActive } = req.body as { isActive: boolean };

  if (typeof isActive !== 'boolean') {
    res.status(400).json({
      error: 'isActive must be a boolean'
    });
    return;
  }

  const station = await stationRoutingService.toggleStation(stationId, isActive);

  if (!station) {
    res.status(404).json({
      error: 'Station not found',
      stationId
    });
    return;
  }

  res.json({
    success: true,
    data: station,
    message: `Station ${isActive ? 'activated' : 'deactivated'}`
  });
}));

// Get routing rules
router.get('/routing/rules', asyncHandler(async (req: Request, res: Response) => {
  const rules = stationRoutingService.getRoutingRules();

  res.json({
    success: true,
    data: rules
  });
}));

// Add custom routing rule
router.post('/routing/rules', asyncHandler(async (req: Request, res: Response) => {
  const validation = AddRoutingRuleSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: validation.error.errors
    });
    return;
  }

  await stationRoutingService.addCustomRule(validation.data);

  res.status(201).json({
    success: true,
    data: validation.data,
    message: 'Routing rule added'
  });
}));

// Remove routing rule
router.delete('/routing/rules/:itemType', asyncHandler(async (req: Request, res: Response) => {
  const { itemType } = req.params;
  const removed = await stationRoutingService.removeCustomRule(itemType);

  if (!removed) {
    res.status(404).json({
      error: 'Routing rule not found',
      itemType
    });
    return;
  }

  res.json({
    success: true,
    message: 'Routing rule removed'
  });
}));

// Route an item to appropriate station
router.post('/route/item', asyncHandler(async (req: Request, res: Response) => {
  const { itemType, quantity = 1 } = req.body as { itemType: string; quantity?: number };

  if (!itemType) {
    res.status(400).json({
      error: 'itemType is required'
    });
    return;
  }

  const decision = stationRoutingService.routeItem(itemType, quantity);

  res.json({
    success: true,
    data: decision
  });
}));

// Route entire order
router.post('/route/order', asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body as {
    items: Array<{ itemType: string; quantity: number }>
  };

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({
      error: 'items array is required'
    });
    return;
  }

  const result = stationRoutingService.routeOrder(items);

  res.json({
    success: true,
    data: result
  });
}));

// Get station timing summary
router.get('/:stationType/timing', asyncHandler(async (req: Request, res: Response) => {
  const { stationType } = req.params;

  if (!Object.values(StationType).includes(stationType as StationType)) {
    res.status(400).json({
      error: 'Invalid station type',
      validTypes: Object.values(StationType)
    });
    return;
  }

  const summary = await timingService.getStationTimingSummary(stationType as StationType);

  res.json({
    success: true,
    data: summary
  });
}));

// Initialize default stations
router.post('/initialize', asyncHandler(async (req: Request, res: Response) => {
  await stationRoutingService.initializeStations();

  res.json({
    success: true,
    message: 'Default stations initialized'
  });
}));

export default router;
