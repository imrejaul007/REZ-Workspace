/**
 * Hojai Core - Tenant Middleware
 * Version: 1.0.0 | Date: May 30, 2026
 */

import { Request, Response, NextFunction } from 'express';

export interface TenantContext {
  tenant_id: string;
  namespace: string;
  plan?: 'starter' | 'professional' | 'enterprise';
  roles?: string[];
}

declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext;
    }
  }
}

export function tenantMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_TENANT_ID', message: 'X-Tenant-Id header required' }
      });
    }

    req.tenantContext = {
      tenant_id: tenantId,
      namespace: `tenant_${tenantId}`
    };

    next();
  };
}
