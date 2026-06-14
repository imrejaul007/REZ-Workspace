import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'airzy-lounge-service' },
  transports: [new winston.transports.Console()]
});

export class ApiError extends Error {
  constructor(public statusCode: number, public message: string, public code: string = 'ERROR') {
    super(message);
  }
}

export const asyncHandler = <T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` }, meta: { requestId: req.requestId, timestamp: Date.now() } });
};

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error', { error: err.message, path: req.path });
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, error: { code: err.code, message: err.message }, meta: { requestId: req.requestId, timestamp: Date.now() } });
  }
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message }, meta: { requestId: req.requestId, timestamp: Date.now() } });
};

export { logger };