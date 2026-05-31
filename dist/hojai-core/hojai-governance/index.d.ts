/**
 * Hojai Governance Platform
 *
 * Multi-tenant RBAC, Audit, and Permissions
 *
 * PORT: 4501
 */
export type Role = 'owner' | 'admin' | 'manager' | 'agent' | 'viewer';
export type Permission = 'read' | 'write' | 'delete' | 'manage_users' | 'manage_settings' | 'manage_billing' | 'view_analytics' | 'manage_integrations';
export interface User {
    id: string;
    tenant_id: string;
    email: string;
    name: string;
    role: Role;
    permissions: Permission[];
    status: 'active' | 'invited' | 'disabled';
    created_at: string;
    last_login_at?: string;
}
export interface AuditEntry {
    id: string;
    tenant_id: string;
    user_id: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    details?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    timestamp: string;
}
export interface Policy {
    id: string;
    tenant_id: string;
    name: string;
    rules: PolicyRule[];
    effect: 'allow' | 'deny';
    status: 'active' | 'inactive';
}
export interface PolicyRule {
    field: string;
    operator: 'eq' | 'neq' | 'in' | 'not_in' | 'gt' | 'lt';
    value: any;
}
export declare class HojaiGovernancePlatform {
    /**
     * Create user
     */
    createUser(tenantId: string, data: {
        email: string;
        name: string;
        role: Role;
    }): Promise<User>;
    /**
     * Get user
     */
    getUser(tenantId: string, userId: string): Promise<User | null>;
    /**
     * List users
     */
    listUsers(tenantId: string): Promise<User[]>;
    /**
     * Update user role
     */
    updateUserRole(tenantId: string, userId: string, newRole: Role): Promise<User | null>;
    /**
     * Disable user
     */
    disableUser(tenantId: string, userId: string): Promise<boolean>;
    /**
     * Check if user has permission
     */
    hasPermission(user: User, permission: Permission): boolean;
    /**
     * Check permission with context
     */
    checkPermission(tenantId: string, userId: string, permission: Permission): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    /**
     * Log audit entry
     */
    auditLog(tenantId: string, userId: string, action: string, resourceType: string, resourceId?: string, details?: Record<string, any>): Promise<void>;
    /**
     * Get audit logs
     */
    getAuditLogs(tenantId: string, options?: {
        userId?: string;
        action?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<AuditEntry[]>;
    /**
     * Create policy
     */
    createPolicy(tenantId: string, data: {
        name: string;
        rules: PolicyRule[];
        effect: 'allow' | 'deny';
    }): Promise<Policy>;
    /**
     * Evaluate policy
     */
    evaluatePolicy(tenantId: string, policyId: string, context: Record<string, any>): Promise<boolean>;
    private generateId;
}
export declare function createGovernanceRoutes(platform: HojaiGovernancePlatform): import("express-serve-static-core").Router;
export declare function bootstrap(port?: number): Promise<{
    platform: HojaiGovernancePlatform;
    app: import("express-serve-static-core").Express;
}>;
declare const _default: {
    HojaiGovernancePlatform: typeof HojaiGovernancePlatform;
    createGovernanceRoutes: typeof createGovernanceRoutes;
    bootstrap: typeof bootstrap;
};
export default _default;
//# sourceMappingURL=index.d.ts.map