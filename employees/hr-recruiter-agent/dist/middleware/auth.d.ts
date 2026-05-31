/**
 * HR Recruiter Agent - Authentication Middleware
 * Service-to-service authentication and authorization
 */
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            tenantId?: string;
            roles?: string[];
            isInternal?: boolean;
        }
    }
}
/**
 * Internal service authentication middleware
 * Used for service-to-service communication
 */
export declare function internalAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * User authentication middleware
 * Validates user JWT token
 */
export declare function userAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * Combined auth middleware
 * Accepts either internal service token or user JWT
 */
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
/**
 * Role-based authorization middleware
 */
export declare function authorize(...allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Tenant isolation middleware
 */
export declare function tenantIsolation(req: Request, res: Response, next: NextFunction): void;
/**
 * Optional auth - doesn't fail if no token provided
 */
export declare function optionalAuth(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map