import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';

// Import routes
import brandRoutes from './routes/brand.routes';
import clientRoutes from './routes/client.routes';
import portalRoutes from './routes/portal.routes';
import invoiceRoutes from './routes/invoice.routes';
import analyticsRoutes from './routes/analytics.routes';

// Import logger
import logger from './utils/logger';

// Create Express app
const app = express();

// Get port from environment or default
const PORT = parseInt(process.env.PORT || '4802', 10);

// Trust proxy (for load balancers)
app.set('trust proxy', 1);

// ============== Middleware ==============

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.headers['x-request-id']);
  next();
});

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:8080'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy violation: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Tenant-ID'],
}));

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
  skip: (req: Request) => req.url === '/health',
}));

// ============== Routes ==============

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'white-label-portal',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API info
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'ReZ White-Label Portal API',
    version: '1.0.0',
    description: 'White-label client portal service for agencies',
    endpoints: {
      health: '/health',
      branding: {
        tenants: '/api/branding/tenants',
        branding: '/api/branding/branding/:tenantId',
        domains: '/api/branding/domains',
        theme: '/api/branding/branding/:tenantId/theme',
      },
      clients: {
        list: '/api/clients/tenant/:tenantId',
        create: '/api/clients',
        get: '/api/clients/:id',
        update: '/api/clients/:id',
        delete: '/api/clients/:id',
      },
      portal: {
        dashboard: '/api/portal/page/:tenantId/dashboard',
        campaigns: '/api/portal/page/:tenantId/campaigns',
        reports: '/api/portal/page/:tenantId/reports',
        invoices: '/api/portal/page/:tenantId/invoices',
        settings: '/api/portal/page/:tenantId/settings',
        embed: '/api/portal/embed/dashboard',
      },
      invoices: {
        list: '/api/invoices/tenant/:tenantId',
        create: '/api/invoices',
        get: '/api/invoices/:id',
        update: '/api/invoices/:id',
        delete: '/api/invoices/:id',
        send: '/api/invoices/:id/send',
        pay: '/api/invoices/:id/pay',
      },
      analytics: {
        overview: '/api/analytics/:tenantId/overview',
        campaigns: '/api/analytics/:tenantId/campaigns',
        trends: '/api/analytics/:tenantId/trends',
        realtime: '/api/analytics/:tenantId/realtime',
        platforms: '/api/analytics/:tenantId/platforms',
        export: '/api/analytics/:tenantId/export/:type',
      },
    },
  });
});

// Mount routes
app.use('/api/branding', brandRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/analytics', analyticsRoutes);

// ============== Static Files (for uploaded assets) ==============

// Serve uploaded files
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

// ============== Error Handling ==============

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: {
      requestId: req.headers['x-request-id'],
      timestamp: new Date(),
    },
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.headers['x-request-id'],
  });

  // Handle CORS errors
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'CORS policy violation',
      },
      meta: {
        requestId: req.headers['x-request-id'],
        timestamp: new Date(),
      },
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An internal error occurred' 
        : err.message,
    },
    meta: {
      requestId: req.headers['x-request-id'],
      timestamp: new Date(),
    },
  });
});

// ============== Graceful Shutdown ==============

const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============== Start Server ==============

const server = app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ReZ White-Label Portal Service                            ║
║   ─────────────────────────────                             ║
║                                                              ║
║   Server running on port ${PORT}                               ║
║   Environment: ${process.env.NODE_ENV || 'development'}                                ║
║                                                              ║
║   Endpoints:                                                 ║
║   • Health:     http://localhost:${PORT}/health                ║
║   • API Info:   http://localhost:${PORT}/api                  ║
║   • Branding:   http://localhost:${PORT}/api/branding          ║
║   • Clients:    http://localhost:${PORT}/api/clients           ║
║   • Portal:     http://localhost:${PORT}/api/portal            ║
║   • Invoices:   http://localhost:${PORT}/api/invoices          ║
║   • Analytics:  http://localhost:${PORT}/api/analytics         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Export app for testing
export default app;
