/**
 * Hojai Governance Service
 * Version: 1.0 | Port: 4501
 * RBAC, permissions, audit logging
 */
import express, { Request, Response, NextFunction } from 'express';
declare function createResponse<T>(data: T, tenantId?: string): {
    success: boolean;
    data: T;
    meta: {
        timestamp: string;
        requestId: string;
        tenantId: string | undefined;
    };
};
declare function createErrorResponse(code: string, message: string): {
    success: boolean;
    error: {
        code: string;
        message: string;
    };
    meta: {
        timestamp: string;
        requestId: string;
    };
};
interface TenantContext {
    tenant_id: string;
    user_id?: string;
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
declare function tenantMiddleware(): (req: Request, res: Response, next: NextFunction) => express.Response<any, Record<string, any>> | undefined;
declare function requirePermission(permission: string): (req: Request, res: Response, next: NextFunction) => express.Response<any, Record<string, any>> | undefined;
declare const PERMISSION_MAP: Record<string, string[]>;
interface AuditEntry {
    id: string;
    tenantId: string;
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
    timestamp: string;
}
declare function logAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void;
declare class HojaiGovernance {
    private app;
    constructor();
    private setupMiddleware;
    private setupRoutes;
    start(): void;
}
interface RoleDefinition {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    inheritsFrom?: string[];
    isSystem: boolean;
}
declare const ROLE_DEFINITIONS: RoleDefinition[];
interface PermissionDefinition {
    id: string;
    name: string;
    description: string;
    category: string;
}
declare const PERMISSION_DEFINITIONS: PermissionDefinition[];
export { ROLE_DEFINITIONS, PERMISSION_DEFINITIONS, PERMISSION_MAP, logAudit, createResponse, createErrorResponse, tenantMiddleware, requirePermission, AuditEntry };
export default HojaiGovernance;
//# sourceMappingURL=index.d.ts.map