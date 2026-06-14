import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  res.setHeader('X-Request-Id', requestId);
  (res as any).locals = (res as any).locals || {};
  (res as any).locals.requestId = requestId;
  next();
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Could emit to Prometheus here
  });
  next();
}
