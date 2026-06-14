/**
 * REZ-Consumer Security Headers Middleware
 *
 * Comprehensive security headers for production deployment
 *
 * Usage:
 * import { securityHeaders } from '@rez-consumer/security-middleware';
 * app.use(securityHeaders);
 */

import helmet from 'helmet';

/**
 * Security headers middleware
 * Should be used before other middleware in production
 */
export function securityHeaders() {
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        // Report violations
        reportUri: process.env.CSP_REPORT_URI,
      },
      reportOnly: process.env.NODE_ENV !== 'production', // CSP in report-only mode for non-production
    },

    // HTTP Strict Transport Security (HSTS)
    // Enforces HTTPS for 1 year with preload
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },

    // X-Frame-Options
    // Prevents clickjacking attacks
    frameguard: {
      action: 'deny',
    },

    // X-Content-Type-Options
    // Prevents MIME type sniffing
    noSniff: true,

    // X-XSS-Protection
    // Legacy XSS filter (modern browsers use CSP)
    xssFilter: true,

    // Referrer Policy
    // Controls how much referrer info is sent
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

    // X-Permitted-Cross-Domain-Policies
    // Controls Adobe Flash cross-domain requests
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none',
    },

    // Remove X-Powered-By header
    poweredBy: false,
  });
}

/**
 * CORS configuration for production
 */
export function productionCors() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://rez.app',
    'https://rez.money',
    'https://admin.rez.money',
    'https://merchant.rez.money',
  ];

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is allowed
      const isAllowed = allowedOrigins.some(allowed =>
        origin.includes(allowed) || origin.endsWith('.onrender.com')
      );

      if (isAllowed) {
        return callback(null, true);
      }

      // In development, allow all
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
    credentials: true,
    maxAge: 86400, // 24 hours
  };
}

/**
 * Rate limiting configuration for production
 */
export function rateLimitConfig(options?: {
  windowMs?: number;
  max?: number;
  authMax?: number;
}) {
  const {
    windowMs = 60 * 1000, // 1 minute
    max = 100, // 100 requests per window
    authMax = 10, // 10 requests per 15 minutes for auth endpoints
  } = options || {};

  return {
    standard: {
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many requests, please try again later.' },
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: authMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many authentication attempts, please try again later.' },
    },
  };
}

/**
 * Security headers for API responses
 * Add custom headers to all responses
 */
export function responseSecurityHeaders() {
  return (req: any, res: any, next: any) => {
    // Remove server header
    res.removeHeader('X-Powered-By');

    // Add security headers
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    });

    next();
  };
}
