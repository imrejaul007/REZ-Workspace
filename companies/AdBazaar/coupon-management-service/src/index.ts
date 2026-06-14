/**
 * coupon-management-service - Promo code and discount management
 * Port: 5100
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import logger from 'utils/logger.js';
import { register, httpRequestDuration, httpRequestTotal } from './utils/metrics';
import couponRoutes from './routes/coupon.routes';

const app = express();
const PORT = parseInt(process.env.PORT || '5100', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/coupon-management';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://rez.money,https://admin.rez.money,https://ads.rez.money').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.some(allowed => origin.includes(allowed))) return callback(null, true);
    callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
}));

app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", "data:", "https:"] } } }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, message: { error: 'Too many requests' }, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    httpRequestDuration.observe({ method: req.method, route, status_code: res.statusCode }, duration);
    httpRequestTotal.inc({ method: req.method, route, status_code: res.statusCode });
  });
  next();
});

app.get('/health', async (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  res.json({ status: mongoOk ? 'healthy' : 'degraded', service: 'coupon-management-service', version: '1.0.0', mongodb: mongoOk ? 'connected' : 'disconnected' });
});

app.get('/ready', async (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  if (!mongoOk) { res.status(503).json({ ready: false, error: 'MongoDB not connected' }); return; }
  res.json({ ready: true });
});

app.get('/metrics', async (_req, res) => {
  try { res.set('Content-Type', register.contentType); res.end(await register.metrics()); } catch { res.status(500).end(); }
});

app.use('/api/coupons', couponRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info(`[${new Date().toISOString()}] Connected to MongoDB`);
    app.listen(PORT, () => { logger.info(`[${new Date().toISOString()}] coupon-management-service running on port ${PORT}`); });
  } catch (error) {
    logger.error('Startup error:', { error: error instanceof Error ? error.message : 'Unknown' });
    process.exit(1);
  }
}

start();

export default app;