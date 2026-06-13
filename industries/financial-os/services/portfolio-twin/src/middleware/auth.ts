import { Request, Response, NextFunction } from 'express';

// ============================================================================
// AUTHENTICATION INTERFACE
// ============================================================================

export interface AuthRequest extends Request {
  apiKey?: string;
  internalToken?: string;
  validatedBody?: unknown;
}

// ============================================================================
// API KEY AUTHENTICATION
// ============================================================================

export function apiKeyAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string || req.headers['authorization']?.replace('Bearer ', '');
  const validApiKey = process.env.API_KEY || 'portfolio-twin-api-key';

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: 'API key required',
      code: 'MISSING_API_KEY',
    });
    return;
  }

  if (apiKey !== validApiKey) {
    res.status(401).json({
      success: false,
      error: 'Invalid API key',
      code: 'INVALID_API_KEY',
    });
    return;
  }

  req.apiKey = apiKey;
  next();
}

// ============================================================================
// INTERNAL SERVICE AUTHENTICATION
// ============================================================================

export function internalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;
  const validToken = process.env.INTERNAL_SERVICE_TOKEN || 'internal-token';

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Internal token required',
      code: 'MISSING_INTERNAL_TOKEN',
    });
    return;
  }

  if (token !== validToken) {
    res.status(403).json({
      success: false,
      error: 'Invalid internal token',
      code: 'INVALID_INTERNAL_TOKEN',
    });
    return;
  }

  req.internalToken = token;
  next();
}

// ============================================================================
// OPTIONAL AUTHENTICATION
// ============================================================================

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string || req.headers['authorization']?.replace('Bearer ', '');

  if (apiKey) {
    req.apiKey = apiKey;
  }

  next();
}
