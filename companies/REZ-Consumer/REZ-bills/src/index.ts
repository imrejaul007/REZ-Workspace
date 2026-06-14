/**
 * REZ Bills - Smart Bill Payment & Receipt Management
 * Pay bills, scan receipts, track warranties, earn cashback
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

dotenv.config();

import { logger } from './middleware/logger.js';
import { billsRouter } from './routes/bills.js';
import { openapiSpecification } from './swagger.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3012', 10);

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Production security headers
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // HTTP Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  // X-Frame-Options
  frameguard: {
    action: 'deny',
  },
  // X-Content-Type-Options
  noSniff: true,
  // X-XSS-Protection
  xssFilter: true,
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

app.use(cors({
  origin: isProduction
    ? ['https://rez.app', 'https://rez.money', 'https://admin.rez.money']
    : '*',
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use('/api/', limiter);

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'REZ Bills API Documentation',
}));

// API JSON spec endpoint
app.get('/api-spec.json', (req, res) => {
  res.json(openapiSpecification);
});

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'rez-bills',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/bills', billsRouter);

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  logger.error(err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`REZ Bills started on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

export default app;
