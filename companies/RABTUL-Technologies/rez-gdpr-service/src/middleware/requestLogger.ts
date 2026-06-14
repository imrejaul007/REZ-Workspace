import { Request, Response, NextFunction } from 'express';

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();

    console.log(
      `[${timestamp}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });

  next();
}

export function requestValidator(
  requiredFields: string[]
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missing: string[] = [];

    for (const field of requiredFields) {
      if (!req.body[field] && !req.params[field] && !req.query[field]) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        fields: missing,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    next();
  };
}

export function rateLimiter(
  maxRequests: number = 100,
  windowMs: number = 60000
) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let record = requests.get(identifier);

    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + windowMs
      };
      requests.set(identifier, record);
    }

    record.count++;

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    if (record.count > maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
        code: 'RATE_LIMIT_EXCEEDED'
      });
      return;
    }

    next();
  };
}

export function corsOptions() {
  return {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    credentials: true,
    maxAge: 86400
  };
}
