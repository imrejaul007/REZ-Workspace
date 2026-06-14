import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ==========================================
// Custom Error Class
// ==========================================

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ==========================================
// Error Handler
// ==========================================

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Programming or other unknown error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
};

// ==========================================
// Not Found Handler
// ==========================================

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
};

// ==========================================
// Internal Authentication Middleware
// ==========================================

export const internalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!expectedToken) {
    logger.warn('INTERNAL_SERVICE_TOKEN not configured');
    next();
    return;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Internal authentication required',
    });
    return;
  }

  // Timing-safe comparison
  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expectedToken);

  if (tokenBuffer.length !== expectedBuffer.length) {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
    return;
  }

  if (!crypto.timingSafeEqual(tokenBuffer, expectedBuffer)) {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
    return;
  }

  next();
};

// ==========================================
// Request Logger
// ==========================================

export const requestLogger = (req: Request, _res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  logger.info(`[${timestamp}] ${req.method} ${req.path}`);
  next();
};

// ==========================================
// Rate Limit Handler
// ==========================================

export const rateLimitHandler = (_req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    error: 'Too many requests, please try again later',
  });
};
