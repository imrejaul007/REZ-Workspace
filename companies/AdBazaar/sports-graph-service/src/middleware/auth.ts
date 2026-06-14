import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'sports-graph-internal-token';

export interface AuthenticatedRequest extends Request {
  serviceId?: string;
  serviceName?: string;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers['x-internal-token'] as string;
  const apiKey = req.headers['x-api-key'] as string;

  // Allow health check without auth
  if (req.path === '/health' || req.path === '/metrics') {
    next();
    return;
  }

  // Check internal service token
  if (token && token === INTERNAL_SERVICE_TOKEN) {
    req.serviceId = 'internal-service';
    req.serviceName = 'internal';
    next();
    return;
  }

  // Check API key
  if (apiKey && apiKey === process.env.API_KEY) {
    next();
    return;
  }

  // Check for public endpoints
  const publicEndpoints = ['/api/sports/live', '/api/sports/upcoming'];
  if (publicEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    next();
    return;
  }

  // Reject unauthorized requests
  res.status(401).json({
    success: false,
    error: 'Unauthorized - Invalid or missing authentication token'
  });
};

export const optionalAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers['x-internal-token'] as string;

  if (token && token === INTERNAL_SERVICE_TOKEN) {
    req.serviceId = 'internal-service';
    req.serviceName = 'internal';
  }

  next();
};