/**
 * REZ GDPR Service
 * GDPR Compliance Service with consent management, data erasure, and portability
 * Port: 4021
 *
 * Security Features:
 * - Helmet (HTTP security headers)
 * - JWT authentication
 * - Rate limiting
 * - CORS configuration
 * - MongoDB input sanitization
 * - Zod request validation
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import gdprRoutes from './routes/gdpr.routes';
import { privacyPolicyService } from './services/privacyPolicyService';
import { erasureService } from './services/erasureService';

const app = express();
const PORT = process.env.PORT || 4021;
const JWT_SECRET = process.env.JWT_SECRET || 'rez-gdpr-service-secret-change-in-production';

// ============================================
// Security Middleware
// ============================================

// Helmet - HTTP security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'https://rez.money'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
});

app.use(globalLimiter);

// MongoDB input sanitization
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ key }) => {
    console.warn(`Sanitized potentially dangerous key: ${key}`);
  },
}));

// Body parser with size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ============================================
// JWT Authentication Middleware
// ============================================

interface JwtPayload {
  userId: string;
  email?: string;
  iat: number;
  exp: number;
}

const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Authorization header required' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ success: false, error: 'Invalid authorization format. Use: Bearer <token>' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

// ============================================
// Request Logging
// ============================================

app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'GDPR Compliance Service',
    version: '1.0.0',
    description: 'Comprehensive GDPR compliance solution with consent management, data erasure, and portability features',
    endpoints: {
      health: 'GET /api/health',
      requests: {
        create: 'POST /api/requests',
        get: 'GET /api/requests/:id',
        getByUser: 'GET /api/requests/user/:userId',
        update: 'PATCH /api/requests/:id'
      },
      consents: {
        create: 'POST /api/consents',
        batchUpdate: 'POST /api/consents/batch',
        getUserConsents: 'GET /api/consents/user/:userId',
        withdraw: 'DELETE /api/consents/:userId/:consentType',
        getActiveBanner: 'GET /api/consents/banner/active',
        createBanner: 'POST /api/consents/banner',
        getBanners: 'GET /api/consents/banner'
      },
      erasure: {
        request: 'POST /api/erasure/request',
        process: 'POST /api/erasure/process/:requestId',
        verify: 'POST /api/erasure/verify/:requestId'
      },
      export: {
        generate: 'POST /api/export/:userId',
        get: 'GET /api/export/:exportId'
      },
      privacyPolicy: {
        getActive: 'GET /api/privacy-policy/active',
        getById: 'GET /api/privacy-policy/:id',
        create: 'POST /api/privacy-policy',
        publish: 'POST /api/privacy-policy/:id/publish',
        accept: 'POST /api/privacy-policy/:id/accept/:userId',
        userStatus: 'GET /api/privacy-policy/user/:userId/status'
      },
      audit: {
        getUserHistory: 'GET /api/audit/user/:userId',
        export: 'GET /api/audit/export'
      },
      stats: 'GET /api/stats'
    }
  });
});

// ============================================
// Auth Endpoints
// ============================================

// Token generation (for testing)
app.post('/auth/token', authLimiter, async (req: Request, res: Response) => {
  try {
    const { userId, email } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const payload = { userId, email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      token,
      expiresIn: '24h',
    });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ success: false, error: 'Failed to generate token' });
  }
});

// Token verification
app.post('/auth/verify', authLimiter, async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'token is required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    res.json({ success: true, user: decoded });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

app.use('/api', gdprRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

interface ErrorWithStatus extends Error {
  status?: number;
  code?: string;
}

app.use((err: ErrorWithStatus, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  console.error(`[ERROR] ${status}: ${message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(status).json({
    success: false,
    error: message,
    code: err.code,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

async function initializeServices(): Promise<void> {
  console.log('[INIT] Starting GDPR Compliance Service initialization...');

  try {
    const existingPolicy = await privacyPolicyService.findActive();
    if (!existingPolicy) {
      console.log('[INIT] No active privacy policy found. Creating default policy...');
      const defaultPolicy = await privacyPolicyService.createDefaultPolicy();
      await privacyPolicyService.publish(defaultPolicy.id);
      console.log('[INIT] Default privacy policy created and published.');
    } else {
      console.log(`[INIT] Found active privacy policy: ${existingPolicy.version}`);
    }
  } catch (error) {
    console.error('[INIT] Warning: Failed to initialize privacy policy:', error);
  }

  try {
    erasureService.storeUserData('demo_user_001', {
      userId: 'demo_user_001',
      profile: {
        id: 'demo_user_001',
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        phone: '+1-555-0123',
        address: '123 Demo Street, Demo City',
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: new Date().toISOString()
      },
      preferences: {
        language: 'en',
        timezone: 'America/New_York',
        theme: 'light',
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      },
      activity: [
        { action: 'login', timestamp: '2024-01-15T10:00:00Z', ip: '192.168.1.1' },
        { action: 'update_profile', timestamp: '2024-01-16T14:30:00Z' },
        { action: 'view_dashboard', timestamp: '2024-01-17T09:15:00Z' }
      ],
      transactions: [
        { id: 'txn_001', amount: 99.99, currency: 'USD', status: 'completed', date: '2024-01-10' },
        { id: 'txn_002', amount: 149.50, currency: 'USD', status: 'completed', date: '2024-01-12' }
      ],
      communications: [
        { id: 'msg_001', from: 'support@example.com', subject: 'Welcome!', date: '2024-01-01' },
        { id: 'msg_002', from: 'marketing@example.com', subject: 'Special Offer', date: '2024-01-15' }
      ],
      metadata: {
        accountType: 'premium',
        referralSource: 'google',
        tags: ['early-adopter', 'beta-tester']
      }
    });
    console.log('[INIT] Demo user data initialized for testing.');
  } catch (error) {
    console.error('[INIT] Warning: Failed to initialize demo data:', error);
  }

  console.log('[INIT] GDPR Compliance Service initialization complete.');
}

function startServer(): void {
  

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-gdpr-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('GDPR Compliance Service');
    console.log('='.repeat(60));
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API base URL: http://localhost:${PORT}/api`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log('Security features: Helmet, JWT, Rate Limiting, CORS, MongoDB Sanitization, Zod Validation');
    console.log('='.repeat(60));
    console.log('\nAvailable endpoints:');
    console.log('  POST   /api/requests              - Create data request');
    console.log('  GET    /api/requests/:id          - Get request by ID');
    console.log('  GET    /api/requests/user/:id     - Get user requests');
    console.log('  POST   /api/consents             - Grant/deny consent');
    console.log('  POST   /api/consents/batch       - Batch consent update');
    console.log('  GET    /api/consents/user/:id    - Get user consents');
    console.log('  DELETE /api/consents/:uid/:type  - Withdraw consent');
    console.log('  POST   /api/erasure/request      - Request data erasure');
    console.log('  POST   /api/erasure/process/:id - Process erasure');
    console.log('  POST   /api/export/:userId       - Export user data');
    console.log('  GET    /api/privacy-policy/active - Get active policy');
    console.log('  POST   /api/privacy-policy       - Create policy');
    console.log('  GET    /api/stats                - Get statistics');
    console.log('  POST   /auth/token               - Generate JWT token');
    console.log('  POST   /auth/verify             - Verify JWT token');
    console.log('='.repeat(60));
  });
}

async function main(): Promise<void> {
  await initializeServices();
  startServer();
}

main().catch((error) => {
  console.error('[FATAL] Failed to start server:', error);
  process.exit(1);
});

export default app;
