/**
 * CorpID API Gateway
 * Unified entry point for all CorpID services
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import config from './config/database.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'corpid-api-gateway', timestamp: new Date().toISOString() });
});

// JWT Authentication middleware
const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  // Skip auth for health check and docs
  if (req.path === '/health' || req.path.startsWith('/docs')) {
    return next();
  }

  // Internal service token authentication
  const internalToken = req.headers['x-internal-token'];
  if (internalToken && internalToken === config.internalServiceToken) {
    (req as Request & { isInternal: boolean }).isInternal = true;
    return next();
  }

  // JWT authentication
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      (req as Request & { user: unknown }).user = decoded;
      return next();
    } catch {
      return next();
    }
  }

  // Allow unauthenticated access for registration endpoints
  if (req.path.includes('/register') || req.path.includes('/verify-email')) {
    return next();
  }

  // For now, allow all requests (can be tightened later)
  next();
};

app.use(authMiddleware);

// Service routes
const services = config.services;

// Identity routes
app.use('/api/v1/identities', createProxyMiddleware({
  target: services.identity,
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
  onError: (err, req, res) => {
    logger.error('Identity service error:', err);
    res.status(503).json({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Identity service unavailable' } });
  },
}));

// Entities routes
app.use('/api/v1/entities', createProxyMiddleware({
  target: services.identity,
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
}));

// Search routes
app.use('/api/v1/search', createProxyMiddleware({
  target: services.identity,
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
}));

// Verification routes
app.use('/api/v1/verify', createProxyMiddleware({
  target: services.verification,
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
}));

// CI Score routes
app.use('/api/v1/scores', createProxyMiddleware({
  target: services.ciScore,
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
}));

// Passport routes
app.use('/api/v1/passports', createProxyMiddleware({
  target: services.passport,
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
}));

// Trust Graph routes
app.use('/api/v1/graph', createProxyMiddleware({
  target: services.trustGraph,
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
}));

app.use('/api/v1/relationships', createProxyMiddleware({
  target: services.trustGraph,
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
}));

// Monitor routes
app.use('/api/v1/monitor', createProxyMiddleware({
  target: services.monitor,
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
}));

app.use('/api/v1/alerts', createProxyMiddleware({
  target: services.monitor,
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
}));

// Risk routes
app.use('/api/v1/risk', createProxyMiddleware({
  target: services.risk,
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
}));

app.use('/api/v1/fraud', createProxyMiddleware({
  target: services.risk,
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
}));

// Document routes
app.use('/api/v1/documents', createProxyMiddleware({
  target: services.document,
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
}));

// Notification routes
app.use('/api/v1/notifications', createProxyMiddleware({
  target: services.notification,
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
}));

app.use('/api/v1/webhooks', createProxyMiddleware({
  target: services.notification,
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
}));

// Partner routes
app.use('/api/v1/partners', createProxyMiddleware({
  target: services.partner,
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
}));

app.use('/api/v1/integrations', createProxyMiddleware({
  target: services.partner,
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
}));

// Admin routes
app.use('/api/v1/admin', createProxyMiddleware({
  target: services.admin,
  changeOrigin: true,
  pathRewrite: { '^/api/v1': '' },
}));

// CorpID unified route
app.use('/api/v1/corpid', createProxyMiddleware({
  target: services.identity,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/corpid': '' },
}));

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Gateway error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.nodeEnv === 'development' ? err.message : 'Internal server error',
    },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`CorpID API Gateway running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Services:`);
  Object.entries(services).forEach(([name, url]) => {
    logger.info(`  - ${name}: ${url}`);
  });
});

export default app;
