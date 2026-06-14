import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Environment validation
const envSchema = z.object({
  PORT: z.string().default('4700'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().default('rez-home-secret-key'),
  RABTUL_AUTH_URL: z.string().default('http://localhost:4001'),
  BOOKING_SERVICE_URL: z.string().default('http://localhost:4701'),
  SERVICE_CATALOG_URL: z.string().default('http://localhost:4702'),
  PROVIDER_SERVICE_URL: z.string().default('http://localhost:4703'),
  PAYMENT_SERVICE_URL: z.string().default('http://localhost:4704'),
});

const env = envSchema.parse(process.env);

// Service URLs for proxy
const serviceUrls = {
  booking: env.BOOKING_SERVICE_URL,
  service: env.SERVICE_CATALOG_URL,
  provider: env.PROVIDER_SERVICE_URL,
  payment: env.PAYMENT_SERVICE_URL,
};

// JWT Payload type
interface JWTPayload {
  userId: string;
  phone: string;
  role: 'user' | 'provider' | 'admin';
  iat?: number;
  exp?: number;
}

// Initialize Express app
const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).requestId = uuidv4();
  res.setHeader('X-Request-ID', (req as any).requestId);
  next();
});

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      requestId: (req as any).requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - start
    });
  });
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-home-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-home-gateway',
    version: '1.0.0',
    services: {
      booking: serviceUrls.booking,
      service: serviceUrls.service,
      provider: serviceUrls.provider,
      payment: serviceUrls.payment
    }
  });
});

// JWT Authentication middleware
const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header required' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    (req as any).user = decoded;
    next();
  } catch (error) {
    logger.warn({ message: 'Invalid token', token: token.substring(0, 20) + '...' });
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Optional JWT authentication (doesn't fail if no token)
const optionalJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
      (req as any).user = decoded;
    } catch (error) {
      // Token invalid but continue without user
      logger.debug({ message: 'Optional JWT invalid', token: token.substring(0, 20) + '...' });
    }
  }
  next();
};

// Token verification endpoint
app.post('/api/v1/auth/verify', (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ error: 'Token is required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    res.json({
      valid: true,
      user: {
        userId: decoded.userId,
        role: decoded.role
      }
    });
  } catch (error) {
    res.json({ valid: false, error: 'Invalid or expired token' });
  }
});

// Service proxy helper
const proxyToService = async (
  req: Request,
  res: Response,
  serviceName: keyof typeof serviceUrls,
  options: { method?: string; path?: string } = {}
): Promise<void> => {
  const baseUrl = serviceUrls[serviceName];
  const path = options.path || req.path.replace('/api/v1', '');
  const url = `${baseUrl}${path}`;

  try {
    const axios = (await import('axios')).default;
    const response = await axios({
      method: options.method || req.method,
      url,
      data: req.method !== 'GET' ? req.body : undefined,
      params: req.method === 'GET' ? req.query : undefined,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': (req as any).requestId,
        ...((req as any).user ? { 'X-User-ID': (req as any).user.userId } : {})
      },
      timeout: 30000
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    logger.error({
      requestId: (req as any).requestId,
      service: serviceName,
      error: error.message
    });

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(502).json({ error: 'Service unavailable' });
    }
  }
};

// Booking routes
app.post('/api/v1/bookings', authenticateJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'booking', { method: 'POST', path: '/api/v1/bookings' });
});

app.get('/api/v1/bookings', authenticateJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'booking', { method: 'GET', path: '/api/v1/bookings' });
});

app.get('/api/v1/bookings/:id', authenticateJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'booking', { method: 'GET', path: `/api/v1/bookings/${req.params.id}` });
});

app.patch('/api/v1/bookings/:id', authenticateJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'booking', { method: 'PATCH', path: `/api/v1/bookings/${req.params.id}` });
});

app.delete('/api/v1/bookings/:id', authenticateJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'booking', { method: 'DELETE', path: `/api/v1/bookings/${req.params.id}` });
});

app.post('/api/v1/bookings/:id/track', authenticateJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'booking', { method: 'POST', path: `/api/v1/bookings/${req.params.id}/track` });
});

app.post('/api/v1/bookings/:id/reschedule', authenticateJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'booking', { method: 'POST', path: `/api/v1/bookings/${req.params.id}/reschedule` });
});

app.post('/api/v1/bookings/:id/complete', authenticateJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'booking', { method: 'POST', path: `/api/v1/bookings/${req.params.id}/complete` });
});

// Service catalog routes
app.get('/api/v1/services', optionalJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'service', { method: 'GET', path: '/api/v1/services' });
});

app.get('/api/v1/services/:id', optionalJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'service', { method: 'GET', path: `/api/v1/services/${req.params.id}` });
});

app.get('/api/v1/services/categories', optionalJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'service', { method: 'GET', path: '/api/v1/services/categories' });
});

app.get('/api/v1/services/categories/:id', optionalJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'service', { method: 'GET', path: `/api/v1/services/categories/${req.params.id}` });
});

app.get('/api/v1/services/search', optionalJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'service', { method: 'GET', path: '/api/v1/services/search' });
});

app.get('/api/v1/services/:id/pricing', optionalJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'service', { method: 'GET', path: `/api/v1/services/${req.params.id}/pricing` });
});

app.post('/api/v1/services/estimate', optionalJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'service', { method: 'POST', path: '/api/v1/services/estimate' });
});

// Provider routes
app.post('/api/v1/providers/register', (req: Request, res: Response) => {
  proxyToService(req, res, 'provider', { method: 'POST', path: '/api/v1/providers/register' });
});

app.get('/api/v1/providers/:id', optionalJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'provider', { method: 'GET', path: `/api/v1/providers/${req.params.id}` });
});

app.patch('/api/v1/providers/:id', authenticateJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'provider', { method: 'PATCH', path: `/api/v1/providers/${req.params.id}` });
});

app.get('/api/v1/providers/:id/availability', optionalJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'provider', { method: 'GET', path: `/api/v1/providers/${req.params.id}/availability` });
});

app.post('/api/v1/providers/:id/availability', authenticateJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'provider', { method: 'POST', path: `/api/v1/providers/${req.params.id}/availability` });
});

app.get('/api/v1/providers/:id/earnings', authenticateJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'provider', { method: 'GET', path: `/api/v1/providers/${req.params.id}/earnings` });
});

app.get('/api/v1/providers/:id/reviews', optionalJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'provider', { method: 'GET', path: `/api/v1/providers/${req.params.id}/reviews` });
});

app.post('/api/v1/providers/:id/reviews', authenticateJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'provider', { method: 'POST', path: `/api/v1/providers/${req.params.id}/reviews` });
});

app.get('/api/v1/providers/nearby', optionalJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'provider', { method: 'GET', path: '/api/v1/providers/nearby' });
});

// Payment routes
app.post('/api/v1/payments/initiate', authenticateJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'payment', { method: 'POST', path: '/api/v1/payments/initiate' });
});

app.get('/api/v1/payments/:id', authenticateJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'payment', { method: 'GET', path: `/api/v1/payments/${req.params.id}` });
});

app.post('/api/v1/payments/:id/refund', authenticateJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'payment', { method: 'POST', path: `/api/v1/payments/${req.params.id}/refund` });
});

app.get('/api/v1/payments/settlement', authenticateJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'payment', { method: 'GET', path: '/api/v1/payments/settlement' });
});

app.post('/api/v1/payments/dispute', authenticateJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'payment', { method: 'POST', path: '/api/v1/payments/dispute' });
});

app.get('/api/v1/payments/wallet/:providerId', authenticateJWT, (req: Request, res: Response) => {
  proxyToService(req, res, 'payment', { method: 'GET', path: `/api/v1/payments/wallet/${req.params.providerId}` });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    requestId: (req as any).requestId,
    error: err.message,
    stack: err.stack
  });

  res.status(500).json({
    error: 'Internal server error',
    requestId: (req as any).requestId
  });
});

// Start server
const PORT = parseInt(env.PORT, 10);

app.listen(PORT, () => {
  logger.info(`REZ-Home Gateway started on port ${PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`Services:`, serviceUrls);
});

export default app;
