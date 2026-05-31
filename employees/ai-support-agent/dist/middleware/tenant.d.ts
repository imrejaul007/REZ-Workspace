/**
 * HOJAI AI Support Agent - Tenant Middleware
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Multi-tenant isolation for support operations
 */
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from '../types.js';
/**
 * Default tenant configuration
 */
declare const DEFAULT_TENANT: TenantContext;
/**
 * Extract tenant context from request headers
 */
declare function extractTenantContext(req: Request): TenantContext;
/**
 * Validate tenant context
 */
declare function validateTenantContext(context: TenantContext): {
    valid: boolean;
    error?: string;
};
/**
 * Tenant middleware factory
 */
export declare function tenantMiddleware(): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Validate tenant context middleware
 */
export declare function validateTenant(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Require specific roles middleware
 */
export declare function requireRoles(...roles: string[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Require specific plan tier middleware
 */
export declare function requirePlan(...plans: TenantContext['plan'][]): (req: Request, res: Response, next: NextFunction) => void;
export { extractTenantContext, validateTenantContext, DEFAULT_TENANT };
//# sourceMappingURL=tenant.d.ts.map