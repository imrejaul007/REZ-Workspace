/**
 * HOJAI RAG Service - Authentication Middleware
 */
import { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    serviceId?: string;
    tenantId?: string;
}
/**
 * Internal service authentication
 * Validates X-Internal-Token header for service-to-service calls
 */
export declare function authMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void;
/**
 * Optional auth - doesn't fail if no token present
 */
export declare function optionalAuthMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void;
export {};
//# sourceMappingURL=auth.d.ts.map