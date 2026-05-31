import { z } from 'zod';
export declare enum TenantType {
    REZ_ECOSYSTEM = "rez_ecosystem",
    RABTUL_SAAS = "rabtul_saas",
    EXTERNAL = "external",
    INTERNAL = "internal"
}
export declare enum TenantStatus {
    ACTIVE = "active",
    SUSPENDED = "suspended",
    TERMINATED = "terminated",
    PENDING = "pending"
}
export declare enum TenantTier {
    FREE = "free",
    STARTER = "starter",
    PROFESSIONAL = "professional",
    ENTERPRISE = "enterprise",
    PRIVILEGED = "privileged"
}
export declare const TenantSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodNativeEnum<typeof TenantType>;
    tier: z.ZodNativeEnum<typeof TenantTier>;
    status: z.ZodNativeEnum<typeof TenantStatus>;
    namespace: z.ZodString;
    features: z.ZodObject<{
        eventIngestion: z.ZodDefault<z.ZodBoolean>;
        memoryStorage: z.ZodDefault<z.ZodBoolean>;
        vectorSearch: z.ZodDefault<z.ZodBoolean>;
        workflowRuntime: z.ZodDefault<z.ZodBoolean>;
        agentRuntime: z.ZodDefault<z.ZodBoolean>;
        whatsappAI: z.ZodDefault<z.ZodBoolean>;
        hyperlocal: z.ZodDefault<z.ZodBoolean>;
        privilegedGraph: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        hyperlocal: boolean;
        eventIngestion: boolean;
        memoryStorage: boolean;
        vectorSearch: boolean;
        workflowRuntime: boolean;
        agentRuntime: boolean;
        whatsappAI: boolean;
        privilegedGraph: boolean;
    }, {
        hyperlocal?: boolean | undefined;
        eventIngestion?: boolean | undefined;
        memoryStorage?: boolean | undefined;
        vectorSearch?: boolean | undefined;
        workflowRuntime?: boolean | undefined;
        agentRuntime?: boolean | undefined;
        whatsappAI?: boolean | undefined;
        privilegedGraph?: boolean | undefined;
    }>;
    quotas: z.ZodObject<{
        eventsPerMonth: z.ZodDefault<z.ZodNumber>;
        memoryStorageMB: z.ZodDefault<z.ZodNumber>;
        apiCallsPerDay: z.ZodDefault<z.ZodNumber>;
        workflows: z.ZodDefault<z.ZodNumber>;
        agents: z.ZodDefault<z.ZodNumber>;
        users: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        agents: number;
        workflows: number;
        users: number;
        eventsPerMonth: number;
        memoryStorageMB: number;
        apiCallsPerDay: number;
    }, {
        agents?: number | undefined;
        workflows?: number | undefined;
        users?: number | undefined;
        eventsPerMonth?: number | undefined;
        memoryStorageMB?: number | undefined;
        apiCallsPerDay?: number | undefined;
    }>;
    isolation: z.ZodObject<{
        databaseNamespace: z.ZodString;
        redisNamespace: z.ZodString;
        vectorNamespace: z.ZodString;
        eventNamespace: z.ZodString;
        encryptAtRest: z.ZodDefault<z.ZodBoolean>;
        encryptInTransit: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        eventNamespace: string;
        databaseNamespace: string;
        redisNamespace: string;
        vectorNamespace: string;
        encryptAtRest: boolean;
        encryptInTransit: boolean;
    }, {
        eventNamespace: string;
        databaseNamespace: string;
        redisNamespace: string;
        vectorNamespace: string;
        encryptAtRest?: boolean | undefined;
        encryptInTransit?: boolean | undefined;
    }>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    activatedAt: z.ZodOptional<z.ZodDate>;
    suspendedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    namespace: string;
    id: string;
    name: string;
    type: TenantType;
    status: TenantStatus;
    features: {
        hyperlocal: boolean;
        eventIngestion: boolean;
        memoryStorage: boolean;
        vectorSearch: boolean;
        workflowRuntime: boolean;
        agentRuntime: boolean;
        whatsappAI: boolean;
        privilegedGraph: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
    tier: TenantTier;
    quotas: {
        agents: number;
        workflows: number;
        users: number;
        eventsPerMonth: number;
        memoryStorageMB: number;
        apiCallsPerDay: number;
    };
    isolation: {
        eventNamespace: string;
        databaseNamespace: string;
        redisNamespace: string;
        vectorNamespace: string;
        encryptAtRest: boolean;
        encryptInTransit: boolean;
    };
    activatedAt?: Date | undefined;
    suspendedAt?: Date | undefined;
}, {
    namespace: string;
    id: string;
    name: string;
    type: TenantType;
    status: TenantStatus;
    features: {
        hyperlocal?: boolean | undefined;
        eventIngestion?: boolean | undefined;
        memoryStorage?: boolean | undefined;
        vectorSearch?: boolean | undefined;
        workflowRuntime?: boolean | undefined;
        agentRuntime?: boolean | undefined;
        whatsappAI?: boolean | undefined;
        privilegedGraph?: boolean | undefined;
    };
    createdAt: Date;
    updatedAt: Date;
    tier: TenantTier;
    quotas: {
        agents?: number | undefined;
        workflows?: number | undefined;
        users?: number | undefined;
        eventsPerMonth?: number | undefined;
        memoryStorageMB?: number | undefined;
        apiCallsPerDay?: number | undefined;
    };
    isolation: {
        eventNamespace: string;
        databaseNamespace: string;
        redisNamespace: string;
        vectorNamespace: string;
        encryptAtRest?: boolean | undefined;
        encryptInTransit?: boolean | undefined;
    };
    activatedAt?: Date | undefined;
    suspendedAt?: Date | undefined;
}>;
export declare enum OrgRole {
    OWNER = "owner",
    ADMIN = "admin",
    MEMBER = "member",
    VIEWER = "viewer"
}
export declare const OrganizationSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    businessType: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    ownerId: z.ZodString;
    defaultRole: z.ZodDefault<z.ZodNativeEnum<typeof OrgRole>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    tenantId: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    ownerId: string;
    defaultRole: OrgRole;
    phone?: string | undefined;
    address?: string | undefined;
    website?: string | undefined;
    businessType?: string | undefined;
}, {
    id: string;
    name: string;
    tenantId: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    ownerId: string;
    phone?: string | undefined;
    address?: string | undefined;
    website?: string | undefined;
    businessType?: string | undefined;
    defaultRole?: OrgRole | undefined;
}>;
export declare enum UserStatus {
    ACTIVE = "active",
    INVITED = "invited",
    SUSPENDED = "suspended",
    DELETED = "deleted"
}
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    organizationId: z.ZodOptional<z.ZodString>;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    passwordHash: z.ZodString;
    name: z.ZodString;
    avatar: z.ZodOptional<z.ZodString>;
    timezone: z.ZodDefault<z.ZodString>;
    locale: z.ZodDefault<z.ZodString>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof UserStatus>>;
    emailVerified: z.ZodDefault<z.ZodBoolean>;
    phoneVerified: z.ZodDefault<z.ZodBoolean>;
    mfaEnabled: z.ZodDefault<z.ZodBoolean>;
    lastLoginAt: z.ZodOptional<z.ZodDate>;
    lastLoginIP: z.ZodOptional<z.ZodString>;
    failedLoginAttempts: z.ZodDefault<z.ZodNumber>;
    lockedUntil: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    status: UserStatus;
    tenantId: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    timezone: string;
    passwordHash: string;
    locale: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    mfaEnabled: boolean;
    failedLoginAttempts: number;
    phone?: string | undefined;
    organizationId?: string | undefined;
    avatar?: string | undefined;
    lastLoginAt?: Date | undefined;
    lastLoginIP?: string | undefined;
    lockedUntil?: Date | undefined;
}, {
    id: string;
    name: string;
    tenantId: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    passwordHash: string;
    status?: UserStatus | undefined;
    phone?: string | undefined;
    timezone?: string | undefined;
    organizationId?: string | undefined;
    avatar?: string | undefined;
    locale?: string | undefined;
    emailVerified?: boolean | undefined;
    phoneVerified?: boolean | undefined;
    mfaEnabled?: boolean | undefined;
    lastLoginAt?: Date | undefined;
    lastLoginIP?: string | undefined;
    failedLoginAttempts?: number | undefined;
    lockedUntil?: Date | undefined;
}>;
export declare enum ApiKeyType {
    SECRET = "secret",
    PUBLISHABLE = "publishable",
    SERVICE = "service"
}
export declare enum ApiKeyStatus {
    ACTIVE = "active",
    REVOKED = "revoked",
    EXPIRED = "expired"
}
export declare const ApiKeySchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    type: z.ZodNativeEnum<typeof ApiKeyType>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof ApiKeyStatus>>;
    keyHash: z.ZodString;
    keyPrefix: z.ZodString;
    permissions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    allowedIPs: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    allowedOrigins: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    rateLimitPerMinute: z.ZodDefault<z.ZodNumber>;
    quotaPerDay: z.ZodOptional<z.ZodNumber>;
    usedToday: z.ZodDefault<z.ZodNumber>;
    expiresAt: z.ZodOptional<z.ZodDate>;
    lastUsedAt: z.ZodOptional<z.ZodDate>;
    lastUsedIP: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    type: ApiKeyType;
    status: ApiKeyStatus;
    tenantId: string;
    permissions: string[];
    createdAt: Date;
    updatedAt: Date;
    keyPrefix: string;
    keyHash: string;
    rateLimitPerMinute: number;
    usedToday: number;
    userId?: string | undefined;
    allowedIPs?: string[] | undefined;
    allowedOrigins?: string[] | undefined;
    quotaPerDay?: number | undefined;
    expiresAt?: Date | undefined;
    lastUsedAt?: Date | undefined;
    lastUsedIP?: string | undefined;
}, {
    id: string;
    name: string;
    type: ApiKeyType;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    keyPrefix: string;
    keyHash: string;
    status?: ApiKeyStatus | undefined;
    userId?: string | undefined;
    permissions?: string[] | undefined;
    allowedIPs?: string[] | undefined;
    allowedOrigins?: string[] | undefined;
    rateLimitPerMinute?: number | undefined;
    quotaPerDay?: number | undefined;
    usedToday?: number | undefined;
    expiresAt?: Date | undefined;
    lastUsedAt?: Date | undefined;
    lastUsedIP?: string | undefined;
}>;
export declare enum Permission {
    EVENTS_READ = "events:read",
    EVENTS_WRITE = "events:write",
    EVENTS_ADMIN = "events:admin",
    MEMORY_READ = "memory:read",
    MEMORY_WRITE = "memory:write",
    MEMORY_DELETE = "memory:delete",
    MEMORY_ADMIN = "memory:admin",
    WORKFLOW_READ = "workflow:read",
    WORKFLOW_WRITE = "workflow:write",
    WORKFLOW_EXECUTE = "workflow:execute",
    WORKFLOW_ADMIN = "workflow:admin",
    AGENT_READ = "agent:read",
    AGENT_WRITE = "agent:write",
    AGENT_EXECUTE = "agent:execute",
    AGENT_ADMIN = "agent:admin",
    TENANT_READ = "tenant:read",
    TENANT_WRITE = "tenant:write",
    TENANT_ADMIN = "tenant:admin",
    ORG_READ = "org:read",
    ORG_WRITE = "org:write",
    ORG_ADMIN = "org:admin",
    USER_READ = "user:read",
    USER_WRITE = "user:write",
    USER_ADMIN = "user:admin",
    API_KEY_READ = "api_key:read",
    API_KEY_WRITE = "api_key:write",
    API_KEY_ADMIN = "api_key:admin",
    AUDIT_READ = "audit:read",
    AUDIT_EXPORT = "audit:export",
    PRIVILEGED_GRAPH = "privileged:graph",
    PRIVILEGED_IDENTITY = "privileged:identity",
    PRIVILEGED_ECOSYSTEM = "privileged:ecosystem"
}
export declare const RolePermissionsSchema: z.ZodObject<{
    roleId: z.ZodString;
    roleName: z.ZodString;
    tenantId: z.ZodString;
    permissions: z.ZodArray<z.ZodNativeEnum<typeof Permission>, "many">;
    resourceRestrictions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    timeRestrictions: z.ZodOptional<z.ZodObject<{
        allowedHours: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        allowedDays: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "strip", z.ZodTypeAny, {
        allowedHours?: number[] | undefined;
        allowedDays?: number[] | undefined;
    }, {
        allowedHours?: number[] | undefined;
        allowedDays?: number[] | undefined;
    }>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    permissions: Permission[];
    createdAt: Date;
    updatedAt: Date;
    roleId: string;
    roleName: string;
    resourceRestrictions?: Record<string, any> | undefined;
    timeRestrictions?: {
        allowedHours?: number[] | undefined;
        allowedDays?: number[] | undefined;
    } | undefined;
}, {
    tenantId: string;
    permissions: Permission[];
    createdAt: Date;
    updatedAt: Date;
    roleId: string;
    roleName: string;
    resourceRestrictions?: Record<string, any> | undefined;
    timeRestrictions?: {
        allowedHours?: number[] | undefined;
        allowedDays?: number[] | undefined;
    } | undefined;
}>;
export declare enum PolicyEffect {
    ALLOW = "allow",
    DENY = "deny"
}
export declare const PolicySchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    effect: z.ZodNativeEnum<typeof PolicyEffect>;
    actions: z.ZodArray<z.ZodString, "many">;
    resources: z.ZodArray<z.ZodString, "many">;
    conditions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    priority: z.ZodDefault<z.ZodNumber>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    tenantId: string;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    actions: string[];
    priority: number;
    effect: PolicyEffect;
    resources: string[];
    description?: string | undefined;
    conditions?: Record<string, any> | undefined;
}, {
    id: string;
    name: string;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    actions: string[];
    effect: PolicyEffect;
    resources: string[];
    description?: string | undefined;
    enabled?: boolean | undefined;
    priority?: number | undefined;
    conditions?: Record<string, any> | undefined;
}>;
export declare enum AuditAction {
    AUTH_LOGIN = "auth:login",
    AUTH_LOGOUT = "auth:logout",
    AUTH_LOGIN_FAILED = "auth:login_failed",
    AUTH_PASSWORD_RESET = "auth:password_reset",
    AUTH_MFA_ENABLED = "auth:mfa_enabled",
    TENANT_CREATED = "tenant:created",
    TENANT_UPDATED = "tenant:updated",
    TENANT_SUSPENDED = "tenant:suspended",
    TENANT_QUOTA_EXCEEDED = "tenant:quota_exceeded",
    ORG_CREATED = "org:created",
    ORG_UPDATED = "org:updated",
    ORG_MEMBER_ADDED = "org:member_added",
    ORG_MEMBER_REMOVED = "org:member_removed",
    USER_CREATED = "user:created",
    USER_UPDATED = "user:updated",
    USER_DELETED = "user:deleted",
    USER_ROLE_CHANGED = "user:role_changed",
    API_KEY_CREATED = "api_key:created",
    API_KEY_REVOKED = "api_key:revoked",
    API_KEY_EXCEEDED = "api_key:exceeded",
    RESOURCE_ACCESSED = "resource:accessed",
    RESOURCE_CREATED = "resource:created",
    RESOURCE_UPDATED = "resource:updated",
    RESOURCE_DELETED = "resource:deleted",
    POLICY_CREATED = "policy:created",
    POLICY_UPDATED = "policy:updated",
    POLICY_DELETED = "policy:deleted",
    POLICY_VIOLATED = "policy:violated"
}
export declare const AuditLogSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    organizationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    userEmail: z.ZodOptional<z.ZodString>;
    apiKeyId: z.ZodOptional<z.ZodString>;
    action: z.ZodNativeEnum<typeof AuditAction>;
    resource: z.ZodString;
    resourceId: z.ZodOptional<z.ZodString>;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    ip: z.ZodOptional<z.ZodString>;
    userAgent: z.ZodOptional<z.ZodString>;
    requestId: z.ZodOptional<z.ZodString>;
    success: z.ZodDefault<z.ZodBoolean>;
    error: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    action: AuditAction;
    id: string;
    tenantId: string;
    success: boolean;
    createdAt: Date;
    resource: string;
    details?: Record<string, any> | undefined;
    error?: string | undefined;
    resourceId?: string | undefined;
    userId?: string | undefined;
    ip?: string | undefined;
    userAgent?: string | undefined;
    organizationId?: string | undefined;
    userEmail?: string | undefined;
    apiKeyId?: string | undefined;
    requestId?: string | undefined;
}, {
    action: AuditAction;
    id: string;
    tenantId: string;
    createdAt: Date;
    resource: string;
    details?: Record<string, any> | undefined;
    error?: string | undefined;
    resourceId?: string | undefined;
    userId?: string | undefined;
    success?: boolean | undefined;
    ip?: string | undefined;
    userAgent?: string | undefined;
    organizationId?: string | undefined;
    userEmail?: string | undefined;
    apiKeyId?: string | undefined;
    requestId?: string | undefined;
}>;
export declare const UsageRecordSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    metric: z.ZodString;
    value: z.ZodNumber;
    unit: z.ZodString;
    period: z.ZodObject<{
        start: z.ZodDate;
        end: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        end: Date;
        start: Date;
    }, {
        end: Date;
        start: Date;
    }>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    metric: string;
    value: number;
    createdAt: Date;
    unit: string;
    period: {
        end: Date;
        start: Date;
    };
    metadata?: Record<string, any> | undefined;
}, {
    id: string;
    tenantId: string;
    metric: string;
    value: number;
    createdAt: Date;
    unit: string;
    period: {
        end: Date;
        start: Date;
    };
    metadata?: Record<string, any> | undefined;
}>;
export type Tenant = z.infer<typeof TenantSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type User = z.infer<typeof UserSchema>;
export type ApiKey = z.infer<typeof ApiKeySchema>;
export type RolePermissions = z.infer<typeof RolePermissionsSchema>;
export type Policy = z.infer<typeof PolicySchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type UsageRecord = z.infer<typeof UsageRecordSchema>;
//# sourceMappingURL=index.d.ts.map