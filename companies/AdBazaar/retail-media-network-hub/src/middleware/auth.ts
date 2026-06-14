import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { JwtPayload } from '../types/index.js';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: 'Authorization header required',
    });
    return;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      error: 'Invalid authorization format. Use: Bearer <token>',
    });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    (req as Request & { user: JwtPayload }).user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
}

export function adminAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  authMiddleware(req, res, () => {
    const user = (req as Request & { user: JwtPayload }).user;

    if (user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }

    next();
  });
}