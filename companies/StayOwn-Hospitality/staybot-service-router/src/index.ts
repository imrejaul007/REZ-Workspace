/**
 * StayBot Service Router
 *
 * Central routing hub that connects HOJAI StayBot to all hotel services.
 * This is the CORE integration piece that enables the "Invisible Hotel" experience.
 *
 * Port: 4841
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import axios from 'axios';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const PORT = process.env.PORT || 4841;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/staybot-router';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Service URLs
const SERVICE_URLS = {
  // RABTUL Services
  'rez-auth': process.env.REZ_AUTH_URL || 'http://localhost:4002',
  'rez-payment': process.env.REZ_PAYMENT_URL || 'http://localhost:4001',
  'rez-wallet': process.env.REZ_WALLET_URL || 'http://localhost:4004',

  // StayOwn Guest Services
  'minibar': process.env.MINIBAR_URL || 'http://localhost:3810',
  'restaurant': process.env.RESTAURANT_URL || 'http://localhost:3811',
  'spa': process.env.SPA_URL || 'http://localhost:3812',
  'housekeeping': process.env.HOUSEKEEPING_URL || 'http://localhost:3826',
  'parking': process.env.PARKING_URL || 'http://localhost:3815',
  'concierge': process.env.CONCIERGE_URL || 'http://localhost:3821',
  'checkout': process.env.CHECKOUT_URL || 'http://localhost:3827',
  'smart-lock': process.env.SMART_LOCK_URL || 'http://localhost:3825',
  'room-controls': process.env.ROOM_CONTROLS_URL || 'http://localhost:3814',
  'pre-arrival': process.env.PRE_ARRIVAL_URL || 'http://localhost:3828',
  'upsell': process.env.UPSELL_URL || 'http://localhost:3817',
  'feedback': process.env.FEEDBACK_URL || 'http://localhost:3820',
  'review': process.env.REVIEW_URL || 'http://localhost:3819',
  'lost-found': process.env.LOST_FOUND_URL || 'http://localhost:3816',

  // REZ-Merchant Hotel OS
  'pms': process.env.REZ_PMS_URL || 'http://localhost:4031',
  'booking': process.env.REZ_BOOKING_URL || 'http://localhost:4042',
  'room-service': process.env.REZ_ROOM_SERVICE_URL || 'http://localhost:4043',

  // HOJAI Services
  'hojai-memory': process.env.HOJAI_MEMORY_URL || 'http://localhost:4520',
  'hojai-staybot': process.env.HOJAI_STAYBOT_URL || 'http://localhost:4840',
  'hojai-genie': process.env.HOJAI_GENIE_URL || 'http://localhost:4703',
};

// Types
interface ServiceRouteRequest {
  guestId: string;
  sessionId: string;
  serviceType: string;
  action: string;
  data: Record<string, any>;
  metadata?: {
    channel?: 'voice' | 'chat' | 'qr';
    language?: string;
    hotelId?: string;
    roomId?: string;
  };
}

interface ServiceRouteResponse {
  success: boolean;
  requestId: string;
  serviceType: string;
  action: string;
  result?: any;
  error?: string;
  timestamp: string;
}

interface RouteMapping {
  serviceType: string;
  serviceName: string;
  url: string;
  endpoints: {
    [action: string]: string;
  };
  authRequired: boolean;
}

// Route Mappings
const ROUTE_MAPPINGS: RouteMapping[] = [
  {
    serviceType: 'minibar',
    serviceName: 'Minibar Service',
    url: SERVICE_URLS['minibar'],
    endpoints: {
      'order': '/api/orders',
      'list': '/api/menu',
      'status': '/api/orders/:id',
      'cancel': '/api/orders/:id/cancel',
    },
    authRequired: true,
  },
  {
    serviceType: 'restaurant',
    serviceName: 'Restaurant Booking',
    url: SERVICE_URLS['restaurant'],
    endpoints: {
      'book': '/api/reservations',
      'menu': '/api/menu',
      'tables': '/api/tables',
      'cancel': '/api/reservations/:id/cancel',
    },
    authRequired: true,
  },
  {
    serviceType: 'spa',
    serviceName: 'Spa Booking',
    url: SERVICE_URLS['spa'],
    endpoints: {
      'book': '/api/appointments',
      'treatments': '/api/treatments',
      'therapists': '/api/therapists',
      'cancel': '/api/appointments/:id/cancel',
    },
    authRequired: true,
  },
  {
    serviceType: 'housekeeping',
    serviceName: 'Predictive Housekeeping',
    url: SERVICE_URLS['housekeeping'],
    endpoints: {
      'request': '/api/requests',
      'status': '/api/requests/:id',
      'schedule': '/api/schedule',
      'cancel': '/api/requests/:id/cancel',
    },
    authRequired: true,
  },
  {
    serviceType: 'parking',
    serviceName: 'Parking Service',
    url: SERVICE_URLS['parking'],
    endpoints: {
      'valet': '/api/valet/request',
      'status': '/api/valet/:id',
      'retrieve': '/api/valet/:id/retrieve',
    },
    authRequired: true,
  },
  {
    serviceType: 'concierge',
    serviceName: 'Concierge Desk',
    url: SERVICE_URLS['concierge'],
    endpoints: {
      'request': '/api/requests',
      'recommendations': '/api/recommendations',
      'bookings': '/api/external-bookings',
    },
    authRequired: true,
  },
  {
    serviceType: 'checkout',
    serviceName: 'Zero Checkout',
    url: SERVICE_URLS['checkout'],
    endpoints: {
      'process': '/api/checkout',
      'folio': '/api/folio/:guestId',
      'invoice': '/api/invoice/:bookingId',
    },
    authRequired: true,
  },
  {
    serviceType: 'smart-lock',
    serviceName: 'Smart Lock Service',
    url: SERVICE_URLS['smart-lock'],
    endpoints: {
      'key': '/api/keys',
      'revoke': '/api/keys/:id/revoke',
      'history': '/api/keys/:guestId/history',
    },
    authRequired: true,
  },
  {
    serviceType: 'room-controls',
    serviceName: 'Room Controls',
    url: SERVICE_URLS['room-controls'],
    endpoints: {
      'temperature': '/api/temperature',
      'lights': '/api/lights',
      'curtains': '/api/curtains',
      'tv': '/api/tv',
      'scene': '/api/scenes',
    },
    authRequired: true,
  },
  {
    serviceType: 'pre-arrival',
    serviceName: 'Pre-Arrival Service',
    url: SERVICE_URLS['pre-arrival'],
    endpoints: {
      'preferences': '/api/preferences',
      'flight': '/api/flight',
      'prepare': '/api/prepare',
    },
    authRequired: true,
  },
  {
    serviceType: 'upsell',
    serviceName: 'Upsell Engine',
    url: SERVICE_URLS['upsell'],
    endpoints: {
      'offers': '/api/offers',
      'accept': '/api/offers/:id/accept',
      'decline': '/api/offers/:id/decline',
    },
    authRequired: true,
  },
  {
    serviceType: 'feedback',
    serviceName: 'Feedback Survey',
    url: SERVICE_URLS['feedback'],
    endpoints: {
      'survey': '/api/surveys',
      'submit': '/api/surveys/:id/responses',
    },
    authRequired: true,
  },
  {
    serviceType: 'review',
    serviceName: 'Review Manager',
    url: SERVICE_URLS['review'],
    endpoints: {
      'create': '/api/reviews',
      'respond': '/api/reviews/:id/respond',
    },
    authRequired: true,
  },
  {
    serviceType: 'lost-found',
    serviceName: 'Lost & Found',
    url: SERVICE_URLS['lost-found'],
    endpoints: {
      'report': '/api/items',
      'status': '/api/items/:id',
      'claim': '/api/items/:id/claim',
    },
    authRequired: true,
  },
  {
    serviceType: 'pms',
    serviceName: 'Property Management',
    url: SERVICE_URLS['pms'],
    endpoints: {
      'guest': '/api/guests/:id',
      'booking': '/api/bookings/:id',
      'room': '/api/rooms/:id',
      'folio': '/api/folios/:guestId',
    },
    authRequired: true,
  },
  {
    serviceType: 'booking',
    serviceName: 'Booking Engine',
    url: SERVICE_URLS['booking'],
    endpoints: {
      'create': '/api/bookings',
      'cancel': '/api/bookings/:id/cancel',
      'modify': '/api/bookings/:id/modify',
      'extend': '/api/bookings/:id/extend',
    },
    authRequired: true,
  },
  {
    serviceType: 'room-service',
    serviceName: 'Room Service',
    url: SERVICE_URLS['room-service'],
    endpoints: {
      'order': '/api/orders',
      'menu': '/api/menu',
      'status': '/api/orders/:id',
    },
    authRequired: true,
  },
];

// MongoDB Schema for Route Logs
const routeLogSchema = new mongoose.Schema({
  requestId: String,
  guestId: String,
  sessionId: String,
  serviceType: String,
  action: String,
  requestData: mongoose.Schema.Types.Mixed,
  responseData: mongoose.Schema.Types.Mixed,
  status: { type: String, enum: ['pending', 'success', 'error'] },
  errorMessage: String,
  duration: Number,
  timestamp: { type: Date, default: Date.now },
});

const RouteLog = mongoose.model('RouteLog', routeLogSchema);

// Redis for caching and pub/sub
const redis = new Redis(REDIS_URL);
const pubsub = new Redis(REDIS_URL);

// Express App
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  (req as any).requestId = requestId;
  console.log(`[${requestId}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    service: 'staybot-service-router',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {} as Record<string, string>,
  };

  // Check all service health
  for (const mapping of ROUTE_MAPPINGS) {
    try {
      const response = await axios.get(`${mapping.url}/health`, { timeout: 1000 });
      health.services[mapping.serviceType] = 'healthy';
    } catch {
      health.services[mapping.serviceType] = 'unhealthy';
    }
  }

  res.json(health);
});

// Readiness probe
app.get('/ready', async (req: Request, res: Response) => {
  try {
    await mongoose.connection.db?.admin().ping();
    await redis.ping();
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not ready' });
  }
});

// Get all available routes
app.get('/api/routes', (req: Request, res: Response) => {
  const routes = ROUTE_MAPPINGS.map(m => ({
    serviceType: m.serviceType,
    serviceName: m.serviceName,
    actions: Object.keys(m.endpoints),
  }));
  res.json({ routes });
});

// Main routing endpoint
app.post('/api/route', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const { guestId, sessionId, serviceType, action, data, metadata } = req.body as ServiceRouteRequest;

  // Validate request
  if (!guestId || !serviceType || !action) {
    return res.status(400).json({
      success: false,
      requestId,
      error: 'Missing required fields: guestId, serviceType, action',
    });
  }

  // Find service mapping
  const mapping = ROUTE_MAPPINGS.find(m => m.serviceType === serviceType);
  if (!mapping) {
    return res.status(404).json({
      success: false,
      requestId,
      error: `Service type '${serviceType}' not found. Available: ${ROUTE_MAPPINGS.map(m => m.serviceType).join(', ')}`,
    });
  }

  // Get endpoint
  const endpoint = mapping.endpoints[action];
  if (!endpoint) {
    return res.status(404).json({
      success: false,
      requestId,
      error: `Action '${action}' not found for service '${serviceType}'. Available: ${Object.keys(mapping.endpoints).join(', ')}`,
    });
  }

  const startTime = Date.now();

  try {
    // Build request to target service
    const targetUrl = `${mapping.url}${endpoint}`;

    const response = await axios.post(targetUrl, {
      guestId,
      sessionId,
      ...data,
      metadata: {
        ...metadata,
        routedBy: 'staybot-service-router',
        requestId,
      },
    }, {
      timeout: 30000,
      headers: {
        'X-Request-ID': requestId,
        'X-Service-Type': serviceType,
      },
    });

    const duration = Date.now() - startTime;

    // Log successful route
    await RouteLog.create({
      requestId,
      guestId,
      sessionId,
      serviceType,
      action,
      requestData: { serviceType, action, data },
      responseData: response.data,
      status: 'success',
      duration,
    });

    // Publish event for other services
    await pubsub.publish('service-routed', JSON.stringify({
      requestId,
      guestId,
      serviceType,
      action,
      success: true,
      timestamp: new Date().toISOString(),
    }));

    res.json({
      success: true,
      requestId,
      serviceType,
      action,
      result: response.data,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorMessage = error.response?.data?.message || error.message;

    // Log error
    await RouteLog.create({
      requestId,
      guestId,
      sessionId,
      serviceType,
      action,
      requestData: { serviceType, action, data },
      responseData: null,
      status: 'error',
      errorMessage,
      duration,
    });

    // Publish error event
    await pubsub.publish('service-route-error', JSON.stringify({
      requestId,
      guestId,
      serviceType,
      action,
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }));

    res.status(error.response?.status || 500).json({
      success: false,
      requestId,
      serviceType,
      action,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
});

// Batch routing - route to multiple services
app.post('/api/route/batch', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const { requests } = req.body as { requests: ServiceRouteRequest[] };

  if (!requests || !Array.isArray(requests)) {
    return res.status(400).json({
      success: false,
      requestId,
      error: 'requests must be an array',
    });
  }

  const results = await Promise.allSettled(
    requests.map(async (r) => {
      const mapping = ROUTE_MAPPINGS.find(m => m.serviceType === r.serviceType);
      if (!mapping) throw new Error(`Service '${r.serviceType}' not found`);

      const endpoint = mapping.endpoints[r.action];
      if (!endpoint) throw new Error(`Action '${r.action}' not found`);

      const response = await axios.post(`${mapping.url}${endpoint}`, {
        guestId: r.guestId,
        sessionId: r.sessionId,
        ...r.data,
      }, { timeout: 30000 });

      return { serviceType: r.serviceType, action: r.action, result: response.data };
    })
  );

  res.json({
    success: true,
    requestId,
    results: results.map((r, i) => ({
      serviceType: requests[i].serviceType,
      action: requests[i].action,
      success: r.status === 'fulfilled',
      result: r.status === 'fulfilled' ? r.value.result : null,
      error: r.status === 'rejected' ? r.reason.message : null,
    })),
  });
});

// Guest context endpoint - get all guest data from multiple services
app.get('/api/guest/:guestId/context', async (req: Request, res: Response) => {
  const { guestId } = req.params;
  const requestId = (req as any).requestId;

  const context: any = {
    requestId,
    guestId,
    timestamp: new Date().toISOString(),
    services: {},
  };

  // Fetch from multiple services in parallel
  const serviceCalls = [
    { service: 'pms', endpoint: `/api/guests/${guestId}` },
    { service: 'checkout', endpoint: `/api/folio/${guestId}` },
    { service: 'hojai-memory', endpoint: `/guests/${guestId}/preferences` },
  ];

  await Promise.allSettled(
    serviceCalls.map(async ({ service, endpoint }) => {
      const mapping = ROUTE_MAPPINGS.find(m => m.serviceType === service);
      if (!mapping) return;

      try {
        const response = await axios.get(`${mapping.url}${endpoint}`, { timeout: 5000 });
        context.services[service] = { success: true, data: response.data };
      } catch (error: any) {
        context.services[service] = { success: false, error: error.message };
      }
    })
  );

  res.json(context);
});

// Event subscription endpoint
app.post('/api/subscribe', (req: Request, res: Response) => {
  const { events, callback } = req.body;

  if (!events || !callback) {
    return res.status(400).json({ error: 'events and callback required' });
  }

  // Subscribe to Redis channels
  events.forEach((event: string) => {
    pubsub.subscribe(`service-${event}`);
  });

  res.json({ success: true, subscribed: events });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[${(req as any).requestId}] Error:`, err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    requestId: (req as any).requestId,
  });
});

// Start server
async function start() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Connect to Redis
    await redis.ping();
    console.log('Connected to Redis');

    // Start Express
    app.listen(PORT, () => {
      console.log(`StayBot Service Router running on port ${PORT}`);
      console.log(`Available routes: ${ROUTE_MAPPINGS.length} services`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
