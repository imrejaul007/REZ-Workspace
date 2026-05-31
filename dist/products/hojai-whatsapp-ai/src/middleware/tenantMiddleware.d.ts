import { Request, Response, NextFunction } from 'express';
/**
 * Tenant isolation middleware
 *
 * Ensures all database queries are scoped to the current tenant.
 * This prevents data leakage between merchants.
 */
declare global {
    namespace Express {
        interface Request {
            tenantId: string;
            merchantId: string;
            merchant?: any;
        }
    }
}
/**
 * Extract tenant from API key
 */
export declare function tenantMiddleware(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Verify tenant has active subscription
 */
export declare function subscriptionMiddleware(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function tenantRateLimit(maxRequests?: number, windowMs?: number): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Tenant-scoped query helper
 */
export declare function scopeToTenant<T extends Record<string, any>>(query: T, tenantId: string): T;
/**
 * Tenant-scoped MongoDB aggregation
 */
export declare function getTenantAggregation(tenantId: string, pipeline: any[]): any[];
//# sourceMappingURL=tenantMiddleware.d.ts.map