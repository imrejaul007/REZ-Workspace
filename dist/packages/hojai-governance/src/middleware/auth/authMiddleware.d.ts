import { Request, Response, NextFunction } from 'express';
import { Permission, OrgRole, TenantType } from '../../types/index.js';
declare global {
    namespace Express {
        interface Request {
            tenantId?: string;
            tenantType?: TenantType;
            userId?: string;
            userEmail?: string;
            userRole?: OrgRole;
            permissions?: Permission[];
            apiKeyId?: string;
            isPrivileged?: boolean;
            requestId?: string;
        }
    }
}
/**
 * Extract and verify JWT token from Authorization header
 */
export declare const authenticateJWT: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Authenticate using API key
 */
export declare const authenticateApiKey: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Authenticate using internal service token
 */
export declare const authenticateInternal: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Combined authentication - tries JWT, then API key, then internal
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Check if user has required permission(s)
 */
export declare const requirePermission: (...requiredPermissions: Permission[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Require specific role(s)
 */
export declare const requireRole: (...allowedRoles: OrgRole[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Verify tenant is active
 */
export declare const requireActiveTenant: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Require specific tenant type
 */
export declare const requireTenantType: (...allowedTypes: TenantType[]) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=authMiddleware.d.ts.map