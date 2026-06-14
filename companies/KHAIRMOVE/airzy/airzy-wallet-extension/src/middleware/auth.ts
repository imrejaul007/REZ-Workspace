import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { ApiError } from '../utils/errors';

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        tenantId?: string;
        roles?: string[];
      };
    }
  }
}

// Strict authentication - wallet operations always require auth
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required', 'UNAUTHORIZED'));
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as {
      sub: string;
      tenantId?: string;
      roles?: string[];
    };

    req.user = {
      sub: decoded.sub,
      tenantId: decoded.tenantId,
      roles: decoded.roles
    };
    next();
  } catch (jwtError) {
    if (jwtError instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, 'Token has expired', 'UNAUTHORIZED'));
    }
    if (jwtError instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, 'Invalid token', 'UNAUTHORIZED'));
    }
    next(new ApiError(401, 'Authentication failed', 'UNAUTHORIZED'));
  }
};

export default { authenticate };
