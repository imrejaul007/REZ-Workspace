import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error', { error: err.message, path: req.path });
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
};
