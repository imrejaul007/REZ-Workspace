/**
 * REZ Security - Example index.ts Usage
 * Copy relevant sections to your service's src/index.ts
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongoose';
import rateLimit from 'express-rate-limit';

// Security middleware
import { securityHeaders } from './middleware/security';
import { corsMiddleware } from './middleware/cors';
import { requestIdMiddleware } from './middleware/security';
import { apiLimiter, strictLimiter } from './middleware/rateLimit';
import { requireInternalAuth } from './middleware/auth';
import { sanitizeInput } from './middleware/sanitize';
import mongoSanitize from 'mongo-sanitize';

const app = express();

// === SECURITY MIDDLEWARE (ORDER MATTERS) ===

// 1. Trust proxy (for rate limiting)
app.set('trust proxy', 1);

// 2. Security headers
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
    },
  },
});

// 3. Request ID for tracing
app.use(requestIdMiddleware);

// 4. CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://rez.money'],
  credentials: true,
}));

// 5. Body parsing with size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 6. MongoDB sanitize (NoSQL injection prevention)
app.use(mongoSanitize());

// 7. Rate limiting
app.use('/api', apiLimiter);

// 8. Auth middleware (apply to protected routes)
app.use('/api', requireInternalAuth);

// 9. Routes
app.use('/api', routes);

// 10. Strict rate limiting for sensitive ops
app.post('/api/auth/login', strictLimiter, loginHandler);
app.post('/api/payments', strictLimiter, paymentHandler);

// 11. Error handling
app.use(errorHandler);

export default app;
