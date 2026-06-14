/**
 * Kitchen AI HTTP Server
 * REST API layer for the Kitchen AI library
 *
 * Connected to ReZ Mind for:
 * - Sending: Order events, prep times, station metrics
 * - Receiving: Menu insights, demand predictions, recommendations
 */

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import {
  KitchenAI,
  Station,
  StationType,
  Order,
  OrderItem,
  KitchenState,
  AlertConfig,
  StationBreakdown,
  PrepTimePrediction
} from './kitchenAI';

// ReZ Mind Integration
import { createAIBus, kitchenEvents, mindEvents } from '@rez/ai-bus';

// Load environment variables
dotenv.config();

// ============================================================================
// ReZ Mind AI Bus Connection
// ============================================================================

const aiBus = createAIBus({
  service: 'kitchen-ai',
  url: process.env.REZ_MIND_URL || 'https://rez-mind.onrender.com',
  enableWebSocket: true,
});

// Subscribe to insights from ReZ Mind
aiBus.on(mindEvents.INSIGHT, (insight) => {
  console.log('[KitchenAI] Received insight from ReZ Mind:', insight.type);
  handleMindInsight(insight);
});

aiBus.on(mindEvents.RECOMMENDATION, (recommendation) => {
  console.log('[KitchenAI] Received recommendation:', recommendation.payload);
  // Apply menu recommendations
  if (recommendation.payload.type === 'menu_adjustment') {
    applyMenuRecommendation(recommendation.payload);
  }
});

aiBus.on(mindEvents.COMMAND, (command) => {
  console.log('[KitchenAI] Received command:', command.type);
  if (command.action) {
    executeCommand(command);
  }
});

function handleMindInsight(insight: any) {
  switch (insight.type) {
    case 'PREDICTION':
      // Update prep time predictions based on demand forecast
      if (insight.payload.predictionType === 'demand') {
        updateDemandPrediction(insight.payload);
      }
      break;
    case 'ANOMALY':
      // Log anomaly for root cause analysis
      console.warn('[KitchenAI] Anomaly detected:', insight.reasoning);
      break;
  }
}

function applyMenuRecommendation(recommendation: any) {
  // Apply menu item recommendations from ReZ Mind
  // This could adjust item popularity weights, suggest new items, etc.
  console.log('[KitchenAI] Applying menu recommendation:', recommendation);
}

function executeCommand(command: any) {
  // Execute commands from ReZ Mind
  switch (command.action.type) {
    case 'ADJUST_PREP_TIME':
      adjustPrepTimeEstimate(command.orderId, command.action.data);
      break;
    case 'REROUTE_ORDER':
      rerouteOrder(command.orderId, command.action.data);
      break;
  }
}

function adjustPrepTimeEstimate(orderId: string, data: any) {
  // Adjust prep time estimate based on ReZ Mind's prediction
  const kitchen = getKitchenInstance();
  const order = kitchen.getOrder(orderId);
  if (order) {
    order.estimatedCompletionTime = data.newEstimate;
    console.log(`[KitchenAI] Adjusted prep time for ${orderId}: ${data.newEstimate}ms`);
  }
}

function rerouteOrder(orderId: string, data: any) {
  // Reroute order to different station based on ReZ Mind's recommendation
  console.log(`[KitchenAI] Rerouting order ${orderId} to station ${data.stationId}`);
}

function updateDemandPrediction(prediction: any) {
  // Store demand prediction for prep time calculations
  console.log('[KitchenAI] Demand prediction updated:', prediction);
}

// ============================================================================
// Helper to get kitchen instance (for command execution)
// ============================================================================

let kitchenInstance: KitchenAI | null = null;

function getKitchenInstance(): KitchenAI {
  if (!kitchenInstance) {
    kitchenInstance = new KitchenAI({});
  }
  return kitchenInstance;
}

// ============================================================================
// Default Stations Configuration
// ============================================================================

const DEFAULT_STATIONS: Station[] = [
  { id: 'grill-1', name: 'Grill Station 1', type: 'grill', capacity: 4, currentLoad: 0, items: [], avgCompletionTime: 12 },
  { id: 'grill-2', name: 'Grill Station 2', type: 'grill', capacity: 4, currentLoad: 0, items: [], avgCompletionTime: 12 },
  { id: 'fry-1', name: 'Fry Station 1', type: 'fry', capacity: 6, currentLoad: 0, items: [], avgCompletionTime: 8 },
  { id: 'fry-2', name: 'Fry Station 2', type: 'fry', capacity: 6, currentLoad: 0, items: [], avgCompletionTime: 8 },
  { id: 'saute-1', name: 'Saute Station 1', type: 'saute', capacity: 4, currentLoad: 0, items: [], avgCompletionTime: 10 },
  { id: 'saute-2', name: 'Saute Station 2', type: 'saute', capacity: 4, currentLoad: 0, items: [], avgCompletionTime: 10 },
  { id: 'pasta-1', name: 'Pasta Station 1', type: 'pasta', capacity: 3, currentLoad: 0, items: [], avgCompletionTime: 15 },
  { id: 'salad-1', name: 'Salad Station 1', type: 'salad', capacity: 4, currentLoad: 0, items: [], avgCompletionTime: 5 },
  { id: 'dessert-1', name: 'Dessert Station 1', type: 'dessert', capacity: 3, currentLoad: 0, items: [], avgCompletionTime: 8 },
  { id: 'beverage-1', name: 'Beverage Station 1', type: 'beverage', capacity: 5, currentLoad: 0, items: [], avgCompletionTime: 3 },
  { id: 'expo-1', name: 'Expo Station 1', type: 'expo', capacity: 2, currentLoad: 0, items: [], avgCompletionTime: 2 }
];

// ============================================================================
// Alert Configuration
// ============================================================================

const DEFAULT_ALERT_CONFIG: AlertConfig = {
  delayThreshold: 5,
  escalationLevels: [
    { level: 1, delayThreshold: 5, notificationChannels: ['station-display'] },
    { level: 2, delayThreshold: 10, notificationChannels: ['station-display', 'kitchen-manager'] },
    { level: 3, delayThreshold: 20, notificationChannels: ['station-display', 'kitchen-manager', 'expeditor'] },
    { level: 4, delayThreshold: 30, notificationChannels: ['station-display', 'kitchen-manager', 'expeditor', 'manager'], autoAction: 'notify-customer' }
  ],
  maxAlertAge: 60
};

// ============================================================================
// Server Initialization
// ============================================================================

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS headers for browser clients
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Initialize KitchenAI with configuration
const config: AlertConfig = {
  delayThreshold: parseInt(process.env.DELAY_THRESHOLD || '5'),
  escalationLevels: DEFAULT_ALERT_CONFIG.escalationLevels,
  maxAlertAge: parseInt(process.env.MAX_ALERT_AGE || '60')
};

const kitchenAI = new KitchenAI(DEFAULT_STATIONS, config);

// ============================================================================
// API Types
// ============================================================================

interface AnalyzeRequest {
  orderId: string;
  items: OrderItem[];
  priority?: number;
  targetReadyTime?: string;
  customerId?: string;
}

interface RouteRequest {
  items: OrderItem[];
}

interface PriorityRequest {
  orderId: string;
  items: OrderItem[];
  timeWaiting: number;
  priority?: number;
}

interface PredictPrepTimeRequest {
  items: OrderItem[];
  priority?: number;
}

interface FireRequest {
  orderId: string;
  items: OrderItem[];
  priority?: number;
  targetReadyTime?: string;
}

interface BottleneckRequest {
  stations?: Station[];
  orders?: Order[];
  activeOrders?: KitchenState['activeOrders'];
}

interface AlertDelayRequest {
  orderId: string;
  delay: number;
}

interface TrackCookRequest {
  orderId: string;
  items: {
    itemId: string;
    station: StationType;
    cookDuration: number;
    startTime: string;
    endTime: string;
  }[];
}

interface EnqueueOrderRequest {
  orderId: string;
  items: OrderItem[];
  priority?: number;
  targetReadyTime?: string;
  customerId?: string;
}

// ============================================================================
// API Response Helpers
// ============================================================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
}

function errorResponse(error: string): ApiResponse<never> {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// Health & Status Routes
// ============================================================================

// GET /health - Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'kitchen-ai',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// GET /status - Detailed status
app.get('/status', (req: Request, res: Response) => {
  try {
    const utilization = kitchenAI['stationRouter'].getStationUtilization();
    const stationUtilization: Record<string, number> = {};
    utilization.forEach((value, key) => {
      stationUtilization[key] = Math.round(value * 100);
    });

    res.json(successResponse({
      stations: DEFAULT_STATIONS.length,
      stationUtilization,
      nextOrder: kitchenAI.peekNextOrder(),
      activeAlerts: kitchenAI['alertEscalation'].getActiveAlerts().length
    }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// ============================================================================
// Order Analysis Routes
// ============================================================================

// POST /analyze - Analyze order for routing and prep time prediction
app.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { orderId, items, priority = 3, targetReadyTime, customerId } = req.body as AnalyzeRequest;

    if (!orderId || !items || !Array.isArray(items)) {
      res.status(400).json(errorResponse('Missing required fields: orderId and items array'));
      return;
    }

    const order: Order = {
      id: orderId,
      items,
      priority,
      createdAt: new Date(),
      targetReadyTime: targetReadyTime ? new Date(targetReadyTime) : undefined,
      customerId
    };

    // Get predictions for each item
    const itemPredictions: PrepTimePrediction[] = [];
    for (const item of items) {
      const prediction = await kitchenAI.predictPrepTime({
        ...order,
        items: [item]
      });
      itemPredictions.push(prediction);
    }

    // Get routing info
    const routing = kitchenAI['stationRouter'].routeOrder(order);
    const routingBreakdown: Record<StationType, number> = {} as Record<StationType, number>;
    routing.forEach((items, station) => {
      routingBreakdown[station] = items.length;
    });

    // Calculate total prep time
    const totalPrepTime = Math.max(...itemPredictions.map(p => p.estimatedMinutes));

    res.json(successResponse({
      orderId,
      totalPrepTime,
      confidence: itemPredictions.length > 0 ? itemPredictions[0].confidence : 0,
      itemPredictions,
      routing: routingBreakdown,
      stationBreakdown: itemPredictions.flatMap(p => p.stationBreakdown)
    }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// POST /route - Get station routing
app.post('/route', async (req: Request, res: Response) => {
  try {
    const { items } = req.body as RouteRequest;

    if (!items || !Array.isArray(items)) {
      res.status(400).json(errorResponse('Missing required field: items array'));
      return;
    }

    const order: Order = {
      id: 'temp-route-' + Date.now(),
      items,
      priority: 3,
      createdAt: new Date()
    };

    const routing = kitchenAI['stationRouter'].routeOrder(order);
    const stationAssignments: Array<{ station: StationType; items: string[]; load: number }> = [];

    routing.forEach((orderItems, station) => {
      stationAssignments.push({
        station,
        items: orderItems.map(i => i.name),
        load: kitchenAI['stationRouter'].getLoad(station)
      });
    });

    res.json(successResponse({
      assignments: stationAssignments,
      totalItems: items.length,
      utilization: Object.fromEntries(kitchenAI['stationRouter'].getStationUtilization())
    }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// POST /priority - Get priority score
app.post('/priority', async (req: Request, res: Response) => {
  try {
    const { orderId, items, timeWaiting } = req.body as PriorityRequest;

    if (!orderId || !items || timeWaiting === undefined) {
      res.status(400).json(errorResponse('Missing required fields: orderId, items, timeWaiting'));
      return;
    }

    // Calculate priority based on wait time and items
    let basePriority = 3;
    if (timeWaiting > 15) basePriority = 2;
    if (timeWaiting > 25) basePriority = 1;

    // Check for rush items (high priority menu items)
    const rushItems = items.filter(i => i.modifiers?.includes('rush') || i.modifiers?.includes('urgent'));
    if (rushItems.length > 0 && basePriority > 2) basePriority = 2;

    const priority = {
      score: basePriority,
      level: basePriority === 1 ? 'critical' : basePriority === 2 ? 'high' : basePriority === 3 ? 'normal' : 'low',
      waitTimeMinutes: timeWaiting,
      rushItems: rushItems.length,
      reasons: [
        `Wait time: ${timeWaiting} minutes`,
        rushItems.length > 0 ? `${rushItems.length} rush items detected` : null
      ].filter(Boolean)
    };

    res.json(successResponse({ priority }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// ============================================================================
// Prediction Routes
// ============================================================================

// POST /prep-time - Predict prep time for items
app.post('/prep-time', async (req: Request, res: Response) => {
  try {
    const { items, priority = 3 } = req.body as PredictPrepTimeRequest;

    if (!items || !Array.isArray(items)) {
      res.status(400).json(errorResponse('Missing required field: items array'));
      return;
    }

    const order: Order = {
      id: 'temp-prediction-' + Date.now(),
      items,
      priority,
      createdAt: new Date()
    };

    const prediction = await kitchenAI.predictPrepTime(order);

    res.json(successResponse(prediction));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// POST /fire - Get firing suggestions
app.post('/fire', async (req: Request, res: Response) => {
  try {
    const { orderId, items, priority = 3, targetReadyTime } = req.body as FireRequest;

    if (!orderId || !items || !Array.isArray(items)) {
      res.status(400).json(errorResponse('Missing required fields: orderId and items array'));
      return;
    }

    const order: Order = {
      id: orderId,
      items,
      priority,
      createdAt: new Date(),
      targetReadyTime: targetReadyTime ? new Date(targetReadyTime) : undefined
    };

    const fireSuggestions = await kitchenAI.getFireSuggestions(order);

    res.json(successResponse({
      orderId,
      suggestions: fireSuggestions,
      totalItems: fireSuggestions.length,
      criticalItems: fireSuggestions.filter(s => s.urgency === 'critical').length
    }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// ============================================================================
// Bottleneck Detection Routes
// ============================================================================

// POST /bottlenecks - Detect bottlenecks
app.post('/bottlenecks', async (req: Request, res: Response) => {
  try {
    const { stations, orders, activeOrders } = req.body as BottleneckRequest || {};

    const kitchenState: KitchenState = {
      stations: stations || DEFAULT_STATIONS,
      orders: orders || [],
      activeOrders: activeOrders || [],
      currentTime: new Date()
    };

    const bottlenecks = await kitchenAI.detectBottlenecks(kitchenState);

    res.json(successResponse({
      bottlenecks,
      total: bottlenecks.length,
      critical: bottlenecks.filter(b => b.severity === 'critical').length,
      warnings: bottlenecks.filter(b => b.severity === 'warning').length
    }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// ============================================================================
// Alert Routes
// ============================================================================

// POST /alert - Report a delay alert
app.post('/alert', async (req: Request, res: Response) => {
  try {
    const { orderId, delay, merchantId } = req.body as AlertDelayRequest & { merchantId?: string };

    if (!orderId || delay === undefined) {
      res.status(400).json(errorResponse('Missing required fields: orderId, delay'));
      return;
    }

    await kitchenAI.alertDelay(orderId, delay);
    const activeAlerts = kitchenAI['alertEscalation'].getActiveAlerts();
    const alert = activeAlerts.find(a => a.orderId === orderId);

    // Emit to ReZ Mind - Order Delayed
    try {
      await aiBus.emitOrderDelayed({
        orderId,
        merchantId: merchantId || 'unknown',
        delaySeconds: delay,
        reason: alert?.escalationLevel ? `Escalation level ${alert.escalationLevel}` : 'Delay reported',
      });
    } catch (emitError) {
      console.error('[KitchenAI] Failed to emit delay alert:', emitError);
    }

    res.json(successResponse({
      orderId,
      alert,
      activeAlertCount: activeAlerts.length
    }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /alerts - Get all active alerts
app.get('/alerts', (req: Request, res: Response) => {
  try {
    const activeAlerts = kitchenAI['alertEscalation'].getActiveAlerts();
    const history = kitchenAI['alertEscalation'].getAlertHistory(
      parseInt(req.query.limit as string) || 100
    );

    res.json(successResponse({
      active: activeAlerts,
      history,
      activeCount: activeAlerts.length
    }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// POST /alerts/:orderId/acknowledge - Acknowledge an alert
app.post('/alerts/:orderId/acknowledge', (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const acknowledged = kitchenAI['alertEscalation'].acknowledgeAlert(orderId);

    res.json(successResponse({ orderId, acknowledged }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// POST /alerts/:orderId/resolve - Resolve an alert
app.post('/alerts/:orderId/resolve', (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const resolved = kitchenAI['alertEscalation'].resolveAlert(orderId);

    res.json(successResponse({ orderId, resolved }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// ============================================================================
// Cook Time Tracking Routes
// ============================================================================

// POST /track-cook - Track cook times
app.post('/track-cook', async (req: Request, res: Response) => {
  try {
    const { orderId, items, merchantId, completed } = req.body as TrackCookRequest & { merchantId?: string; completed?: boolean };

    if (!orderId || !items || !Array.isArray(items)) {
      res.status(400).json(errorResponse('Missing required fields: orderId, items array'));
      return;
    }

    const cookItems = items.map(item => ({
      itemId: item.itemId,
      orderId,
      station: item.station,
      cookDuration: item.cookDuration,
      startTime: new Date(item.startTime),
      endTime: new Date(item.endTime),
      status: 'on-time' as const
    }));

    await kitchenAI.trackCookTime(orderId, cookItems);

    // Calculate station times for ReZ Mind
    const stationTimes: Record<string, number> = {};
    cookItems.forEach(item => {
      if (!stationTimes[item.station]) {
        stationTimes[item.station] = 0;
      }
      stationTimes[item.station] += item.cookDuration;
    });

    // Emit to ReZ Mind - Order Completed (when all items done)
    if (completed) {
      try {
        const totalPrepTime = cookItems.reduce((sum, item) => sum + (item.cookDuration || 0), 0);

        await aiBus.emitOrderCompleted({
          orderId,
          merchantId: merchantId || 'unknown',
          actualPrepTime: totalPrepTime,
          stationTimes,
        });
      } catch (emitError) {
        console.error('[KitchenAI] Failed to emit order completed:', emitError);
      }
    }

    res.json(successResponse({
      orderId,
      trackedItems: cookItems.length,
      averageCookTime: kitchenAI['cookTimeTracker'].getAverageCookTime(cookItems[0]?.station) || 0
    }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /cook-stats/:station? - Get cook statistics
app.get('/cook-stats/:station?', (req: Request, res: Response) => {
  try {
    const { station } = req.params;
    const stationType = station as StationType | undefined;

    const avgCookTime = stationType
      ? kitchenAI['cookTimeTracker'].getAverageCookTime(stationType)
      : undefined;
    const lateRate = stationType
      ? kitchenAI['cookTimeTracker'].getLateCookRate(stationType as StationType)
      : undefined;

    res.json(successResponse({
      station: stationType || 'all',
      averageCookTime: avgCookTime || 0,
      lateRate: lateRate || 0,
      activeCooks: kitchenAI['cookTimeTracker'].getActiveCooks().length
    }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// ============================================================================
// Queue Management Routes
// ============================================================================

// POST /queue/enqueue - Add order to queue
app.post('/queue/enqueue', async (req: Request, res: Response) => {
  try {
    const { orderId, items, priority = 3, targetReadyTime, customerId, merchantId } = req.body as EnqueueOrderRequest;

    if (!orderId || !items || !Array.isArray(items)) {
      res.status(400).json(errorResponse('Missing required fields: orderId, items array'));
      return;
    }

    const order: Order = {
      id: orderId,
      items,
      priority,
      createdAt: new Date(),
      targetReadyTime: targetReadyTime ? new Date(targetReadyTime) : undefined,
      customerId
    };

    kitchenAI.enqueueOrder(order);

    // Emit to ReZ Mind - Order Received
    try {
      await aiBus.emitOrderReceived({
        orderId,
        merchantId: merchantId || 'unknown',
        items: items.map((item: any) => ({ id: item.id, station: item.station || 'unknown' })),
        estimatedPrepTime: 600, // Default, will be updated
      });
    } catch (emitError) {
      console.error('[KitchenAI] Failed to emit order received:', emitError);
      // Don't fail the request if emit fails
    }

    res.json(successResponse({
      order,
      queuePosition: kitchenAI.getOrdersByPriority().findIndex(o => o.id === orderId) + 1,
      totalInQueue: kitchenAI.getOrdersByPriority().length
    }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// POST /queue/dequeue - Remove and get next order
app.post('/queue/dequeue', (req: Request, res: Response) => {
  try {
    const order = kitchenAI.dequeueOrder();

    if (!order) {
      res.json(successResponse({ order: null, message: 'Queue is empty' }));
      return;
    }

    res.json(successResponse({
      order,
      remainingInQueue: kitchenAI.getOrdersByPriority().length
    }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /queue - Get all orders in queue
app.get('/queue', (req: Request, res: Response) => {
  try {
    const orders = kitchenAI.getOrdersByPriority();
    const nextOrder = kitchenAI.peekNextOrder();

    res.json(successResponse({
      orders,
      nextOrder,
      total: orders.length
    }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// ============================================================================
// Analytics Routes
// ============================================================================

// GET /metrics - Get performance metrics
app.get('/metrics', (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const metrics = kitchenAI.getPerformanceMetrics(hours);
    const insights = kitchenAI.getInsights();

    res.json(successResponse({
      metrics,
      insights,
      timeRange: `Last ${hours} hours`
    }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json(errorResponse(`Route ${req.method} ${req.path} not found`));
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] ${err.message}:`, err.stack);
  res.status(500).json(errorResponse(err.message || 'Internal server error'));
});

// ============================================================================
// Server Start
// ============================================================================

const PORT = process.env.PORT || 4082;

const server = app.listen(PORT, () => {
  console.log(`[Kitchen AI] Server running on port ${PORT}`);
  console.log(`[Kitchen AI] Health check: http://localhost:${PORT}/health`);
  console.log(`[Kitchen AI] Stations configured: ${DEFAULT_STATIONS.length}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Kitchen AI] SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('[Kitchen AI] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Kitchen AI] SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('[Kitchen AI] Server closed');
    process.exit(0);
  });
});

export { app, kitchenAI };
