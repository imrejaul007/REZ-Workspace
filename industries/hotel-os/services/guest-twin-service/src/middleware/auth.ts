import { Request, Response, NextFunction } from 'express';

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface AuthRequest extends Request {
  serviceId?: string;
  userId?: string;
  isInternal?: boolean;
}

// ============================================================================
// API KEY AUTHENTICATION
// ============================================================================

export function apiKeyAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: 'API key is required',
      code: 'AUTH_MISSING_KEY',
    });
    return;
  }

  const validApiKey = process.env.API_KEY || 'guest-twin-api-key';

  if (apiKey !== validApiKey) {
    res.status(401).json({
      success: false,
      error: 'Invalid API key',
      code: 'AUTH_INVALID_KEY',
    });
    return;
  }

  next();
}

// ============================================================================
// INTERNAL SERVICE AUTHENTICATION
// ============================================================================

export function internalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Internal token is required',
      code: 'AUTH_MISSING_TOKEN',
    });
    return;
  }

  const validToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!validToken || token !== validToken) {
    res.status(401).json({
      success: false,
      error: 'Invalid internal token',
      code: 'AUTH_INVALID_TOKEN',
    });
    return;
  }

  req.isInternal = true;
  next();
}

// ============================================================================
// COMBINED AUTH (API Key or Internal Token)
// ============================================================================

export function combinedAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;
  const token = req.headers['x-internal-token'] as string;

  const validApiKey = process.env.API_KEY || 'guest-twin-api-key';
  const validToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (apiKey && apiKey === validApiKey) {
    next();
    return;
  }

  if (token && validToken && token === validToken) {
    req.isInternal = true;
    next();
    return;
  }

  res.status(401).json({
    success: false,
    error: 'Valid API key or internal token is required',
    code: 'AUTH_REQUIRED',
  });
}

// ============================================================================
// SERVICE ID EXTRACTION
// ============================================================================

export function extractServiceId(req: AuthRequest, res: Response, next: NextFunction): void {
  const serviceId = req.headers['x-service-id'] as string;
  if (serviceId) {
    req.serviceId = serviceId;
  }
  next();
}

// ============================================================================
// USER ID EXTRACTION
// ============================================================================

export function extractUserId(req: AuthRequest, res: Response, next: NextFunction): void {
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    req.userId = userId;
  }
  next();
}