/**
 * Production-Ready CORS Configuration for KHAIRMOVE Services
 */

import cors, { CorsOptions, CorsRequest } from 'cors';

// ============================================
// ALLOWED ORIGINS
// ============================================

function getAllowedOrigins(): string[] {
  const origins = process.env.CORS_ORIGINS;

  if (!origins) {
    // In production, require explicit CORS_ORIGINS
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CORS_ORIGINS environment variable is required in production');
    }
    // In development, allow localhost
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:4000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:4000',
    ];
  }

  return origins.split(',').map(o => o.trim());
}

// ============================================
// CORS OPTIONS
// ============================================

export function createCorsOptions(): CorsOptions {
  const allowedOrigins = getAllowedOrigins();

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      // In production, reject unknown origins
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Internal-Token',
      'X-API-Key',
      'X-User-Id',
      'X-Driver-Id',
      'X-Correlation-ID',
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours - preflight cache
  };
}

// ============================================
// PRE-CONFIGURED CORS MIDDLEWARE
// ============================================

export const corsMiddleware = cors(createCorsOptions());

/**
 * CORS middleware for API routes (stricter)
 */
export const apiCorsMiddleware = cors({
  ...createCorsOptions(),
  credentials: true,
});

/**
 * CORS middleware for public routes (more permissive)
 */
export const publicCorsMiddleware = cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow all origins for public data
    callback(null, true);
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
});

/**
 * CORS middleware for WebSocket connections
 */
export const socketCorsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = getAllowedOrigins();
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    callback(new Error(`WebSocket CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
};
