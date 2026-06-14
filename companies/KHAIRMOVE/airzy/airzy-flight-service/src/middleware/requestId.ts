import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
      user?: {
        sub: string;
        tenantId?: string;
        roles?: string[];
      };
    }
  }
}

export const requestId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  logger.addMeta('requestId', requestId);
  next();
};

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  req.startTime = startTime;

  logger.info('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.sub
    });
  });

  next();
};

export default {
  requestId,
  requestLogger
};