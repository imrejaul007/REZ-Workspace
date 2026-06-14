import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import appConfig from '../config';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  tenantId?: string;
  roles?: string[];
}

// Middleware to verify JWT token via RABTUL Auth service
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token with RABTUL Auth service
    const response = await axios.post(
      `${appConfig.services.auth}/api/auth/verify`,
      { token },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(appConfig.internalServiceToken && {
            'X-Internal-Token': appConfig.internalServiceToken,
          }),
        },
        timeout: 5000,
      }
    );

    if (!response.data || !response.data.valid) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
      return;
    }

    // Attach user info to request
    req.userId = response.data.userId;
    req.tenantId = response.data.tenantId || response.data.tenant_id;
    req.roles = response.data.roles || [];

    next();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        });
        return;
      }
      if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
        console.error('Auth service unavailable:', error.message);
        res.status(503).json({
          error: 'Service Unavailable',
          message: 'Authentication service is temporarily unavailable',
        });
        return;
      }
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication check failed',
    });
  }
}

// Simple API key middleware for service-to-service calls
export function apiKeyMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string | undefined;
  const internalToken = req.headers['x-internal-token'] as string | undefined;

  // Allow if internal service token matches
  if (appConfig.internalServiceToken && internalToken === appConfig.internalServiceToken) {
    next();
    return;
  }

  // Allow if API key is valid
  if (apiKey === process.env['FINANCE-COLLECTIONS_API_KEY']) {
    next();
    return;
  }

  res.status(401).json({
    error: 'Unauthorized',
    message: 'Invalid API key or internal token',
  });
}

export default { authMiddleware, apiKeyMiddleware };
