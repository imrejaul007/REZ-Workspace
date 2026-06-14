import { Response, NextFunction } from 'express';
import { Tenant } from '../models/index.js';
import { AuthenticatedRequest } from '../types/index.js';

export const tenantMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const tenantId = req.headers['x-tenant-id'] as string || req.query.tenantId as string;

  if (tenantId) {
    req.tenantId = tenantId;
  }

  if (!req.tenantId && req.user) {
    req.tenantId = req.user.tenantId;
  }

  next();
};

export const validateTenant = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantId) {
      res.status(400).json({
        success: false,
        error: 'Tenant ID is required.',
      });
      return;
    }

    const tenant = await Tenant.findById(req.tenantId);

    if (!tenant) {
      res.status(404).json({
        success: false,
        error: 'Tenant not found.',
      });
      return;
    }

    if (tenant.status === 'suspended') {
      res.status(403).json({
        success: false,
        error: 'Tenant account is suspended.',
      });
      return;
    }

    if (tenant.status === 'trial' && tenant.trialEndsAt && new Date() > tenant.trialEndsAt) {
      res.status(403).json({
        success: false,
        error: 'Trial period has expired.',
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const superAdminOnly = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'super_admin') {
    res.status(403).json({
      success: false,
      error: 'Super admin access required.',
    });
    return;
  }
  next();
};
