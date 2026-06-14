import { Request, Response, NextFunction } from 'express';

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, url, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const logLevel = statusCode >= 400 ? 'error' : 'info';
    const timestamp = new Date().toISOString();

    console.log(
      JSON.stringify({
        timestamp,
        level: logLevel,
        method,
        url,
        ip,
        statusCode,
        duration: `${duration}ms`,
      })
    );
  });

  next();
};

// Error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      error: err.message,
      stack: err.stack,
      method: req.method,
      url: req.url,
    })
  );

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    path: req.url,
  });
};

// Rate limiting middleware (simple in-memory implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (
  maxRequests: number = 100,
  windowMs: number = 60000
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.ip || 'unknown';
    const now = Date.now();

    let clientData = requestCounts.get(identifier);

    if (!clientData || now > clientData.resetTime) {
      clientData = { count: 0, resetTime: now + windowMs };
      requestCounts.set(identifier, clientData);
    }

    clientData.count++;

    if (clientData.count > maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
      return;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - clientData.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());

    next();
  };
};

// Request validation middleware
export const validateRequest = (schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Basic validation - actual schema validation happens in routes
    if (!req.body || Object.keys(req.body).length === 0) {
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        res.status(400).json({
          success: false,
          error: 'Request body is required',
        });
        return;
      }
    }
    next();
  };
};

// CORS configuration middleware
export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];

  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Internal-Token');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
};

// Internal service authentication middleware
export const internalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const internalToken = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKENS_JSON;

  // Skip auth if no token is configured (development mode)
  if (!expectedToken) {
    next();
    return;
  }

  if (!internalToken) {
    res.status(401).json({
      success: false,
      error: 'Internal service token required',
    });
    return;
  }

  try {
    const tokens = JSON.parse(expectedToken);
    const serviceName = req.headers['x-service-name'] as string;

    if (!serviceName || tokens[serviceName] !== internalToken) {
      res.status(403).json({
        success: false,
        error: 'Invalid service token',
      });
      return;
    }

    next();
  } catch {
    res.status(500).json({
      success: false,
      error: 'Invalid token configuration',
    });
  }
};

// Health check endpoint
export const healthCheck = (_req: Request, res: Response): void => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      unit: 'MB',
    },
  });
};
