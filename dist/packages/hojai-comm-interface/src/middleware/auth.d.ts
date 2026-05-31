import { Request, Response, NextFunction } from 'express';
import { AuthContext } from '../types/index.js';
export interface AuthenticatedRequest extends Request {
    tenantContext: AuthContext;
    requestId: string;
}
export interface ServiceAuthRequest extends Request {
    tenantId: string;
    isInternalService: boolean;
}
/**
 * Generate a JWT token for a user
 */
export declare function generateToken(payload: {
    tenantId: string;
    userId?: string;
    role?: string;
    permissions?: string[];
}): string;
/**
 * Verify a JWT token
 */
export declare function verifyToken(token: string): AuthContext | null;
/**
 * Validate internal service token
 */
export declare function validateInternalToken(token: string): boolean;
/**
 * Extract and validate tenant context from headers
 */
export declare function tenantContext(req: Request, res: Response, next: NextFunction): void;
/**
 * Authenticate user requests via JWT
 */
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
/**
 * Combined auth middleware - validates both JWT and internal tokens
 */
export declare function authenticateAny(req: Request, res: Response, next: NextFunction): void;
/**
 * Optional authentication - doesn't fail if no auth provided
 */
export declare function optionalAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * Role-based access control middleware
 */
export declare function requireRole(...roles: string[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Permission-based access control middleware
 */
export declare function requirePermission(...permissions: string[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Rate limiting key generator based on tenant and user
 */
export declare function rateLimitKey(req: Request): string;
//# sourceMappingURL=auth.d.ts.map