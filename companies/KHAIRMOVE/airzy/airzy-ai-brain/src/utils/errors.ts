import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
const logger = winston.createLogger({ level: 'info', format: winston.format.combine(winston.format.timestamp(), winston.format.json()), defaultMeta: { service: 'airzy-ai-brain' }, transports: [new winston.transports.Console()] });

export class ApiError extends Error {
  constructor(public statusCode: number, public message: string, public code: string = 'ERROR') { super(message); }
}

export const asyncHandler = <T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) => {
  return (req: Request, res: Response, next: NextFunction) => { Promise.resolve(fn(req, res, next)).catch(next); };
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
};

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error', { error: err.message, path: req.path });
  res.status(err instanceof ApiError ? err.statusCode : 500).json({ success: false, error: { code: err instanceof ApiError ? err.code : 'INTERNAL_ERROR', message: err.message } });
};

export { logger };