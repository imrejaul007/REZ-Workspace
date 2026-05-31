/**
 * Hojai Core - Tenant Middleware
 * Version: 1.0.0 | Date: May 30, 2026
 */

import { Request, Response, NextFunction } from 'express';

// ============================================
// TYPES
// ============================================

export interface TenantContext {
  tenant_id: string;
  organization_id?: string;
  user_id?: string;
  tenant_type?: 'commercial' | 'privileged' | 'personal';
  namespace: string;
  plan?: 'starter' | 'professional' | 'enterprise';
  roles?: string[];
  permissions?: string[];
}

declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext;
    }
  }
}

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Required tenant middleware - rejects requests without tenant ID
 */
export function tenantMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    const organizationId = req.headers['x-organization-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    const rolesHeader = req.headers['x-roles'] as string;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_ID',
          message: 'X-Tenant-Id header is required for all API requests'
        }
      });
    }

    let roles: string[] = [];
    if (rolesHeader) {
      try {
        roles = JSON.parse(rolesHeader);
      } catch {
        roles = rolesHeader.split(',');
      }
    }

    req.tenantContext = {
      tenant_id: tenantId,
      organization_id: organizationId,
      user_id: userId,
      namespace: `tenant_${tenantId}`,
      roles,
      tenant_type: getTenantType(tenantId)
    };

    next();
  };
}

/**
 * Optional tenant middleware - allows requests without tenant ID
 */
export function optionalTenantMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (tenantId) {
      req.tenantContext = {
        tenant_id: tenantId,
        namespace: `tenant_${tenantId}`,
        tenant_type: getTenantType(tenantId)
      };
    }

    next();
  };
}

// ============================================
// HELPERS
// ============================================

function getTenantType(tenantId: string): 'commercial' | 'privileged' | 'personal' {
  if (tenantId.startsWith('rez_')) return 'privileged';
  if (tenantId.startsWith('user_')) return 'personal';
  return 'commercial';
}
