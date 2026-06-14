/**
 * Authentication Middleware for internal service calls
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from 'utils/logger.js';

// Extend Express Request to include service info
declare global {
  namespace Express {
    interface Request {
      serviceId?: string;
      isInternal?: boolean;
    }
  }
}

/**
 * Internal service authentication middleware
 * Validates the X-Internal-Token header for service-to-service calls
 */
export function internalServiceAuth(req: Request, res: Response, next: NextFunction): void {
  const internalToken = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  // If no token is configured, allow all requests (development mode)
  if (!expectedToken) {
    req.isInternal = true;
    next();
    return;
  }

  // Validate token
  if (!internalToken) {
    logger.warn('Missing internal service token', {
      path: req.path,
      ip: req.ip,
    });
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing internal service token',
    });
    return;
  }

  if (internalToken !== expectedToken) {
    logger.warn('Invalid internal service token', {
      path: req.path,
      ip: req.ip,
    });
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid internal service token',
    });
    return;
  }

  // Extract service ID from header
  req.serviceId = req.headers['x-service-id'] as string;
  req.isInternal = true;

  next();
}

/**
 * Optional internal auth - doesn't block if no token provided
 */
export function optionalInternalAuth(req: Request, res: Response, next: NextFunction): void {
  const internalToken = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!expectedToken || !internalToken) {
    next();
    return;
  }

  if (internalToken === expectedToken) {
    req.serviceId = req.headers['x-service-id'] as string;
    req.isInternal = true;
  }

  next();
}

/**
 * Rate limiting middleware for internal services
 */
export function internalRateLimit(req: Request, res: Response, next: NextFunction): void {
  if (!req.isInternal) {
    // Only apply strict rate limiting to external requests
    next();
    return;
  }

  // Internal services get higher limits
  // This is a placeholder - in production, use Redis-based rate limiting
  next();
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      serviceId: req.serviceId,
    });
  });

  next();
}

/**
 * Advertiser authentication middleware
 * Validates advertiser ID from the request header
 */
export function advertiserAuth(req: Request, res: Response, next: NextFunction): void {
  const advertiserId = req.headers['x-advertiser-id'] as string;

  if (!advertiserId) {
    logger.warn('Missing advertiser ID', {
      path: req.path,
      ip: req.ip,
    });
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing advertiser ID',
    });
    return;
  }

  // In production, validate advertiser exists and has permission
  // For now, just pass through
  next();
}