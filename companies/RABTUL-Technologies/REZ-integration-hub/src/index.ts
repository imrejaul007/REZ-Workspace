/**
 * RTNM Ecosystem Integration Hub
 *
 * Central service that orchestrates all cross-company integrations:
 * - RABTUL Technologies (Auth, Wallet, Payment)
 * - HOJAI AI (Intelligence, Memory, Agents)
 * - REZ-Consumer (B2C Apps)
 * - REZ-Merchant (B2B Platform)
 * - KHAIRMOVE (Mobility)
 * - AdBazaar (Advertising)
 * - Nexha (Commerce)
 * - CorpPerks (HR)
 * - RisaCare (Healthcare)
 * - StayOwn (Hospitality)
 * - And more...
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// =============================================================================
// TYPES
// =============================================================================

interface IntegrationConfig {
  name: string;
  baseUrl: string;
  timeout: number;
  auth?: string;
}

interface CrossCompanyEvent {
  source: string;
  target: string;
  event: string;
  data: unknown;
  timestamp: string;
}

// =============================================================================
// SERVICE REGISTRY
// =============================================================================

const SERVICES: Record<string, IntegrationConfig> = {
  // RABTUL Technologies
  'rabtul-auth': {
    name: 'RABTUL Auth',
    baseUrl: process.env.RABTUL_AUTH_URL || 'http://localhost:4002',
    timeout: 10000,
  },
  'rabtul-payment': {
    name: 'RABTUL Payment',
    baseUrl: process.env.RABTUL_PAYMENT_URL || 'http://localhost:4001',
    timeout: 10000,
  },
  'rabtul-wallet': {
    name: 'RABTUL Wallet',
    baseUrl: process.env.RABTUL_WALLET_URL || 'http://localhost:4004',
    timeout: 10000,
  },
  'rabtul-order': {
    name: 'RABTUL Order',
    baseUrl: process.env.RABTUL_ORDER_URL || 'http://localhost:4006',
    timeout: 10000,
  },
  'rabtul-loyalty': {
    name: 'RABTUL Loyalty',
    baseUrl: process.env.RABTUL_LOYALTY_URL || 'http://localhost:4040',
    timeout: 10000,
  },

  // HOJAI AI
  'hojai-gateway': {
    name: 'HOJAI Gateway',
    baseUrl: process.env.HOJAI_GATEWAY || 'http://localhost:4500',
    timeout: 15000,
  },
  'hojai-memory': {
    name: 'HOJAI Memory',
    baseUrl: process.env.HOJAI_MEMORY || 'http://localhost:4520',
    timeout: 10000,
  },
  'hojai-agents': {
    name: 'HOJAI Agents',
    baseUrl: process.env.HOJAI_AGENTS || 'http://localhost:4550',
    timeout: 30000,
  },
  'genie-memory': {
    name: 'Genie Memory',
    baseUrl: process.env.GENIE_MEMORY || 'http://localhost:4703',
    timeout: 10000,
  },

  // REZ-Consumer
  'rez-consumer': {
    name: 'REZ-Consumer',
    baseUrl: process.env.REZ_CONSUMER_URL || 'http://localhost:3000',
    timeout: 10000,
  },
  'rez-assistant': {
    name: 'REZ Assistant',
    baseUrl: process.env.REZ_ASSISTANT_URL || 'http://localhost:3011',
    timeout: 15000,
  },
  'rez-mart': {
    name: 'REZ-Mart',
    baseUrl: process.env.REZ_MART_URL || 'http://localhost:4100',
    timeout: 10000,
  },

  // REZ-Merchant
  'rez-merchant': {
    name: 'REZ-Merchant',
    baseUrl: process.env.REZ_MERCHANT_URL || 'http://localhost:4005',
    timeout: 10000,
  },
  'rez-pos': {
    name: 'REZ POS',
    baseUrl: process.env.REZ_POS_URL || 'http://localhost:4010',
    timeout: 10000,
  },
  'rez-restaurant': {
    name: 'REZ Restaurant',
    baseUrl: process.env.REZ_RESTAURANT_URL || 'http://localhost:4012',
    timeout: 10000,
  },

  // KHAIRMOVE
  'khaimove-ride': {
    name: 'KHAIRMOVE Ride',
    baseUrl: process.env.KHAIRMOVE_RIDE_URL || 'http://localhost:4600',
    timeout: 10000,
  },
  'khaimove-delivery': {
    name: 'KHAIRMOVE Delivery',
    baseUrl: process.env.KHAIRMOVE_DELIVERY_URL || 'http://localhost:4603',
    timeout: 10000,
  },
  'airzy': {
    name: 'Airzy Airport',
    baseUrl: process.env.AIRZY_URL || 'http://localhost:4500',
    timeout: 10000,
  },

  // AdBazaar
  'adbazaar': {
    name: 'AdBazaar',
    baseUrl: process.env.ADBAZAAR_URL || 'http://localhost:5000',
    timeout: 10000,
  },
  'creator-qr': {
    name: 'Creator QR',
    baseUrl: process.env.CREATOR_QR_URL || 'http://localhost:5001',
    timeout: 10000,
  },

  // StayOwn (Hospitality)
  'stayown': {
    name: 'StayOwn Hotel',
    baseUrl: process.env.STAYOWN_URL || 'http://localhost:6000',
    timeout: 10000,
  },

  // RisaCare (Healthcare)
  'risacare': {
    name: 'RisaCare',
    baseUrl: process.env.RISACARE_URL || 'http://localhost:7000',
    timeout: 10000,
  },

  // Nexha (Commerce)
  'nexha': {
    name: 'Nexha',
    baseUrl: process.env.NEXHA_URL || 'http://localhost:8000',
    timeout: 10000,
  },
};

// =============================================================================
// CLIENT FACTORY
// =============================================================================

function createClient(config: IntegrationConfig): AxiosInstance {
  return axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeout,
    headers: {
      'Content-Type': 'application/json',
      'X-Integration-Hub': 'true',
      'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
    },
  });
}

// =============================================================================
// EVENT BUS
// =============================================================================

const eventHandlers: Map<string, Function[]> = new Map();
const eventLog: CrossCompanyEvent[] = [];

function emitEvent(source: string, target: string, event: string, data: unknown) {
  const crossEvent: CrossCompanyEvent = {
    source,
    target,
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  eventLog.push(crossEvent);

  // Emit to handlers
  const handlers = eventHandlers.get(`${target}:${event}`) || [];
  handlers.forEach(handler => handler(data));

  console.log(`[EventBus] ${source} → ${target}: ${event}`);
}

function onEvent(target: string, event: string, handler: Function) {
  const key = `${target}:${event}`;
  if (!eventHandlers.has(key)) {
    eventHandlers.set(key, []);
  }
  eventHandlers.get(key)!.push(handler);
}

// =============================================================================
// INTEGRATION METHODS
// =============================================================================

/**
 * Get unified user profile across all platforms
 */
async function getUnifiedUserProfile(userId: string): Promise<unknown> {
  const results = await Promise.allSettled([
    // RABTUL - Auth/Profile
    createClient(SERVICES['rabtul-auth']).get(`/users/${userId}`),
    // HOJAI - Intelligence
    createClient(SERVICES['hojai-memory']).get(`/memory/user/${userId}`),
    // REZ-Consumer - App usage
    createClient(SERVICES['rez-consumer']).get(`/users/${userId}`),
  ]);

  return {
    userId,
    profile: results[0].status === 'fulfilled' ? results[0].value.data : null,
    memory: results[1].status === 'fulfilled' ? results[1].value.data : null,
    appData: results[2].status === 'fulfilled' ? results[2].value.data : null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create user across all platforms
 */
async function createUnifiedUser(userData: {
  phone: string;
  name: string;
  email?: string;
}): Promise<unknown> {
  // 1. Create in RABTUL Auth
  const authResponse = await createClient(SERVICES['rabtul-auth']).post('/users', userData);

  const userId = authResponse.data.userId;

  // 2. Create in HOJAI Memory
  createClient(SERVICES['hojai-memory']).post('/memory/user', {
    userId,
    ...userData,
  }).catch(console.error); // Non-blocking

  // 3. Create in REZ-Consumer
  createClient(SERVICES['rez-consumer']).post('/users', {
    userId,
    ...userData,
  }).catch(console.error); // Non-blocking

  emitEvent('integration-hub', 'all', 'user.created', { userId, ...userData });

  return { userId, ...userData };
}

/**
 * Unified loyalty across platforms
 */
async function getUnifiedLoyalty(userId: string): Promise<unknown> {
  const results = await Promise.allSettled([
    // RABTUL Loyalty
    createClient(SERVICES['rabtul-loyalty']).get(`/points/${userId}`),
    // REZ-Consumer points
    createClient(SERVICES['rez-consumer']).get(`/loyalty/${userId}`),
  ]);

  return {
    userId,
    rabtulPoints: results[0].status === 'fulfilled' ? results[0].value.data : null,
    rezPoints: results[1].status === 'fulfilled' ? results[1].value.data : null,
  };
}

/**
 * Cross-platform payment
 */
async function crossPlatformPayment(params: {
  userId: string;
  amount: number;
  source: 'wallet' | 'card' | 'upi';
  targetPlatform: string;
}): Promise<unknown> {
  const { userId, amount, source, targetPlatform } = params;

  // Use RABTUL Payment
  const paymentResponse = await createClient(SERVICES['rabtul-payment']).post('/payments/initiate', {
    userId,
    amount,
    method: source,
    metadata: { targetPlatform },
  });

  emitEvent('integration-hub', targetPlatform, 'payment.completed', paymentResponse.data);

  return paymentResponse.data;
}

/**
 * KHAIRMOVE → Hotel integration (Airzy ↔ StayOwn)
 */
async function flightToHotelSync(bookingData: {
  flightNumber: string;
  hotelId: string;
  guestName: string;
}): Promise<unknown> {
  // 1. Get flight info from Airzy
  const flightInfo = await createClient(SERVICES['airzy']).get(`/flights/${bookingData.flightNumber}`);

  // 2. Notify StayOwn about guest arrival
  const hotelSync = await createClient(SERVICES['stayown']).post('/reservations/sync', {
    guestName: bookingData.guestName,
    expectedArrival: flightInfo.data.arrivalTime,
    source: 'airzy',
  });

  emitEvent('airzy', 'stayown', 'guest.arrival.sync', hotelSync.data);

  return hotelSync.data;
}

/**
 * AdBazaar → REZ-Merchant promotion
 */
async function syncPromotion(params: {
  promotionId: string;
  merchantId: string;
}): Promise<unknown> {
  const { promotionId, merchantId } = params;

  // Get promotion from AdBazaar
  const promotion = await createClient(SERVICES['adbazaar']).get(`/promotions/${promotionId}`);

  // Apply to REZ-Merchant
  const merchantPromotion = await createClient(SERVICES['rez-merchant']).post('/promotions', {
    ...promotion.data,
    source: 'adbazaar',
    merchantId,
  });

  emitEvent('adbazaar', 'rez-merchant', 'promotion.synced', merchantPromotion.data);

  return merchantPromotion.data;
}

/**
 * Health check for all integrated services
 */
async function healthCheck(): Promise<unknown> {
  const checks = await Promise.allSettled(
    Object.entries(SERVICES).map(async ([key, config]) => {
      const start = Date.now();
      await createClient(config).get('/health').catch(() => null);
      return {
        service: key,
        name: config.name,
        latency: Date.now() - start,
        status: 'ok',
      };
    })
  );

  return {
    timestamp: new Date().toISOString(),
    services: checks.map((result, i) => {
      if (result.status === 'fulfilled') return result.value;
      return { service: Object.keys(SERVICES)[i], status: 'error' };
    }),
  };
}

// =============================================================================
// EXPRESS APP
// =============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '4099', 10);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// =============================================================================
// ROUTES
// =============================================================================

// Health
app.get('/health', async (req: Request, res: Response) => {
  const health = await healthCheck();
  res.json(health);
});

// Service registry
app.get('/services', (req: Request, res: Response) => {
  res.json({
    services: Object.entries(SERVICES).map(([key, config]) => ({
      id: key,
      name: config.name,
      url: config.baseUrl,
    })),
  });
});

// Unified user profile
app.get('/users/:userId/profile', async (req: Request, res: Response) => {
  try {
    const profile = await getUnifiedUserProfile(req.params.userId);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Create unified user
app.post('/users', async (req: Request, res: Response) => {
  try {
    const user = await createUnifiedUser(req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Unified loyalty
app.get('/users/:userId/loyalty', async (req: Request, res: Response) => {
  try {
    const loyalty = await getUnifiedLoyalty(req.params.userId);
    res.json({ success: true, data: loyalty });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Cross-platform payment
app.post('/payments', async (req: Request, res: Response) => {
  try {
    const payment = await crossPlatformPayment(req.body);
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Airzy → StayOwn sync
app.post('/integrations/flight-hotel', async (req: Request, res: Response) => {
  try {
    const sync = await flightToHotelSync(req.body);
    res.json({ success: true, data: sync });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// AdBazaar → REZ-Merchant
app.post('/integrations/promotion', async (req: Request, res: Response) => {
  try {
    const sync = await syncPromotion(req.body);
    res.json({ success: true, data: sync });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Event log
app.get('/events', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string || '100', 10);
  res.json({ events: eventLog.slice(-limit) });
});

// Proxy to any service
app.all('/proxy/:service/*', async (req: Request, res: Response) => {
  const { service, '*': path } = req.params;
  const config = SERVICES[service];

  if (!config) {
    return res.status(404).json({ error: 'Service not found' });
  }

  try {
    const response = await createClient(config).request({
      method: req.method,
      url: `/${path}`,
      data: req.body,
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// =============================================================================
// START
// =============================================================================

app.listen(PORT, () => {
  console.log(`🚀 RTNM Integration Hub running on port ${PORT}`);
  console.log(`📡 ${Object.keys(SERVICES).length} services registered`);
});

export default app;
