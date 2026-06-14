import { Request, Response, NextFunction } from ;
/**
 * Internal service authentication middleware
 * Validates X-Internal-Token header against configured token
 */
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Optional auth middleware - continues without token but sets req.service if valid
 */
export declare function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void;
declare global {
    namespace Express {
        interface Request {
            serviceId?: string;
            requestId?: string;
        }
    }
}
//# sourceMappingURL=auth.d.ts.map