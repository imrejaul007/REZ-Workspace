import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  apiKey?: string;
  serviceToken?: string;
}

export function apiKeyAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'API key is required',
      },
    });
    return;
  }

  // In production, validate the API key against a store
  // For now, accept any non-empty key
  if (apiKey.length < 8) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key format',
      },
    });
    return;
  }

  req.apiKey = apiKey;
  next();
}

export function internalServiceAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const serviceToken = req.headers['x-internal-service-token'] as string;
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

  // Skip auth if no internal token is configured
  if (!internalToken) {
    next();
    return;
  }

  if (!serviceToken) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Internal service token is required',
      },
    });
    return;
  }

  if (serviceToken !== internalToken) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid internal service token',
      },
    });
    return;
  }

  req.serviceToken = serviceToken;
  next();
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey) {
    req.apiKey = apiKey;
  }
  next();
}