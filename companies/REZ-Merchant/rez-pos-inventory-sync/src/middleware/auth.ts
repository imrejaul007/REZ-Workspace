import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  serviceId?: string;
  serviceType?: 'pos' | 'inventory' | 'admin';
}

const POS_SERVICE_TOKEN = process.env.POS_SERVICE_TOKEN || '';
const INVENTORY_SERVICE_TOKEN = process.env.INVENTORY_SERVICE_TOKEN || '';
const ADMIN_SERVICE_TOKEN = process.env.SERVICE_TOKEN || '';

export const serviceAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers['x-service-token'] as string | undefined;

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Missing service token',
    });
    return;
  }

  // Check POS service token
  if (token === POS_SERVICE_TOKEN) {
    req.serviceId = 'pos-service';
    req.serviceType = 'pos';
    next();
    return;
  }

  // Check Inventory service token
  if (token === INVENTORY_SERVICE_TOKEN) {
    req.serviceId = 'inventory-service';
    req.serviceType = 'inventory';
    next();
    return;
  }

  // Check admin/service token
  if (token === ADMIN_SERVICE_TOKEN) {
    req.serviceId = 'admin';
    req.serviceType = 'admin';
    next();
    return;
  }

  res.status(403).json({
    success: false,
    error: 'Invalid service token',
  });
};

export const posOnly = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.serviceType !== 'pos' && req.serviceType !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'POS service access required',
    });
    return;
  }
  next();
};

export const inventoryOnly = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.serviceType !== 'inventory' && req.serviceType !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Inventory service access required',
    });
    return;
  }
  next();
};

export const adminOnly = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.serviceType !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
    return;
  }
  next();
};
