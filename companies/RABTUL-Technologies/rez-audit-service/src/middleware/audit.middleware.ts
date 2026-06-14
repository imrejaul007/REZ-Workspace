import { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingCorrelationId = req.headers['x-correlation-id'] as string;

  req.correlationId = existingCorrelationId || uuidv4();

  res.setHeader('X-Correlation-Id', req.correlationId);

  next();
}

export function auditMiddleware(
  eventType: string,
  resourceType: string,
  operation: string
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      if (req.correlationId) {
        logger.info(`[${req.correlationId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
      }
    });

    next();
  };
}
