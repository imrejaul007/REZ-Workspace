/**
 * REZ Unified API Gateway
 * Single entry point for all REZ/HOJAI services
 * Port: 4000
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import winston from 'winston';
import axios from 'axios';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
  defaultMeta: { service: 'unified-gateway' },
});

const PORT = parseInt(process.env.PORT || '4000', 10);
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

// Service registry
const SERVICES = {
  // RABTUL Core
  'auth': { url: 'http://localhost:4002', path: '/api' },
  'payment': { url: 'http://localhost:4001', path: '/api' },
  'wallet': { url: 'http://localhost:4004', path: '/api' },
  'notifications': { url: 'http://localhost:4011', path: '/api' },

  // HOJAI Relationship OS
  'rip': { url: 'http://localhost:4800', path: '/api' },
  'webhook': { url: 'http://localhost:4090', path: '/api' },
  'voice': { url: 'http://localhost:4500', path: '/api' },

  // HOJAI Industry AI
  'waitron': { url: 'http://localhost:4820', path: '/api' },
  'staybot': { url: 'http://localhost:4840', path: '/api' },
  'carecode': { url: 'http://localhost:4102', path: '/api' },
  'fitmind': { url: 'http://localhost:4801', path: '/api' },
  'teammind': { url: 'http://localhost:4803', path: '/api' },
  'glamai': { url: 'http://localhost:4860', path: '/api' },
  'fleetiq': { url: 'http://localhost:4814', path: '/api' },
  'neighborai': { url: 'http://localhost:4806', path: '/api' },
  'shopflow': { url: 'http://localhost:4830', path: '/api' },
  'ledgerai': { url: 'http://localhost:4815', path: '/api' },
  'learniq': { url: 'http://localhost:4811', path: '/api' },
  'tripmind': { url: 'http://localhost:4809', path: '/api' },
  'propflow': { url: 'http://localhost:4807', path: '/api' },
  'franchiseiq': { url: 'http://localhost:4816', path: '/api' },
  'prodflow': { url: 'http://localhost:4817', path: '/api' },

  // REZ Merchant
  'restaurant-crm': { url: 'http://localhost:4007', path: '/api' },
  'salon-crm': { url: 'http://localhost:4004', path: '/api' },
  'fitness': { url: 'http://localhost:4005', path: '/api' },
  'healthcare': { url: 'http://localhost:4009', path: '/api' },
  'booking': { url: 'http://localhost:4042', path: '/api' },
  'pos': { url: 'http://localhost:3100', path: '/api' },
  'gift-card': { url: 'http://localhost:4047', path: '/api' },
  'spa': { url: 'http://localhost:4049', path: '/api' },
  'laundry': { url: 'http://localhost:4048', path: '/api' },

  // REZ Intelligence
  'intelligence': { url: 'http://localhost:4100', path: '/api' },
};

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip, query: req.query });
  next();
});

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
app.use(limiter);

// ============================================
// AUTH MIDDLEWARE
// ============================================

async function authenticate(req: Request, res: Response, next: NextFunction) {
  // Skip auth for health checks
  if (req.path.startsWith('/health')) return next();

  // Skip auth for auth service itself
  if (req.path.startsWith('/auth/')) return next();

  const internalToken = req.headers['x-internal-token'];
  if (internalToken === INTERNAL_TOKEN) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
  }

  try {
    const token = authHeader.substring(7);
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/validate`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000,
    });
    (req as any).user = response.data.user || response.data;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN' } });
  }
}

app.use(authenticate);

// ============================================
// HEALTH CHECKS
// ============================================

app.get('/health', async (req, res) => {
  const health: any = {
    status: 'healthy',
    service: 'unified-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {},
  };

  // Check each service
  const checks = Object.entries(SERVICES).map(async ([name, service]: [string, any]) => {
    try {
      const response = await axios.get(`${service.url}${service.path}/health`, {
        timeout: 2000,
      });
      health.services[name] = 'up';
    } catch {
      health.services[name] = 'down';
    }
  });

  await Promise.all(checks);

  const allUp = Object.values(health.services).every(s => s === 'up');
  if (!allUp) health.status = 'degraded';

  res.json(health);
});

app.get('/health/live', (req, res) => res.json({ status: 'alive' }));
app.get('/health/ready', (req, res) => res.json({ status: 'ready' }));

// ============================================
// SERVICE REGISTRY
// ============================================

app.get('/services', (req, res) => {
  const serviceList = Object.entries(SERVICES).map(([name, config]) => ({
    name,
    url: config.url,
    docs: `${config.url}/health`,
  }));

  res.json({
    success: true,
    data: {
      services: serviceList,
      total: serviceList.length,
    },
  });
});

// ============================================
// DYNAMIC PROXY ROUTING
// ============================================

// Pattern: /:service/* -> proxy to service
app.use('/:service/:path(*)', createProxyMiddleware({
  changeOrigin: true,
  pathRewrite: (path, req) => {
    const service = (req.params as any).service;
    const serviceConfig = SERVICES[service as keyof typeof SERVICES];
    if (!serviceConfig) return path;
    return path.replace(`/${service}`, '');
  },
  target: (req) => {
    const service = (req.params as any).service;
    return SERVICES[service as keyof typeof SERVICES]?.url || 'http://localhost:4000';
  },
  onProxyReq: (proxyReq, req) => {
    // Forward headers
    proxyReq.setHeader('X-Internal-Token', INTERNAL_TOKEN);
    if ((req as any).user) {
      proxyReq.setHeader('X-User-Id', (req as any).user.userId || (req as any).user.id || '');
    }
    proxyReq.setHeader('X-Forwarded-For', req.ip || '');
  },
  onError: (err, req, res) => {
    logger.error('Proxy error:', err);
    (res as Response).status(502).json({
      success: false,
      error: { code: 'BAD_GATEWAY', message: 'Service unavailable' },
    });
  },
}));

// Root path
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'REZ Unified Gateway',
      version: '1.0.0',
      description: 'Single entry point for all REZ/HOJAI services',
      docs: '/services',
      health: '/health',
      uptime: process.uptime(),
    },
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Service ${req.params.service} not found` },
    availableServices: Object.keys(SERVICES),
  });
});

const shutdown = () => {
  logger.info('Shutting down...');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

app.listen(PORT, () => {
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('  REZ Unified API Gateway');
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info(`  Port: ${PORT}`);
  logger.info(`  Services registered: ${Object.keys(SERVICES).length}`);
  logger.info('═══════════════════════════════════════════════════════════');
  Object.keys(SERVICES).forEach(name => {
    logger.info(`  ${name.padEnd(20)} → ${SERVICES[name as keyof typeof SERVICES].url}`);
  });
  logger.info('═══════════════════════════════════════════════════════════');
});