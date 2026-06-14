/**
 * REZ Security Middleware - CORS
 * Copy to: src/middleware/cors.ts
 *
 * Usage in index.ts:
 *   import { corsMiddleware } from './middleware/cors';
 *   app.use(corsMiddleware());
 */

import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGINS = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || 'https://rez.money';
const ALLOWED_ORIGINS = CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);

const LOCALHOST_ORIGINS = ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000'];

/**
 * CORS middleware with secure configuration
 */
export function corsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    // Allow no origin (server-to-server, curl, Postman)
    if (!origin) {
      return next();
    }

    // Allow localhost in development
    if (NODE_ENV !== 'production' && LOCALHOST_ORIGINS.some(o => origin?.startsWith(o))) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Internal-Token, X-Request-Id');
      return next();
    }

    // Production: strict origin check
    if (!ALLOWED_ORIGINS.includes(origin)) {
      res.status(403).json({ error: 'CORS: origin not allowed' });
      return;
    }

    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Internal-Token, X-Request-Id');
    res.header('Access-Control-Max-Age', '86400');

    next();
  };
}
