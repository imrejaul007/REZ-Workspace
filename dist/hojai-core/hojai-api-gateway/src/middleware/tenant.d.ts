/**
 * Hojai Core - Tenant Middleware
 * Version: 1.0.0 | Date: May 30, 2026
 */
import { Request, Response, NextFunction } from 'express';
export interface TenantContext {
    tenant_id: string;
    organization_id?: string;
    user_id?: string;
    tenant_type?: 'commercial' | 'privileged' | 'personal';
    namespace: string;
    plan?: 'starter' | 'professional' | 'enterprise';
    roles?: string[];
    permissions?: string[];
}
declare global {
    namespace Express {
        interface Request {
            tenantContext?: TenantContext;
        }
    }
}
/**
 * Required tenant middleware - rejects requests without tenant ID
 */
export declare function tenantMiddleware(): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Optional tenant middleware - allows requests without tenant ID
 */
export declare function optionalTenantMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=tenant.d.ts.map