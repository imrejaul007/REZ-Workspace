/**
 * Hojai Core - Tenant Middleware
 * Version: 1.0.0 | Date: May 30, 2026
 */
import { Request, Response, NextFunction } from 'express';
export interface TenantContext {
    tenant_id: string;
    namespace: string;
    plan?: 'starter' | 'professional' | 'enterprise';
    roles?: string[];
}
declare global {
    namespace Express {
        interface Request {
            tenantContext?: TenantContext;
        }
    }
}
export declare function tenantMiddleware(): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=tenant.d.ts.map