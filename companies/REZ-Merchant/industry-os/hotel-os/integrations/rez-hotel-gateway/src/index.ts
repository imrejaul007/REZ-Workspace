/**
 * Integration Gateway
 * Port: 3898
 *
 * Service registry, health aggregation, and integration proxy
 * for The Invisible Hotel ecosystem
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import amqp from 'amqplib';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = parseInt(process.env.PORT || '4864', 10);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

// Service Registry
interface ServiceEntry {
  name: string;
  port: number;
  url: string;
  category: 'invisible-hotel' | 'hojai' | 'rabtul' | 'rez-merchant' | 'infrastructure';
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  latency?: number;
  dependencies?: string[];
}

// Service Registry
const serviceRegistry: Map<string, ServiceEntry> = new Map();

// Initialize default services
function initServiceRegistry() {
  // Invisible Hotel Services
  const invisibleHotelServices = [
    { name: 'ai-front-desk', port: 3800, category: 'invisible-hotel' },
    { name: 'minibar-service', port: 3810, category: 'invisible-hotel' },
    { name: 'hotel-restaurant-booking', port: 3811, category: 'invisible-hotel' },
    { name: 'hotel-spa-booking', port: 3812, category: 'invisible-hotel' },
    { name: 'room-controls', port: 3814, category: 'invisible-hotel' },
    { name: 'parking-service', port: 3815, category: 'invisible-hotel' },
    { name: 'lost-found', port: 3816, category: 'invisible-hotel' },
    { name: 'upsell-engine', port: 3817, category: 'invisible-hotel' },
    { name: 'loyalty-system', port: 3818, category: 'invisible-hotel' },
    { name: 'review-manager', port: 3819, category: 'invisible-hotel' },
    { name: 'feedback-survey', port: 3820, category: 'invisible-hotel' },
    { name: 'concierge-desk', port: 3821, category: 'invisible-hotel' },
    { name: 'smart-lock-service', port: 3825, category: 'invisible-hotel' },
    { name: 'predictive-housekeeping', port: 3826, category: 'invisible-hotel' },
    { name: 'zero-checkout-automation', port: 3827, category: 'invisible-hotel' },
    { name: 'pre-arrival-service', port: 3828, category: 'invisible-hotel' },
    { name: 'hotel-os-integration', port: 3899, category: 'invisible-hotel' },
    { name: 'hojai-memory-hotel', port: 4720, category: 'invisible-hotel' },
    { name: 'voice-hotel-agent', port: 4870, category: 'invisible-hotel' },
  ];

  // HOJAI Services
  const hojaiServices = [
    { name: 'hojai-memory', port: 4520, category: 'hojai' },
    { name: 'hojai-genie', port: 4703, category: 'hojai' },
    { name: 'hojai-staybot', port: 4840, category: 'hojai' },
  ];

  // RABTUL Services
  const rabtulServices = [
    { name: 'rez-payment', port: 4001, category: 'rabtul' },
    { name: 'rez-auth', port: 4002, category: 'rabtul' },
    { name: 'rez-wallet', port: 4004, category: 'rabtul' },
  ];

  // REZ-Merchant Services
  const rezMerchantServices = [
    { name: 'rez-pms', port: 4031, category: 'rez-merchant' },
    { name: 'rez-housekeeping', port: 4021, category: 'rez-merchant' },
    { name: 'rez-booking', port: 4042, category: 'rez-merchant' },
  ];

  // Infrastructure (external services - check via docker/nc, not HTTP)

  // Register all services (excluding infrastructure - use docker/nc to check)
  [...invisibleHotelServices, ...hojaiServices, ...rabtulServices, ...rezMerchantServices].forEach(svc => {
    serviceRegistry.set(svc.name, {
      name: svc.name,
      port: svc.port,
      url: `http://localhost:${svc.port}`,
      category: svc.category as ServiceEntry['category'],
      status: 'down',
      lastCheck: new Date()
    });
  });
}

// Health check a service
async function checkService(name: string): Promise<ServiceEntry> {
  const entry = serviceRegistry.get(name);
  if (!entry) {
    throw new Error(`Service ${name} not found in registry`);
  }

  const start = Date.now();
  try {
    const response = await fetch(`${entry.url}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });

    entry.status = response.ok ? 'healthy' : 'degraded';
    entry.latency = Date.now() - start;
    entry.lastCheck = new Date();
  } catch (error) {
    entry.status = 'down';
    entry.lastCheck = new Date();
  }

  serviceRegistry.set(name, entry);
  return entry;
}

// Check all services
async function checkAllServices(): Promise<void> {
  const promises = Array.from(serviceRegistry.keys()).map(name => checkService(name));
  await Promise.allSettled(promises);
}

// Proxy request to another service
async function proxyRequest(targetService: string, path: string, method: string, body?: any): Promise<any> {
  const entry = serviceRegistry.get(targetService);
  if (!entry) {
    throw new Error(`Service ${targetService} not found`);
  }

  if (entry.status === 'down') {
    throw new Error(`Service ${targetService} is not available`);
  }

  const url = `${entry.url}${path}`;
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();
  return data;
}

// ============ REST API ============

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'integration-gateway',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Get all services
app.get('/services', (req, res) => {
  const services = Array.from(serviceRegistry.values());
  res.json({ services });
});

// Get services by category
app.get('/services/:category', (req, res) => {
  const category = req.params.category;
  const services = Array.from(serviceRegistry.values()).filter(s => s.category === category);
  res.json({ services, category });
});

// Get single service
app.get('/services/:category/:name', async (req, res) => {
  const { category, name } = req.params;
  const entry = serviceRegistry.get(name);

  if (!entry) {
    return res.status(404).json({ error: 'Service not found' });
  }

  // Refresh health check
  await checkService(name);
  res.json({ service: serviceRegistry.get(name) });
});

// Health check all services
app.post('/services/check', async (req, res) => {
  await checkAllServices();
  const services = Array.from(serviceRegistry.values());
  res.json({ services, checkedAt: new Date() });
});

// Proxy endpoint
app.all('/proxy/:service/*', async (req: Request, res: Response) => {
  const { service } = req.params;
  const path = '/' + req.params[0];
  const method = req.method;

  try {
    const result = await proxyRequest(service, path, method, req.body);
    res.json(result);
  } catch (error) {
    res.status(503).json({ error: String(error) });
  }
});

// Get ecosystem summary
app.get('/ecosystem/summary', async (req, res) => {
  await checkAllServices();

  const services = Array.from(serviceRegistry.values());
  const byCategory = services.reduce((acc, svc) => {
    if (!acc[svc.category]) acc[svc.category] = { total: 0, healthy: 0, degraded: 0, down: 0 };
    acc[svc.category][svc.status]++;
    acc[svc.category].total++;
    return acc;
  }, {} as Record<string, any>);

  const totalHealthy = services.filter(s => s.status === 'healthy').length;
  const totalServices = services.length;

  res.json({
    summary: {
      totalServices,
      healthy: totalHealthy,
      coverage: `${((totalHealthy / totalServices) * 100).toFixed(1)}%`
    },
    byCategory,
    services
  });
});

// Guest journey simulation
app.get('/ecosystem/guest-journey/:guestId', async (req, res) => {
  const { guestId } = req.params;

  // Simulate checking key services for guest journey
  const journey = {
    preArrival: { service: 'pre-arrival-service', status: 'unknown' },
    checkIn: { service: 'smart-lock-service', status: 'unknown' },
    memory: { service: 'hojai-memory-hotel', status: 'unknown' },
    concierge: { service: 'ai-front-desk', status: 'unknown' },
    voice: { service: 'voice-hotel-agent', status: 'unknown' },
    checkout: { service: 'zero-checkout-automation', status: 'unknown' }
  };

  for (const [key, value] of Object.entries(journey)) {
    try {
      const entry = serviceRegistry.get(value.service);
      if (entry) {
        await checkService(value.service);
        journey[key as keyof typeof journey].status = serviceRegistry.get(value.service)!.status;
      }
    } catch (e) {
      journey[key as keyof typeof journey].status = 'error';
    }
  }

  res.json({ guestId, journey });
});

// Initialize
initServiceRegistry();

// Start health check loop
setInterval(() => {
  checkAllServices().catch(() => {});
}, 30000); // Check every 30 seconds

// Initial check
checkAllServices().then(() => {
  logger.info('Integration Gateway initialized');
  logger.info(`Registered ${serviceRegistry.size} services`);
}).catch(() => {
  logger.warn('Initial health check failed, will retry');
});

app.listen(PORT, () => {
  logger.info(`Integration Gateway running on port ${PORT}`);
  logger.info(`Dashboard: http://localhost:${PORT}/ecosystem/summary`);
});

export { app };
