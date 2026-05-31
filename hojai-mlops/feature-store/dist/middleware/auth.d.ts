/**
 * Authentication Middleware
 */
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            internalToken?: string;
        }
    }
}
/**
 * Verify internal service token
 * Used for service-to-service communication
 */
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Optional auth - sets internalToken if present but doesn't require it
 */
export declare function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map