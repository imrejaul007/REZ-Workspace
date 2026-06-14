// ============================================================================
// Role AI Agents - Middleware
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import config from '../config';
import logger from '../utils/logger';
import type { ApiResponse } from '../types';

// ============================================================================
// Error Handler Middleware
// ============================================================================

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  logger.error('Error occurred', {
    statusCode,
    code,
    message: err.message,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  const response: ApiResponse<null> = {
    success: false,
    error: {
      code,
      message: statusCode === 500 ? 'Internal server error' : err.message,
      details: err.details,
    },
    timestamp: new Date(),
  };

  res.status(statusCode).json(response);
}

// ============================================================================
// Not Found Handler
// ============================================================================

export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    timestamp: new Date(),
  };

  res.status(404).json(response);
}

// ============================================================================
// Request Logger
// ============================================================================

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
    });
  });

  next();
}

// ============================================================================
// Security Headers
// ============================================================================

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
}

// ============================================================================
// Internal Service Auth
// ============================================================================

export function internalServiceAuth(req: Request, res: Response, next: NextFunction): void {
  if (!config.security.enableAuth) {
    return next();
  }

  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    logger.warn('Missing internal token', { path: req.path });
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing internal service token',
      },
      timestamp: new Date(),
    } as ApiResponse<null>);
    return;
  }

  if (token !== config.security.internalToken) {
    logger.warn('Invalid internal token', { path: req.path });
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid internal service token',
      },
      timestamp: new Date(),
    } as ApiResponse<null>);
    return;
  }

  next();
}

// ============================================================================
// Request ID
// ============================================================================

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = req.headers['x-request-id'] as string || generateRequestId();
  res.setHeader('X-Request-ID', id);
  (req as Request & { requestId: string }).requestId = id;
  next();
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
