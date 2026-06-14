import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError, UnauthorizedError } from '../utils/AppError.js';
import { logger } from '../utils/index.js';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const token = req.headers['x-internal-token'] || req.headers['authorization']?.replace('Bearer ', '');

  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!internalToken) {
    logger.warn('No internal service token configured');
    next();
    return;
  }

  if (!token) {
    next(new UnauthorizedError('No authentication token provided'));
    return;
  }

  // Timing-safe comparison
  const tokenStr = String(token);
  const expectedStr = String(internalToken);

  if (tokenStr.length !== expectedStr.length) {
    next(new UnauthorizedError('Invalid authentication token'));
    return;
  }

  let matches = 0;
  for (let i = 0; i < tokenStr.length; i++) {
    if (tokenStr[i] === expectedStr[i]) {
      matches++;
    }
  }

  if (matches !== tokenStr.length) {
    next(new UnauthorizedError('Invalid authentication token'));
    return;
  }

  next();
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error occurred', { message: err.message, stack: err.stack });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err instanceof ValidationError && { details: err.errors }),
    });
    return;
  }

  if (err instanceof ZodError) {
    const errors: Record<string, string> = {};
    err.errors.forEach((e) => {
      errors[e.path.join('.')] = e.message;
    });

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors,
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: 'Invalid ID format',
    });
    return;
  }

  // Duplicate key error
  if ((err as any).code === 11000) {
    res.status(409).json({
      success: false,
      error: 'Duplicate entry',
    });
    return;
  }

  // Default server error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
};
