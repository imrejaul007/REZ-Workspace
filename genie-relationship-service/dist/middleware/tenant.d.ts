/**
 * GENIE Relationship Service - Tenant Middleware
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Tenant context extraction from headers
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Tenant Context Interface
 */
export interface TenantContext {
    tenant_id: string;
    namespace: string;
    plan?: 'starter' | 'professional' | 'enterprise';
    roles?: string[];
}
/**
 * Tenant middleware - extracts tenant context from headers
 */
export declare function tenantMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Optional tenant middleware - allows requests without tenant context
 */
export declare function optionalTenantMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate tenant access
 */
export declare function validateTenantAccess(tenantId: string, userId: string): void;
//# sourceMappingURL=tenant.d.ts.map