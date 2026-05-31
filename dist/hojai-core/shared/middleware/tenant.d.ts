/**
 * Hojai Core - Tenant Middleware
 * Version: 1.0 | Date: May 29, 2026
 * Purpose: Multi-tenant isolation for all services
 */
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from '../types';
declare global {
    namespace Express {
        interface Request {
            tenantContext?: TenantContext;
        }
    }
}
/**
 * Tenant Middleware
 * Extracts and validates tenant context from headers
 */
export declare function tenantMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Optional tenant middleware (for public endpoints)
 */
export declare function optionalTenantMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Cache key helper - always prefix with tenant
 */
export declare function cacheKey(tenant_id: string, ...parts: string[]): string;
/**
 * Database collection helper - always scope by tenant
 */
export declare function scopedFilter(tenantContext: TenantContext, additionalFilter?: Record<string, any>): Record<string, any>;
/**
 * Error with tenant context
 */
export declare class TenantError extends Error {
    code: string;
    tenant_id?: string | undefined;
    constructor(message: string, code: string, tenant_id?: string | undefined);
}
/**
 * Rate limit key generator
 */
export declare function rateLimitKey(tenantContext: TenantContext): string;
//# sourceMappingURL=tenant.d.ts.map