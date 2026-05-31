import { z } from 'zod';
// ============================================================================
// TENANT TYPES
// ============================================================================
export var TenantType;
(function (TenantType) {
    TenantType["REZ_ECOSYSTEM"] = "rez_ecosystem";
    TenantType["RABTUL_SAAS"] = "rabtul_saas";
    TenantType["EXTERNAL"] = "external";
    TenantType["INTERNAL"] = "internal";
})(TenantType || (TenantType = {}));
export var TenantStatus;
(function (TenantStatus) {
    TenantStatus["ACTIVE"] = "active";
    TenantStatus["SUSPENDED"] = "suspended";
    TenantStatus["TERMINATED"] = "terminated";
    TenantStatus["PENDING"] = "pending";
})(TenantStatus || (TenantStatus = {}));
export var TenantTier;
(function (TenantTier) {
    TenantTier["FREE"] = "free";
    TenantTier["STARTER"] = "starter";
    TenantTier["PROFESSIONAL"] = "professional";
    TenantTier["ENTERPRISE"] = "enterprise";
    TenantTier["PRIVILEGED"] = "privileged"; // REZ internal
})(TenantTier || (TenantTier = {}));
export const TenantSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2).max(100),
    type: z.nativeEnum(TenantType),
    tier: z.nativeEnum(TenantTier),
    status: z.nativeEnum(TenantStatus),
    // Namespace isolation
    namespace: z.string().regex(/^[a-z0-9-]+$/),
    // Feature flags
    features: z.object({
        eventIngestion: z.boolean().default(true),
        memoryStorage: z.boolean().default(true),
        vectorSearch: z.boolean().default(true),
        workflowRuntime: z.boolean().default(true),
        agentRuntime: z.boolean().default(false),
        whatsappAI: z.boolean().default(false),
        hyperlocal: z.boolean().default(false),
        privilegedGraph: z.boolean().default(false) // REZ-only
    }),
    // Quotas
    quotas: z.object({
        eventsPerMonth: z.number().default(10000),
        memoryStorageMB: z.number().default(100),
        apiCallsPerDay: z.number().default(1000),
        workflows: z.number().default(5),
        agents: z.number().default(0),
        users: z.number().default(3)
    }),
    // Isolation settings
    isolation: z.object({
        databaseNamespace: z.string(),
        redisNamespace: z.string(),
        vectorNamespace: z.string(),
        eventNamespace: z.string(),
        encryptAtRest: z.boolean().default(true),
        encryptInTransit: z.boolean().default(true)
    }),
    // Timestamps
    createdAt: z.date(),
    updatedAt: z.date(),
    activatedAt: z.date().optional(),
    suspendedAt: z.date().optional()
});
// ============================================================================
// ORGANIZATION TYPES
// ============================================================================
export var OrgRole;
(function (OrgRole) {
    OrgRole["OWNER"] = "owner";
    OrgRole["ADMIN"] = "admin";
    OrgRole["MEMBER"] = "member";
    OrgRole["VIEWER"] = "viewer";
})(OrgRole || (OrgRole = {}));
export const OrganizationSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    name: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().optional(),
    // Business info
    businessType: z.string().optional(),
    website: z.string().url().optional(),
    address: z.string().optional(),
    // RBAC
    ownerId: z.string().uuid(),
    defaultRole: z.nativeEnum(OrgRole).default(OrgRole.MEMBER),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============================================================================
// USER TYPES
// ============================================================================
export var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INVITED"] = "invited";
    UserStatus["SUSPENDED"] = "suspended";
    UserStatus["DELETED"] = "deleted";
})(UserStatus || (UserStatus = {}));
export const UserSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    organizationId: z.string().uuid().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    passwordHash: z.string(),
    // Profile
    name: z.string().min(2).max(100),
    avatar: z.string().url().optional(),
    timezone: z.string().default('Asia/Kolkata'),
    locale: z.string().default('en-IN'),
    // Status
    status: z.nativeEnum(UserStatus).default(UserStatus.INVITED),
    emailVerified: z.boolean().default(false),
    phoneVerified: z.boolean().default(false),
    mfaEnabled: z.boolean().default(false),
    // Auth
    lastLoginAt: z.date().optional(),
    lastLoginIP: z.string().optional(),
    failedLoginAttempts: z.number().default(0),
    lockedUntil: z.date().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============================================================================
// API KEY TYPES
// ============================================================================
export var ApiKeyType;
(function (ApiKeyType) {
    ApiKeyType["SECRET"] = "secret";
    ApiKeyType["PUBLISHABLE"] = "publishable";
    ApiKeyType["SERVICE"] = "service";
})(ApiKeyType || (ApiKeyType = {}));
export var ApiKeyStatus;
(function (ApiKeyStatus) {
    ApiKeyStatus["ACTIVE"] = "active";
    ApiKeyStatus["REVOKED"] = "revoked";
    ApiKeyStatus["EXPIRED"] = "expired";
})(ApiKeyStatus || (ApiKeyStatus = {}));
export const ApiKeySchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    userId: z.string().uuid().optional(),
    name: z.string().min(2).max(100),
    type: z.nativeEnum(ApiKeyType),
    status: z.nativeEnum(ApiKeyStatus).default(ApiKeyStatus.ACTIVE),
    // Key hash (never store raw)
    keyHash: z.string(),
    keyPrefix: z.string().max(8), // First 8 chars shown to user
    // Permissions
    permissions: z.array(z.string()).default([]),
    allowedIPs: z.array(z.string()).default([]).optional(),
    allowedOrigins: z.array(z.string()).default([]).optional(),
    // Rate limiting
    rateLimitPerMinute: z.number().default(60),
    quotaPerDay: z.number().optional(),
    usedToday: z.number().default(0),
    // Expiration
    expiresAt: z.date().optional(),
    lastUsedAt: z.date().optional(),
    lastUsedIP: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============================================================================
// RBAC TYPES
// ============================================================================
export var Permission;
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
})(Permission || (Permission = {}));
export const RolePermissionsSchema = z.object({
    roleId: z.string().uuid(),
    roleName: z.string(),
    tenantId: z.string().uuid(),
    permissions: z.array(z.nativeEnum(Permission)),
    // Constraints
    resourceRestrictions: z.record(z.string(), z.any()).optional(),
    timeRestrictions: z.object({
        allowedHours: z.array(z.number()).optional(), // 0-23
        allowedDays: z.array(z.number()).optional() // 0-6
    }).optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============================================================================
// POLICY TYPES
// ============================================================================
export var PolicyEffect;
(function (PolicyEffect) {
    PolicyEffect["ALLOW"] = "allow";
    PolicyEffect["DENY"] = "deny";
})(PolicyEffect || (PolicyEffect = {}));
export const PolicySchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    name: z.string().min(2).max(100),
    description: z.string().optional(),
    effect: z.nativeEnum(PolicyEffect),
    // Actions this policy applies to
    actions: z.array(z.string()),
    // Resources this policy applies to
    resources: z.array(z.string()), // e.g., "events:*", "memory:customer:*"
    // Conditions
    conditions: z.record(z.any()).optional(),
    // Priority (higher = evaluated first)
    priority: z.number().default(0),
    enabled: z.boolean().default(true),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============================================================================
// AUDIT LOG TYPES
// ============================================================================
export var AuditAction;
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
})(AuditAction || (AuditAction = {}));
export const AuditLogSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    organizationId: z.string().uuid().optional(),
    // Who
    userId: z.string().uuid().optional(),
    userEmail: z.string().email().optional(),
    apiKeyId: z.string().uuid().optional(),
    // What
    action: z.nativeEnum(AuditAction),
    resource: z.string(),
    resourceId: z.string().optional(),
    // Details
    details: z.record(z.any()).optional(),
    // Context
    ip: z.string().optional(),
    userAgent: z.string().optional(),
    requestId: z.string().optional(),
    // Result
    success: z.boolean().default(true),
    error: z.string().optional(),
    createdAt: z.date()
});
// ============================================================================
// USAGE & METERING TYPES
// ============================================================================
export const UsageRecordSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    metric: z.string(), // events, api_calls, storage_mb, etc.
    value: z.number(),
    unit: z.string(),
    period: z.object({
        start: z.date(),
        end: z.date()
    }),
    metadata: z.record(z.any()).optional(),
    createdAt: z.date()
});
//# sourceMappingURL=index.js.map