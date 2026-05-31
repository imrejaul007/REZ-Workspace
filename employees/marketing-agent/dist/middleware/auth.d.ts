import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            tenantId?: string;
            userId?: string;
            roles?: string[];
        }
    }
}
/**
 * Internal service authentication middleware
 * Validates X-Internal-Token header for service-to-service communication
 */
export declare function requireInternalAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * Optional internal auth - sets tenant context if token is valid
 */
export declare function optionalInternalAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * Validate tenant ID format
 */
export declare function requireTenantId(req: Request, res: Response, next: NextFunction): void;
/**
 * Rate limiting by tenant
 */
export declare function createTenantRateLimiter(maxRequests: number, windowMs: number): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map