/**
 * Hojai Model Registry - Authentication Middleware
 */
import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    tenantId?: string;
    userId?: string;
    clientType?: 'internal' | 'external';
}
/**
 * Simple API key authentication for service-to-service calls
 * In production, this should validate against a proper auth service
 */
export declare function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map