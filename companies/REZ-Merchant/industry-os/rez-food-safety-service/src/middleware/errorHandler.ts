import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error('Error:', { message: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
}
