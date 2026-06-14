import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface JWTPayload {
  sub: string;           // User/Service ID
  seatId?: string;       // Bidder seat ID (for bid requests)
  advertiserId?: string; // Advertiser ID
  type: 'user' | 'service' | 'seat';
  iat?: number;
  exp?: number;
  iss?: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: JWTPayload;
    }
  }
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization header required',
      },
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN_FORMAT',
        message: 'Authorization header must be in format: Bearer <token>',
      },
    });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
    }) as JWTPayload;

    req.auth = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
        },
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error',
      },
    });
  }
}

// Optional authentication - doesn't fail if no token
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    next();
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
    }) as JWTPayload;

    req.auth = decoded;
  } catch {
    // Ignore token errors for optional auth
  }

  next();
}

// Service-to-service authentication (for internal API calls)
export function serviceAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const serviceKey = req.headers['x-service-key'] as string;

  if (!serviceKey) {
    authenticate(req, res, next);
    return;
  }

  try {
    const decoded = jwt.verify(serviceKey, config.jwt.secret) as JWTPayload;

    if (decoded.type !== 'service') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Service authentication required',
        },
      });
      return;
    }

    req.auth = decoded;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_SERVICE_KEY',
        message: 'Invalid service key',
      },
    });
  }
}

// Generate JWT token
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer,
  });
}