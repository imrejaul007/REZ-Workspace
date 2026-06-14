/**
 * Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';

interface AuthConfig {
  adminToken?: string;
  apiKeys?: string[];
}

export function createAuthMiddleware(config: AuthConfig) {
  const { adminToken, apiKeys = [] } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip auth for health/ready/metrics
    if (['/health', '/ready', '/metrics'].includes(req.path)) {
      return next();
    }

    // Check API key
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey && apiKeys.includes(apiKey)) {
      return next();
    }

    // Check admin token
    const adminHeader = req.headers['x-admin-token'] as string;
    if (adminHeader === adminToken) {
      return next();
    }

    // Check internal token
    const internalToken = req.headers['x-internal-token'] as string;
    if (internalToken) {
      return next();
    }

    // No valid auth
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Valid API key or admin token required',
    });
  };
}
