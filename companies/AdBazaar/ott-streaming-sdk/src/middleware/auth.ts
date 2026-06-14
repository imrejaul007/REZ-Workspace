import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

interface JWTPayload {
  appId: string;
  deviceId?: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  appId?: string;
  deviceId?: string;
  sessionId?: string;
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    req.appId = decoded.appId;
    req.deviceId = decoded.deviceId;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
      timestamp: new Date().toISOString(),
    });
  }
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      req.appId = decoded.appId;
      req.deviceId = decoded.deviceId;
    } catch {
      // Ignore invalid tokens for optional auth
    }
  }

  next();
}

export function generateToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>
): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
  } catch {
    return null;
  }
}