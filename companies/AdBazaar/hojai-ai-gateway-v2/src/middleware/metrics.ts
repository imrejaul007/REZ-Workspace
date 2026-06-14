/**
 * Metrics Middleware - Prometheus ready
 */

import { Request, Response, NextFunction } from 'express';

let requestCount = 0;
const endpointCounts = new Map<string, number>();

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const method = req.method;
  const path = req.route?.path || req.path;

  res.on('finish', () => {
    requestCount++;
    const key = `${method}:${path}`;
    endpointCounts.set(key, (endpointCounts.get(key) || 0) + 1);
  });

  next();
}

export function getMetrics(): {
  totalRequests: number;
  endpoints: Record<string, number>;
} {
  return {
    totalRequests: requestCount,
    endpoints: Object.fromEntries(endpointCounts),
  };
}
