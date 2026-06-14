import { Request, Response, NextFunction } from 'express';
import { httpRequestsTotal, httpRequestDuration } from '../config/metrics';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const path = normalizePath(req.path);

    httpRequestsTotal.inc({
      method: req.method,
      path,
      status: res.statusCode.toString(),
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        path,
        status: res.statusCode.toString(),
      },
      duration
    );
  });

  next();
};

// Normalize paths to avoid high cardinality from dynamic segments
const normalizePath = (path: string): string => {
  return path
    .replace(/\/[0-9a-f]{24}/gi, '/:id') // MongoDB ObjectIds
    .replace(/\/[0-9a-f-]{36}/gi, '/:uuid') // UUIDs
    .replace(/\/\d+/g, '/:number'); // Numeric IDs
};

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  res.setHeader('x-request-id', requestId);
  (req as Request & { requestId: string }).requestId = requestId;
  next();
};

const generateRequestId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};