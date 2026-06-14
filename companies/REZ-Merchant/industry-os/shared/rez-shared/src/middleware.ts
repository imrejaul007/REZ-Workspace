import { RequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { createLogger } from './logger';
import { createRateLimiter } from './rateLimiter';
import { createErrorHandler, createNotFoundHandler } from './response';

const logger = createLogger({ serviceName: 'middleware' });

export interface MiddlewareOptions {
  serviceName: string;
  corsOrigins?: string[] | '*';
  rateLimitWindowMs?: number;
  rateLimitMax?: number;
  helmetConfig?: Parameters<typeof helmet>[0];
}

/**
 * Create standard middleware stack for REZ services
 */
export function createMiddlewareStack(options: MiddlewareOptions): RequestHandler[] {
  const {
    serviceName,
    corsOrigins = process.env.NODE_ENV === 'production' ? [] : ['*'],
    rateLimitWindowMs = 15 * 60 * 1000,
    rateLimitMax = 100,
    helmetConfig,
  } = options;

  const middlewares: RequestHandler[] = [];

  // Security headers
  middlewares.push(helmet(helmetConfig) as RequestHandler);

  // CORS
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (corsOrigins === '*' || corsOrigins.includes('*')) {
        return callback(null, true);
      }

      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Service-Name'],
  };
  middlewares.push(cors(corsOptions) as RequestHandler);

  // Request logging
  const morganFormat = process.env.NODE_ENV === 'production'
    ? ':method :url :status :res[content-length] - :response-time ms'
    : 'dev';

  middlewares.push((req, res, next) => {
    const originalSend = res.send;
    res.send = function (body) {
      logger.info(`${req.method} ${req.path} ${res.statusCode}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      return originalSend.call(this, body);
    };
    next();
  } as RequestHandler);

  // Body parsing
  middlewares.push(express.json({ limit: '10mb' }) as RequestHandler);
  middlewares.push(express.urlencoded({ extended: true, limit: '10mb' }) as RequestHandler);

  // Rate limiting
  middlewares.push(createRateLimiter({
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
  }));

  return middlewares;
}

/**
 * Create shutdown handler for graceful shutdown
 */
export function createShutdownHandler(
  cleanup: () => Promise<void>
): () => Promise<void> {
  let isShuttingDown = false;

  return async () => {
    if (isShuttingDown) {
      logger.warn('Shutdown already in progress');
      return;
    }

    isShuttingDown = true;
    logger.info('Received shutdown signal, starting graceful shutdown...');

    try {
      // Give time for in-flight requests to complete
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Run cleanup
      await cleanup();

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };
}

export default {
  createMiddlewareStack,
  createShutdownHandler,
};
