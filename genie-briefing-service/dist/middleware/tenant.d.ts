/**
 * GENIE Briefing Service - Tenant Middleware
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Tenant context extraction from headers
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Tenant middleware - extracts tenant context from headers
 * Required for all API routes
 */
export declare function tenantMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Optional tenant middleware - allows requests without tenant context
 * Used for public/health endpoints
 */
export declare function optionalTenantMiddleware(): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Validate tenant access
 */
export declare function validateTenantAccess(tenantId: string, userId: string): void;
/**
 * Internal service middleware - for service-to-service communication
 */
export declare function internalServiceMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=tenant.d.ts.map