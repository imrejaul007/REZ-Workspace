"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.rbacService = exports.RBACService = exports.DEFAULT_ROLE_PERMISSIONS = exports.PolicyModel = exports.RolePermissionsModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const uuid_1 = require("uuid");
const index_js_1 = require("../../types/index.js");
const RolePermissionsSchema = new mongoose_1.Schema({
    roleId: { type: mongoose_1.Schema.Types.UUID, required: true },
    roleName: { type: String, required: true },
    tenantId: { type: mongoose_1.Schema.Types.UUID, required: true, index: true },
    permissions: [{ type: String, enum: Object.values(index_js_1.Permission) }],
    resourceRestrictions: { type: Map, of: mongoose_1.Schema.Types.Mixed },
    timeRestrictions: {
        allowedHours: [{ type: Number, min: 0, max: 23 }],
        allowedDays: [{ type: Number, min: 0, max: 6 }]
    }
}, {
    timestamps: true,
    collection: 'role_permissions'
});
RolePermissionsSchema.index({ tenantId: 1, roleName: 1 }, { unique: true });
exports.RolePermissionsModel = mongoose_1.default.model('RolePermissions', RolePermissionsSchema);
const PolicySchema = new mongoose_1.Schema({
    tenantId: { type: mongoose_1.Schema.Types.UUID, required: true, index: true },
    name: { type: String, required: true, minlength: 2, maxlength: 100 },
    description: { type: String },
    effect: { type: String, enum: Object.values(index_js_1.PolicyEffect), required: true },
    actions: [{ type: String, required: true }], // e.g., 'events:*', 'memory:read'
    resources: [{ type: String, required: true }], // e.g., 'events:orders:*'
    conditions: { type: Map, of: mongoose_1.Schema.Types.Mixed },
    priority: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true }
}, {
    timestamps: true,
    collection: 'policies'
});
PolicySchema.index({ tenantId: 1, priority: -1 });
PolicySchema.index({ tenantId: 1, enabled: 1 });
exports.PolicyModel = mongoose_1.default.model('Policy', PolicySchema);
// ============================================================================
// DEFAULT ROLES CONFIGURATION
// ============================================================================
exports.DEFAULT_ROLE_PERMISSIONS = {
    [index_js_1.OrgRole.OWNER]: [
        // Full access to everything
        index_js_1.Permission.TENANT_READ,
        index_js_1.Permission.TENANT_WRITE,
        index_js_1.Permission.TENANT_ADMIN,
        index_js_1.Permission.ORG_READ,
        index_js_1.Permission.ORG_WRITE,
        index_js_1.Permission.ORG_ADMIN,
        index_js_1.Permission.USER_READ,
        index_js_1.Permission.USER_WRITE,
        index_js_1.Permission.USER_ADMIN,
        index_js_1.Permission.API_KEY_READ,
        index_js_1.Permission.API_KEY_WRITE,
        index_js_1.Permission.API_KEY_ADMIN,
        index_js_1.Permission.AUDIT_READ,
        index_js_1.Permission.AUDIT_EXPORT,
        index_js_1.Permission.EVENTS_READ,
        index_js_1.Permission.EVENTS_WRITE,
        index_js_1.Permission.EVENTS_ADMIN,
        index_js_1.Permission.MEMORY_READ,
        index_js_1.Permission.MEMORY_WRITE,
        index_js_1.Permission.MEMORY_DELETE,
        index_js_1.Permission.MEMORY_ADMIN,
        index_js_1.Permission.WORKFLOW_READ,
        index_js_1.Permission.WORKFLOW_WRITE,
        index_js_1.Permission.WORKFLOW_EXECUTE,
        index_js_1.Permission.WORKFLOW_ADMIN,
        index_js_1.Permission.AGENT_READ,
        index_js_1.Permission.AGENT_WRITE,
        index_js_1.Permission.AGENT_EXECUTE,
        index_js_1.Permission.AGENT_ADMIN,
        index_js_1.Permission.PRIVILEGED_GRAPH,
        index_js_1.Permission.PRIVILEGED_IDENTITY,
        index_js_1.Permission.PRIVILEGED_ECOSYSTEM
    ],
    [index_js_1.OrgRole.ADMIN]: [
        index_js_1.Permission.ORG_READ,
        index_js_1.Permission.ORG_WRITE,
        index_js_1.Permission.USER_READ,
        index_js_1.Permission.USER_WRITE,
        index_js_1.Permission.USER_ADMIN,
        index_js_1.Permission.API_KEY_READ,
        index_js_1.Permission.API_KEY_WRITE,
        index_js_1.Permission.AUDIT_READ,
        index_js_1.Permission.EVENTS_READ,
        index_js_1.Permission.EVENTS_WRITE,
        index_js_1.Permission.EVENTS_ADMIN,
        index_js_1.Permission.MEMORY_READ,
        index_js_1.Permission.MEMORY_WRITE,
        index_js_1.Permission.MEMORY_DELETE,
        index_js_1.Permission.MEMORY_ADMIN,
        index_js_1.Permission.WORKFLOW_READ,
        index_js_1.Permission.WORKFLOW_WRITE,
        index_js_1.Permission.WORKFLOW_EXECUTE,
        index_js_1.Permission.WORKFLOW_ADMIN,
        index_js_1.Permission.AGENT_READ,
        index_js_1.Permission.AGENT_WRITE,
        index_js_1.Permission.AGENT_EXECUTE
    ],
    [index_js_1.OrgRole.MEMBER]: [
        index_js_1.Permission.ORG_READ,
        index_js_1.Permission.USER_READ,
        index_js_1.Permission.API_KEY_READ,
        index_js_1.Permission.EVENTS_READ,
        index_js_1.Permission.EVENTS_WRITE,
        index_js_1.Permission.MEMORY_READ,
        index_js_1.Permission.MEMORY_WRITE,
        index_js_1.Permission.WORKFLOW_READ,
        index_js_1.Permission.WORKFLOW_EXECUTE,
        index_js_1.Permission.AGENT_READ,
        index_js_1.Permission.AGENT_EXECUTE
    ],
    [index_js_1.OrgRole.VIEWER]: [
        index_js_1.Permission.ORG_READ,
        index_js_1.Permission.USER_READ,
        index_js_1.Permission.EVENTS_READ,
        index_js_1.Permission.MEMORY_READ,
        index_js_1.Permission.WORKFLOW_READ,
        index_js_1.Permission.AGENT_READ
    ]
};
// ============================================================================
// RBAC SERVICE
// ============================================================================
class RBACService {
    /**
     * Initialize default roles for a tenant
     */
    async initializeTenantRoles(tenantId) {
        const existing = await exports.RolePermissionsModel.findOne({ tenantId });
        if (existing)
            return; // Already initialized
        const rolePromises = Object.entries(exports.DEFAULT_ROLE_PERMISSIONS).map(async ([roleName, permissions]) => {
            const role = new exports.RolePermissionsModel({
                roleId: (0, uuid_1.v4)(),
                roleName,
                tenantId,
                permissions
            });
            await role.save();
        });
        await Promise.all(rolePromises);
    }
    /**
     * Get permissions for a role
     */
    async getRolePermissions(tenantId, roleName) {
        const role = await exports.RolePermissionsModel.findOne({
            tenantId,
            roleName
        });
        return role?.permissions ?? [];
    }
    /**
     * Check if a user has a specific permission
     */
    async hasPermission(tenantId, roleName, requiredPermission) {
        const permissions = await this.getRolePermissions(tenantId, roleName);
        return permissions.includes(requiredPermission);
    }
    /**
     * Check if a user has any of the required permissions
     */
    async hasAnyPermission(tenantId, roleName, requiredPermissions) {
        const permissions = await this.getRolePermissions(tenantId, roleName);
        return requiredPermissions.some(p => permissions.includes(p));
    }
    /**
     * Check if a user has all required permissions
     */
    async hasAllPermissions(tenantId, roleName, requiredPermissions) {
        const permissions = await this.getRolePermissions(tenantId, roleName);
        return requiredPermissions.every(p => permissions.includes(p));
    }
    /**
     * Update role permissions
     */
    async updateRolePermissions(tenantId, roleName, permissions) {
        await exports.RolePermissionsModel.findOneAndUpdate({ tenantId, roleName }, { $set: { permissions } });
    }
    /**
     * Create a custom role
     */
    async createCustomRole(tenantId, roleName, permissions) {
        const role = new exports.RolePermissionsModel({
            roleId: (0, uuid_1.v4)(),
            roleName,
            tenantId,
            permissions
        });
        await role.save();
        return role.toObject();
    }
    /**
     * List all roles for a tenant
     */
    async listRoles(tenantId) {
        const roles = await exports.RolePermissionsModel.find({ tenantId });
        return roles.map(r => r.toObject());
    }
    /**
     * Create a policy
     */
    async createPolicy(params) {
        const policy = new exports.PolicyModel({
            ...params,
            id: (0, uuid_1.v4)(),
            priority: params.priority ?? 0,
            enabled: true
        });
        await policy.save();
        return policy.toObject();
    }
    /**
     * Evaluate if an action is allowed on a resource
     */
    async evaluateAccess(params) {
        // Get all enabled policies for tenant, sorted by priority (highest first)
        const policies = await exports.PolicyModel.find({
            tenantId: params.tenantId,
            enabled: true
        }).sort({ priority: -1 });
        // Check policies in order
        for (const policy of policies) {
            const actionMatches = this.matchesPattern(params.action, policy.actions);
            const resourceMatches = this.matchesPattern(params.resource, policy.resources);
            if (actionMatches && resourceMatches) {
                // Check conditions if any
                if (policy.conditions && Object.keys(policy.conditions).length > 0) {
                    if (!this.evaluateConditions(params.context ?? {}, policy.conditions)) {
                        continue;
                    }
                }
                return policy.effect === index_js_1.PolicyEffect.ALLOW;
            }
        }
        // Default deny
        return false;
    }
    /**
     * Check if a value matches any pattern in a list
     */
    matchesPattern(value, patterns) {
        return patterns.some(pattern => {
            if (pattern === '*')
                return true;
            // Convert glob pattern to regex
            const regexPattern = pattern
                .replace(/\*/g, '.*')
                .replace(/\?/g, '.');
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(value);
        });
    }
    /**
     * Evaluate policy conditions against context
     */
    evaluateConditions(context, conditions) {
        for (const [key, expectedValue] of Object.entries(conditions)) {
            const actualValue = context[key];
            if (Array.isArray(expectedValue)) {
                // Check if actual value is in allowed list
                if (!expectedValue.includes(actualValue)) {
                    return false;
                }
            }
            else if (expectedValue !== actualValue) {
                return false;
            }
        }
        return true;
    }
    /**
     * List policies for a tenant
     */
    async listPolicies(tenantId) {
        const policies = await exports.PolicyModel.find({ tenantId }).sort({ priority: -1 });
        return policies.map(p => p.toObject());
    }
    /**
     * Update a policy
     */
    async updatePolicy(tenantId, policyId, updates) {
        const policy = await exports.PolicyModel.findOneAndUpdate({ _id: policyId, tenantId }, { $set: updates }, { new: true });
        return policy ? policy.toObject() : null;
    }
    /**
     * Delete a policy
     */
    async deletePolicy(tenantId, policyId) {
        const result = await exports.PolicyModel.deleteOne({ _id: policyId, tenantId });
        return result.deletedCount > 0;
    }
    /**
     * Check time-based restrictions
     */
    async checkTimeRestriction(tenantId, roleName) {
        const role = await exports.RolePermissionsModel.findOne({ tenantId, roleName });
        if (!role?.timeRestrictions)
            return true;
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay();
        const { allowedHours, allowedDays } = role.timeRestrictions;
        if (allowedHours && allowedHours.length > 0) {
            if (!allowedHours.includes(currentHour))
                return false;
        }
        if (allowedDays && allowedDays.length > 0) {
            if (!allowedDays.includes(currentDay))
                return false;
        }
        return true;
    }
}
exports.RBACService = RBACService;
exports.rbacService = new RBACService();
//# sourceMappingURL=rbacService.js.map