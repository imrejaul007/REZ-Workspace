import { z } from 'zod';
export declare enum AgentType {
    DEMAND_SIGNAL = "demand_signal",
    SCARCITY = "scarcity",
    PERSONALIZATION = "personalization",
    ATTRIBUTION = "attribution",
    ADAPTIVE_SCORING = "adaptive_scoring",
    FEEDBACK_LOOP = "feedback_loop",
    NETWORK_EFFECT = "network_effect",
    REVENUE_ATTRIBUTION = "revenue_attribution",
    CUSTOM = "custom"
}
export declare enum AgentStatus {
    ACTIVE = "active",
    PAUSED = "paused",
    TRAINING = "training",
    ERROR = "error"
}
export declare enum AgentCapability {
    PREDICT = "predict",
    RECOMMEND = "recommend",
    ACT = "act",
    LEARN = "learn",
    COMMUNICATE = "communicate",
    ANALYZE = "analyze"
}
export declare const AgentSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    type: z.ZodNativeEnum<typeof AgentType>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof AgentStatus>>;
    version: z.ZodDefault<z.ZodString>;
    capabilities: z.ZodArray<z.ZodNativeEnum<typeof AgentCapability>, "many">;
    config: z.ZodObject<{
        model: z.ZodDefault<z.ZodString>;
        temperature: z.ZodDefault<z.ZodNumber>;
        maxTokens: z.ZodDefault<z.ZodNumber>;
        tools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        memoryEnabled: z.ZodDefault<z.ZodBoolean>;
        learningEnabled: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        temperature: number;
        maxTokens: number;
        model: string;
        memoryEnabled: boolean;
        learningEnabled: boolean;
        tools?: string[] | undefined;
    }, {
        tools?: string[] | undefined;
        temperature?: number | undefined;
        maxTokens?: number | undefined;
        model?: string | undefined;
        memoryEnabled?: boolean | undefined;
        learningEnabled?: boolean | undefined;
    }>;
    schedule: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        cron: z.ZodOptional<z.ZodString>;
        intervalMs: z.ZodOptional<z.ZodNumber>;
        runOnStartup: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        runOnStartup: boolean;
        cron?: string | undefined;
        intervalMs?: number | undefined;
    }, {
        enabled?: boolean | undefined;
        cron?: string | undefined;
        intervalMs?: number | undefined;
        runOnStartup?: boolean | undefined;
    }>;
    stats: z.ZodObject<{
        totalRuns: z.ZodDefault<z.ZodNumber>;
        successfulRuns: z.ZodDefault<z.ZodNumber>;
        failedRuns: z.ZodDefault<z.ZodNumber>;
        lastRunAt: z.ZodOptional<z.ZodDate>;
        avgExecutionTime: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        avgExecutionTime: number;
        lastRunAt?: Date | undefined;
    }, {
        totalRuns?: number | undefined;
        successfulRuns?: number | undefined;
        failedRuns?: number | undefined;
        lastRunAt?: Date | undefined;
        avgExecutionTime?: number | undefined;
    }>;
    permissions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: AgentType;
    description: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: AgentStatus;
    version: string;
    tenantId: string;
    capabilities: AgentCapability[];
    config: {
        temperature: number;
        maxTokens: number;
        model: string;
        memoryEnabled: boolean;
        learningEnabled: boolean;
        tools?: string[] | undefined;
    };
    schedule: {
        enabled: boolean;
        runOnStartup: boolean;
        cron?: string | undefined;
        intervalMs?: number | undefined;
    };
    stats: {
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        avgExecutionTime: number;
        lastRunAt?: Date | undefined;
    };
    permissions: string[];
}, {
    name: string;
    type: AgentType;
    description: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    capabilities: AgentCapability[];
    config: {
        tools?: string[] | undefined;
        temperature?: number | undefined;
        maxTokens?: number | undefined;
        model?: string | undefined;
        memoryEnabled?: boolean | undefined;
        learningEnabled?: boolean | undefined;
    };
    schedule: {
        enabled?: boolean | undefined;
        cron?: string | undefined;
        intervalMs?: number | undefined;
        runOnStartup?: boolean | undefined;
    };
    stats: {
        totalRuns?: number | undefined;
        successfulRuns?: number | undefined;
        failedRuns?: number | undefined;
        lastRunAt?: Date | undefined;
        avgExecutionTime?: number | undefined;
    };
    status?: AgentStatus | undefined;
    version?: string | undefined;
    permissions?: string[] | undefined;
}>;
export type Agent = z.infer<typeof AgentSchema>;
export declare const AgentRunSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    agentId: z.ZodString;
    status: z.ZodEnum<["pending", "running", "completed", "failed"]>;
    input: z.ZodRecord<z.ZodString, z.ZodAny>;
    trigger: z.ZodEnum<["manual", "scheduled", "event", "api"]>;
    output: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    error: z.ZodOptional<z.ZodString>;
    steps: z.ZodOptional<z.ZodArray<z.ZodObject<{
        step: z.ZodString;
        action: z.ZodString;
        result: z.ZodAny;
        duration: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        duration: number;
        action: string;
        step: string;
        result?: any;
    }, {
        duration: number;
        action: string;
        step: string;
        result?: any;
    }>, "many">>;
    duration: z.ZodOptional<z.ZodNumber>;
    tokensUsed: z.ZodOptional<z.ZodNumber>;
    cost: z.ZodOptional<z.ZodNumber>;
    startedAt: z.ZodDate;
    completedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    input: Record<string, any>;
    id: string;
    status: "pending" | "running" | "completed" | "failed";
    tenantId: string;
    agentId: string;
    trigger: "manual" | "scheduled" | "event" | "api";
    startedAt: Date;
    output?: Record<string, any> | undefined;
    error?: string | undefined;
    duration?: number | undefined;
    steps?: {
        duration: number;
        action: string;
        step: string;
        result?: any;
    }[] | undefined;
    tokensUsed?: number | undefined;
    cost?: number | undefined;
    completedAt?: Date | undefined;
}, {
    input: Record<string, any>;
    id: string;
    status: "pending" | "running" | "completed" | "failed";
    tenantId: string;
    agentId: string;
    trigger: "manual" | "scheduled" | "event" | "api";
    startedAt: Date;
    output?: Record<string, any> | undefined;
    error?: string | undefined;
    duration?: number | undefined;
    steps?: {
        duration: number;
        action: string;
        step: string;
        result?: any;
    }[] | undefined;
    tokensUsed?: number | undefined;
    cost?: number | undefined;
    completedAt?: Date | undefined;
}>;
export type AgentRun = z.infer<typeof AgentRunSchema>;
export declare const ToolSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    type: z.ZodEnum<["api", "function", "workflow", "external", "http", "database"]>;
    inputSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
    outputSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
    endpoint: z.ZodOptional<z.ZodString>;
    handler: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
    config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    timeout: z.ZodDefault<z.ZodNumber>;
    retries: z.ZodDefault<z.ZodNumber>;
    rateLimit: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "function" | "workflow" | "api" | "external" | "http" | "database";
    description: string;
    id: string;
    createdAt: Date;
    tenantId: string;
    inputSchema: Record<string, any>;
    outputSchema: Record<string, any>;
    timeout: number;
    retries: number;
    code?: string | undefined;
    config?: Record<string, any> | undefined;
    endpoint?: string | undefined;
    handler?: string | undefined;
    rateLimit?: number | undefined;
}, {
    name: string;
    type: "function" | "workflow" | "api" | "external" | "http" | "database";
    description: string;
    id: string;
    createdAt: Date;
    tenantId: string;
    inputSchema: Record<string, any>;
    outputSchema: Record<string, any>;
    code?: string | undefined;
    config?: Record<string, any> | undefined;
    endpoint?: string | undefined;
    handler?: string | undefined;
    timeout?: number | undefined;
    retries?: number | undefined;
    rateLimit?: number | undefined;
}>;
export type Tool = z.infer<typeof ToolSchema>;
export declare const KnowledgeBaseSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    agentId: z.ZodString;
    content: z.ZodString;
    source: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    embedding: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    source: string;
    content: string;
    id: string;
    createdAt: Date;
    tenantId: string;
    agentId: string;
    metadata?: Record<string, any> | undefined;
    embedding?: number[] | undefined;
}, {
    source: string;
    content: string;
    id: string;
    createdAt: Date;
    tenantId: string;
    agentId: string;
    metadata?: Record<string, any> | undefined;
    embedding?: number[] | undefined;
}>;
export type KnowledgeBase = z.infer<typeof KnowledgeBaseSchema>;
export declare const AgentInsightSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    agentId: z.ZodString;
    runId: z.ZodString;
    type: z.ZodEnum<["prediction", "recommendation", "alert", "anomaly", "opportunity"]>;
    severity: z.ZodEnum<["info", "low", "medium", "high", "critical"]>;
    title: z.ZodString;
    description: z.ZodString;
    insight: z.ZodRecord<z.ZodString, z.ZodAny>;
    action: z.ZodOptional<z.ZodObject<{
        type: z.ZodString;
        params: z.ZodRecord<z.ZodString, z.ZodAny>;
        autoExecute: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        params: Record<string, any>;
        autoExecute: boolean;
    }, {
        type: string;
        params: Record<string, any>;
        autoExecute?: boolean | undefined;
    }>>;
    status: z.ZodEnum<["pending", "acknowledged", "actioned", "dismissed"]>;
    acknowledgedBy: z.ZodOptional<z.ZodString>;
    acknowledgedAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type: "prediction" | "recommendation" | "alert" | "anomaly" | "opportunity";
    title: string;
    description: string;
    id: string;
    createdAt: Date;
    status: "pending" | "acknowledged" | "actioned" | "dismissed";
    tenantId: string;
    agentId: string;
    runId: string;
    severity: "low" | "medium" | "high" | "info" | "critical";
    insight: Record<string, any>;
    action?: {
        type: string;
        params: Record<string, any>;
        autoExecute: boolean;
    } | undefined;
    acknowledgedBy?: string | undefined;
    acknowledgedAt?: Date | undefined;
}, {
    type: "prediction" | "recommendation" | "alert" | "anomaly" | "opportunity";
    title: string;
    description: string;
    id: string;
    createdAt: Date;
    status: "pending" | "acknowledged" | "actioned" | "dismissed";
    tenantId: string;
    agentId: string;
    runId: string;
    severity: "low" | "medium" | "high" | "info" | "critical";
    insight: Record<string, any>;
    action?: {
        type: string;
        params: Record<string, any>;
        autoExecute?: boolean | undefined;
    } | undefined;
    acknowledgedBy?: string | undefined;
    acknowledgedAt?: Date | undefined;
}>;
export type AgentInsight = z.infer<typeof AgentInsightSchema>;
//# sourceMappingURL=index.d.ts.map