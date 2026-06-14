/**
 * REZ Memory Cloud - Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

export interface AuthenticatedRequest extends Request {
  apiKey?: string;
  internalToken?: string;
}

export function apiKeyAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (config.auth.apiKey && apiKey !== config.auth.apiKey) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing API key',
      },
    });
    return;
  }

  req.apiKey = apiKey;
  next();
}

export function internalTokenAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers['x-internal-token'] as string | undefined;

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing internal service token',
      },
    });
    return;
  }

  if (token !== config.auth.internalToken) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid internal service token',
      },
    });
    return;
  }

  req.internalToken = token;
  next();
}

export function eitherAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers['x-api-key'] as string | undefined;
  const token = req.headers['x-internal-token'] as string | undefined;

  if (config.auth.apiKey && apiKey === config.auth.apiKey) {
    req.apiKey = apiKey;
    return next();
  }

  if (config.auth.internalToken && token === config.auth.internalToken) {
    req.internalToken = token;
    return next();
  }

  // Development mode - skip auth
  if (config.nodeEnv === 'development' && !config.auth.apiKey && !config.auth.internalToken) {
    return next();
  }

  res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Missing or invalid authentication',
    },
  });
}
