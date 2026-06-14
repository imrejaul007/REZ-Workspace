/**
 * Error Handler
 */
import { Request, Response, NextFunction } from 'express';
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
}