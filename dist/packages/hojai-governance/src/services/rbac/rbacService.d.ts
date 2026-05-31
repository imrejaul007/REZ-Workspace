import { Model } from 'mongoose';
import { RolePermissions, Permission, OrgRole, Policy, PolicyEffect } from '../../types/index.js';
interface RolePermissionsDocument extends RolePermissions {
}
export declare const RolePermissionsModel: Model<RolePermissionsDocument>;
interface PolicyDocument extends Policy {
}
export declare const PolicyModel: Model<PolicyDocument>;
export declare const DEFAULT_ROLE_PERMISSIONS: Record<OrgRole, Permission[]>;
export declare class RBACService {
    /**
     * Initialize default roles for a tenant
     */
    initializeTenantRoles(tenantId: string): Promise<void>;
    /**
     * Get permissions for a role
     */
    getRolePermissions(tenantId: string, roleName: OrgRole): Promise<Permission[]>;
    /**
     * Check if a user has a specific permission
     */
    hasPermission(tenantId: string, roleName: OrgRole, requiredPermission: Permission): Promise<boolean>;
    /**
     * Check if a user has any of the required permissions
     */
    hasAnyPermission(tenantId: string, roleName: OrgRole, requiredPermissions: Permission[]): Promise<boolean>;
    /**
     * Check if a user has all required permissions
     */
    hasAllPermissions(tenantId: string, roleName: OrgRole, requiredPermissions: Permission[]): Promise<boolean>;
    /**
     * Update role permissions
     */
    updateRolePermissions(tenantId: string, roleName: OrgRole, permissions: Permission[]): Promise<void>;
    /**
     * Create a custom role
     */
    createCustomRole(tenantId: string, roleName: string, permissions: Permission[]): Promise<RolePermissions>;
    /**
     * List all roles for a tenant
     */
    listRoles(tenantId: string): Promise<RolePermissions[]>;
    /**
     * Create a policy
     */
    createPolicy(params: {
        tenantId: string;
        name: string;
        description?: string;
        effect: PolicyEffect;
        actions: string[];
        resources: string[];
        conditions?: Record<string, unknown>;
        priority?: number;
    }): Promise<Policy>;
    /**
     * Evaluate if an action is allowed on a resource
     */
    evaluateAccess(params: {
        tenantId: string;
        action: string;
        resource: string;
        context?: Record<string, unknown>;
    }): Promise<boolean>;
    /**
     * Check if a value matches any pattern in a list
     */
    private matchesPattern;
    /**
     * Evaluate policy conditions against context
     */
    private evaluateConditions;
    /**
     * List policies for a tenant
     */
    listPolicies(tenantId: string): Promise<Policy[]>;
    /**
     * Update a policy
     */
    updatePolicy(tenantId: string, policyId: string, updates: Partial<Policy>): Promise<Policy | null>;
    /**
     * Delete a policy
     */
    deletePolicy(tenantId: string, policyId: string): Promise<boolean>;
    /**
     * Check time-based restrictions
     */
    checkTimeRestriction(tenantId: string, roleName: OrgRole): Promise<boolean>;
}
export declare const rbacService: RBACService;
export {};
//# sourceMappingURL=rbacService.d.ts.map