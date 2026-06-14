/**
 * REZ Data Enrichment Service
 * Clay parity - B2B data enrichment and CRM enrichment
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import winston from 'winston';
import { enrichmentRouter } from './routes/enrichment.routes';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configuration
const configSchema = z.object({
  port: z.string().optional().transform(val => val ? parseInt(val, 10) : 4141),
  nodeEnv: z.string().optional().default('development'),
  corsOrigins: z.string().optional().default('http://localhost:3000'),
  logLevel: z.string().optional().default('info'),
  rateLimitWindowMs: z.string().optional().transform(val => val ? parseInt(val, 10) : 60000),
  rateLimitMaxRequests: z.string().optional().transform(val => val ? parseInt(val, 10) : 100),
});

type Config = z.infer<typeof configSchema>;

function loadConfig(): Config & { serviceName: string; version: string } {
  const result = configSchema.safeParse({
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    corsOrigins: process.env.ALLOWED_ORIGINS,
    logLevel: process.env.LOG_LEVEL,
    rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
  });

  if (!result.success) {
    console.error('Configuration validation failed:', result.error.format());
    process.exit(1);
  }

  return {
    ...result.data,
    serviceName: 'rez-data-enrichment-service',
    version: '1.0.0'
  };
}

const config = loadConfig();
const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple())
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

const app: Express = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: config.corsOrigins.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Request logging
app.use((req: Request, _res: Response, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip, userAgent: req.get('user-agent') });
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health checks
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: config.serviceName,
    version: config.version,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health/detailed', (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'healthy',
    service: config.serviceName,
    version: config.version,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
    },
    providers: ['apollo', 'hunter', 'clearbit', 'zoominfo', 'linkedin', 'crunchbase', 'builtwith', 'wappalyzer']
  });
});

// API routes
app.use('/api/v1/enrich', enrichmentRouter);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: config.serviceName,
    version: config.version,
    description: 'B2B data enrichment service with waterfall enrichment, CRM sync, and multi-provider data lookup',
    endpoints: {
      health: 'GET /health',
      enrichContact: 'POST /api/v1/enrich/contact',
      enrichCompany: 'POST /api/v1/enrich/company',
      bulkContacts: 'POST /api/v1/enrich/bulk/contacts',
      bulkCompanies: 'POST /api/v1/enrich/bulk/companies',
      verifyEmail: 'POST /api/v1/enrich/verify/email',
      findPhone: 'POST /api/v1/enrich/find/phone',
      providers: 'GET /api/v1/enrich/providers'
    },
    providers: ['apollo', 'hunter', 'clearbit', 'zoominfo', 'linkedin', 'crunchbase', 'builtwith', 'wappalyzer']
  });
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
});

// Start server
let server: ReturnType<Express['listen']> | null = null;

function startServer(): void {
  try {
    server = app.listen(config.port, () => {
      logger.info(`REZ Data Enrichment Service started on port ${config.port}`);
      logger.info('Endpoints: enrich/contact, enrich/company, bulk, verify, find/phone');
    });

    process.on('SIGTERM', () => { logger.info('SIGTERM received'); server?.close(); process.exit(0); });
    process.on('SIGINT', () => { logger.info('SIGINT received'); server?.close(); process.exit(0); });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module || process.argv[1]?.endsWith('index.ts')) {
  startServer();
}

export { app, startServer, config };
