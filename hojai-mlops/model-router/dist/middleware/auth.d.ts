/**
 * Hojai Model Router - Authentication Middleware
 */
import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    tenantId?: string;
    userId?: string;
    serviceKey?: string;
}
/**
 * Simple API key auth for internal services
 */
export declare function authMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map