"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageRecordSchema = exports.AuditLogSchema = exports.AuditAction = exports.PolicySchema = exports.PolicyEffect = exports.RolePermissionsSchema = exports.Permission = exports.ApiKeySchema = exports.ApiKeyStatus = exports.ApiKeyType = exports.UserSchema = exports.UserStatus = exports.OrganizationSchema = exports.OrgRole = exports.TenantSchema = exports.TenantTier = exports.TenantStatus = exports.TenantType = void 0;
const zod_1 = require("zod");
// ============================================================================
// TENANT TYPES
// ============================================================================
var TenantType;
(function (TenantType) {
    TenantType["REZ_ECOSYSTEM"] = "rez_ecosystem";
    TenantType["RABTUL_SAAS"] = "rabtul_saas";
    TenantType["EXTERNAL"] = "external";
    TenantType["INTERNAL"] = "internal";
})(TenantType || (exports.TenantType = TenantType = {}));
var TenantStatus;
(function (TenantStatus) {
    TenantStatus["ACTIVE"] = "active";
    TenantStatus["SUSPENDED"] = "suspended";
    TenantStatus["TERMINATED"] = "terminated";
    TenantStatus["PENDING"] = "pending";
})(TenantStatus || (exports.TenantStatus = TenantStatus = {}));
var TenantTier;
(function (TenantTier) {
    TenantTier["FREE"] = "free";
    TenantTier["STARTER"] = "starter";
    TenantTier["PROFESSIONAL"] = "professional";
    TenantTier["ENTERPRISE"] = "enterprise";
    TenantTier["PRIVILEGED"] = "privileged"; // REZ internal
})(TenantTier || (exports.TenantTier = TenantTier = {}));
exports.TenantSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(2).max(100),
    type: zod_1.z.nativeEnum(TenantType),
    tier: zod_1.z.nativeEnum(TenantTier),
    status: zod_1.z.nativeEnum(TenantStatus),
    // Namespace isolation
    namespace: zod_1.z.string().regex(/^[a-z0-9-]+$/),
    // Feature flags
    features: zod_1.z.object({
        eventIngestion: zod_1.z.boolean().default(true),
        memoryStorage: zod_1.z.boolean().default(true),
        vectorSearch: zod_1.z.boolean().default(true),
        workflowRuntime: zod_1.z.boolean().default(true),
        agentRuntime: zod_1.z.boolean().default(false),
        whatsappAI: zod_1.z.boolean().default(false),
        hyperlocal: zod_1.z.boolean().default(false),
        privilegedGraph: zod_1.z.boolean().default(false) // REZ-only
    }),
    // Quotas
    quotas: zod_1.z.object({
        eventsPerMonth: zod_1.z.number().default(10000),
        memoryStorageMB: zod_1.z.number().default(100),
        apiCallsPerDay: zod_1.z.number().default(1000),
        workflows: zod_1.z.number().default(5),
        agents: zod_1.z.number().default(0),
        users: zod_1.z.number().default(3)
    }),
    // Isolation settings
    isolation: zod_1.z.object({
        databaseNamespace: zod_1.z.string(),
        redisNamespace: zod_1.z.string(),
        vectorNamespace: zod_1.z.string(),
        eventNamespace: zod_1.z.string(),
        encryptAtRest: zod_1.z.boolean().default(true),
        encryptInTransit: zod_1.z.boolean().default(true)
    }),
    // Timestamps
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
    activatedAt: zod_1.z.date().optional(),
    suspendedAt: zod_1.z.date().optional()
});
// ============================================================================
// ORGANIZATION TYPES
// ============================================================================
var OrgRole;
(function (OrgRole) {
    OrgRole["OWNER"] = "owner";
    OrgRole["ADMIN"] = "admin";
    OrgRole["MEMBER"] = "member";
    OrgRole["VIEWER"] = "viewer";
})(OrgRole || (exports.OrgRole = OrgRole = {}));
exports.OrganizationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().optional(),
    // Business info
    businessType: zod_1.z.string().optional(),
    website: zod_1.z.string().url().optional(),
    address: zod_1.z.string().optional(),
    // RBAC
    ownerId: zod_1.z.string().uuid(),
    defaultRole: zod_1.z.nativeEnum(OrgRole).default(OrgRole.MEMBER),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// USER TYPES
// ============================================================================
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INVITED"] = "invited";
    UserStatus["SUSPENDED"] = "suspended";
    UserStatus["DELETED"] = "deleted";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    organizationId: zod_1.z.string().uuid().optional(),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().optional(),
    passwordHash: zod_1.z.string(),
    // Profile
    name: zod_1.z.string().min(2).max(100),
    avatar: zod_1.z.string().url().optional(),
    timezone: zod_1.z.string().default('Asia/Kolkata'),
    locale: zod_1.z.string().default('en-IN'),
    // Status
    status: zod_1.z.nativeEnum(UserStatus).default(UserStatus.INVITED),
    emailVerified: zod_1.z.boolean().default(false),
    phoneVerified: zod_1.z.boolean().default(false),
    mfaEnabled: zod_1.z.boolean().default(false),
    // Auth
    lastLoginAt: zod_1.z.date().optional(),
    lastLoginIP: zod_1.z.string().optional(),
    failedLoginAttempts: zod_1.z.number().default(0),
    lockedUntil: zod_1.z.date().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// API KEY TYPES
// ============================================================================
var ApiKeyType;
(function (ApiKeyType) {
    ApiKeyType["SECRET"] = "secret";
    ApiKeyType["PUBLISHABLE"] = "publishable";
    ApiKeyType["SERVICE"] = "service";
})(ApiKeyType || (exports.ApiKeyType = ApiKeyType = {}));
var ApiKeyStatus;
(function (ApiKeyStatus) {
    ApiKeyStatus["ACTIVE"] = "active";
    ApiKeyStatus["REVOKED"] = "revoked";
    ApiKeyStatus["EXPIRED"] = "expired";
})(ApiKeyStatus || (exports.ApiKeyStatus = ApiKeyStatus = {}));
exports.ApiKeySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(2).max(100),
    type: zod_1.z.nativeEnum(ApiKeyType),
    status: zod_1.z.nativeEnum(ApiKeyStatus).default(ApiKeyStatus.ACTIVE),
    // Key hash (never store raw)
    keyHash: zod_1.z.string(),
    keyPrefix: zod_1.z.string().max(8), // First 8 chars shown to user
    // Permissions
    permissions: zod_1.z.array(zod_1.z.string()).default([]),
    allowedIPs: zod_1.z.array(zod_1.z.string()).default([]).optional(),
    allowedOrigins: zod_1.z.array(zod_1.z.string()).default([]).optional(),
    // Rate limiting
    rateLimitPerMinute: zod_1.z.number().default(60),
    quotaPerDay: zod_1.z.number().optional(),
    usedToday: zod_1.z.number().default(0),
    // Expiration
    expiresAt: zod_1.z.date().optional(),
    lastUsedAt: zod_1.z.date().optional(),
    lastUsedIP: zod_1.z.string().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// RBAC TYPES
// ============================================================================
var Permission;
(function (Permission) {
    // Events
    Permission["EVENTS_READ"] = "events:read";
    Permission["EVENTS_WRITE"] = "events:write";
    Permission["EVENTS_ADMIN"] = "events:admin";
    // Memory
    Permission["MEMORY_READ"] = "memory:read";
    Permission["MEMORY_WRITE"] = "memory:write";
    Permission["MEMORY_DELETE"] = "memory:delete";
    Permission["MEMORY_ADMIN"] = "memory:admin";
    // Workflows
    Permission["WORKFLOW_READ"] = "workflow:read";
    Permission["WORKFLOW_WRITE"] = "workflow:write";
    Permission["WORKFLOW_EXECUTE"] = "workflow:execute";
    Permission["WORKFLOW_ADMIN"] = "workflow:admin";
    // Agents
    Permission["AGENT_READ"] = "agent:read";
    Permission["AGENT_WRITE"] = "agent:write";
    Permission["AGENT_EXECUTE"] = "agent:execute";
    Permission["AGENT_ADMIN"] = "agent:admin";
    // Admin
    Permission["TENANT_READ"] = "tenant:read";
    Permission["TENANT_WRITE"] = "tenant:write";
    Permission["TENANT_ADMIN"] = "tenant:admin";
    Permission["ORG_READ"] = "org:read";
    Permission["ORG_WRITE"] = "org:write";
    Permission["ORG_ADMIN"] = "org:admin";
    Permission["USER_READ"] = "user:read";
    Permission["USER_WRITE"] = "user:write";
    Permission["USER_ADMIN"] = "user:admin";
    Permission["API_KEY_READ"] = "api_key:read";
    Permission["API_KEY_WRITE"] = "api_key:write";
    Permission["API_KEY_ADMIN"] = "api_key:admin";
    Permission["AUDIT_READ"] = "audit:read";
    Permission["AUDIT_EXPORT"] = "audit:export";
    // Privileged (REZ-only)
    Permission["PRIVILEGED_GRAPH"] = "privileged:graph";
    Permission["PRIVILEGED_IDENTITY"] = "privileged:identity";
    Permission["PRIVILEGED_ECOSYSTEM"] = "privileged:ecosystem";
})(Permission || (exports.Permission = Permission = {}));
exports.RolePermissionsSchema = zod_1.z.object({
    roleId: zod_1.z.string().uuid(),
    roleName: zod_1.z.string(),
    tenantId: zod_1.z.string().uuid(),
    permissions: zod_1.z.array(zod_1.z.nativeEnum(Permission)),
    // Constraints
    resourceRestrictions: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    timeRestrictions: zod_1.z.object({
        allowedHours: zod_1.z.array(zod_1.z.number()).optional(), // 0-23
        allowedDays: zod_1.z.array(zod_1.z.number()).optional() // 0-6
    }).optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// POLICY TYPES
// ============================================================================
var PolicyEffect;
(function (PolicyEffect) {
    PolicyEffect["ALLOW"] = "allow";
    PolicyEffect["DENY"] = "deny";
})(PolicyEffect || (exports.PolicyEffect = PolicyEffect = {}));
exports.PolicySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(2).max(100),
    description: zod_1.z.string().optional(),
    effect: zod_1.z.nativeEnum(PolicyEffect),
    // Actions this policy applies to
    actions: zod_1.z.array(zod_1.z.string()),
    // Resources this policy applies to
    resources: zod_1.z.array(zod_1.z.string()), // e.g., "events:*", "memory:customer:*"
    // Conditions
    conditions: zod_1.z.record(zod_1.z.any()).optional(),
    // Priority (higher = evaluated first)
    priority: zod_1.z.number().default(0),
    enabled: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============================================================================
// AUDIT LOG TYPES
// ============================================================================
var AuditAction;
(function (AuditAction) {
    // Auth
    AuditAction["AUTH_LOGIN"] = "auth:login";
    AuditAction["AUTH_LOGOUT"] = "auth:logout";
    AuditAction["AUTH_LOGIN_FAILED"] = "auth:login_failed";
    AuditAction["AUTH_PASSWORD_RESET"] = "auth:password_reset";
    AuditAction["AUTH_MFA_ENABLED"] = "auth:mfa_enabled";
    // Tenant
    AuditAction["TENANT_CREATED"] = "tenant:created";
    AuditAction["TENANT_UPDATED"] = "tenant:updated";
    AuditAction["TENANT_SUSPENDED"] = "tenant:suspended";
    AuditAction["TENANT_QUOTA_EXCEEDED"] = "tenant:quota_exceeded";
    // Org
    AuditAction["ORG_CREATED"] = "org:created";
    AuditAction["ORG_UPDATED"] = "org:updated";
    AuditAction["ORG_MEMBER_ADDED"] = "org:member_added";
    AuditAction["ORG_MEMBER_REMOVED"] = "org:member_removed";
    // User
    AuditAction["USER_CREATED"] = "user:created";
    AuditAction["USER_UPDATED"] = "user:updated";
    AuditAction["USER_DELETED"] = "user:deleted";
    AuditAction["USER_ROLE_CHANGED"] = "user:role_changed";
    // API Key
    AuditAction["API_KEY_CREATED"] = "api_key:created";
    AuditAction["API_KEY_REVOKED"] = "api_key:revoked";
    AuditAction["API_KEY_EXCEEDED"] = "api_key:exceeded";
    // Resource
    AuditAction["RESOURCE_ACCESSED"] = "resource:accessed";
    AuditAction["RESOURCE_CREATED"] = "resource:created";
    AuditAction["RESOURCE_UPDATED"] = "resource:updated";
    AuditAction["RESOURCE_DELETED"] = "resource:deleted";
    // Policy
    AuditAction["POLICY_CREATED"] = "policy:created";
    AuditAction["POLICY_UPDATED"] = "policy:updated";
    AuditAction["POLICY_DELETED"] = "policy:deleted";
    AuditAction["POLICY_VIOLATED"] = "policy:violated";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
exports.AuditLogSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    organizationId: zod_1.z.string().uuid().optional(),
    // Who
    userId: zod_1.z.string().uuid().optional(),
    userEmail: zod_1.z.string().email().optional(),
    apiKeyId: zod_1.z.string().uuid().optional(),
    // What
    action: zod_1.z.nativeEnum(AuditAction),
    resource: zod_1.z.string(),
    resourceId: zod_1.z.string().optional(),
    // Details
    details: zod_1.z.record(zod_1.z.any()).optional(),
    // Context
    ip: zod_1.z.string().optional(),
    userAgent: zod_1.z.string().optional(),
    requestId: zod_1.z.string().optional(),
    // Result
    success: zod_1.z.boolean().default(true),
    error: zod_1.z.string().optional(),
    createdAt: zod_1.z.date()
});
// ============================================================================
// USAGE & METERING TYPES
// ============================================================================
exports.UsageRecordSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    metric: zod_1.z.string(), // events, api_calls, storage_mb, etc.
    value: zod_1.z.number(),
    unit: zod_1.z.string(),
    period: zod_1.z.object({
        start: zod_1.z.date(),
        end: zod_1.z.date()
    }),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    createdAt: zod_1.z.date()
});
//# sourceMappingURL=index.js.map