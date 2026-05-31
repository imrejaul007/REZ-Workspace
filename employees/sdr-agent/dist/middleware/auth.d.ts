import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            tenantId?: string;
            userId?: string;
            userRoles?: string[];
            correlationId?: string;
        }
    }
}
/**
 * Require internal service authentication
 * Used for service-to-service communication
 */
export declare function requireInternalAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * Optional tenant extraction from headers
 * Does not block if no tenant is provided
 */
export declare function extractTenant(req: Request, res: Response, next: NextFunction): void;
/**
 * Require specific tenant (fail if not provided)
 */
export declare function requireTenant(req: Request, res: Response, next: NextFunction): void;
/**
 * Require user authentication (end-user)
 */
export declare function requireUserAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * Role-based access control
 */
export declare function requireRole(...roles: string[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Rate limiting middleware
 */
export declare function rateLimitByTenant(windowMs?: number, max?: number): (req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    requireInternalAuth: typeof requireInternalAuth;
    extractTenant: typeof extractTenant;
    requireTenant: typeof requireTenant;
    requireUserAuth: typeof requireUserAuth;
    requireRole: typeof requireRole;
    rateLimitByTenant: typeof rateLimitByTenant;
};
export default _default;
//# sourceMappingURL=auth.d.ts.map