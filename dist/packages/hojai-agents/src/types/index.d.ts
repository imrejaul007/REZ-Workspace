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
        model: string;
        temperature: number;
        maxTokens: number;
        memoryEnabled: boolean;
        learningEnabled: boolean;
        tools?: string[] | undefined;
    }, {
        model?: string | undefined;
        temperature?: number | undefined;
        maxTokens?: number | undefined;
        tools?: string[] | undefined;
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
    schedule: {
        enabled: boolean;
        runOnStartup: boolean;
        cron?: string | undefined;
        intervalMs?: number | undefined;
    };
    id: string;
    version: string;
    stats: {
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        avgExecutionTime: number;
        lastRunAt?: Date | undefined;
    };
    name: string;
    type: AgentType;
    status: AgentStatus;
    config: {
        model: string;
        temperature: number;
        maxTokens: number;
        memoryEnabled: boolean;
        learningEnabled: boolean;
        tools?: string[] | undefined;
    };
    tenantId: string;
    description: string;
    capabilities: AgentCapability[];
    permissions: string[];
    createdAt: Date;
    updatedAt: Date;
}, {
    schedule: {
        enabled?: boolean | undefined;
        cron?: string | undefined;
        intervalMs?: number | undefined;
        runOnStartup?: boolean | undefined;
    };
    id: string;
    stats: {
        totalRuns?: number | undefined;
        successfulRuns?: number | undefined;
        failedRuns?: number | undefined;
        lastRunAt?: Date | undefined;
        avgExecutionTime?: number | undefined;
    };
    name: string;
    type: AgentType;
    config: {
        model?: string | undefined;
        temperature?: number | undefined;
        maxTokens?: number | undefined;
        tools?: string[] | undefined;
        memoryEnabled?: boolean | undefined;
        learningEnabled?: boolean | undefined;
    };
    tenantId: string;
    description: string;
    capabilities: AgentCapability[];
    createdAt: Date;
    updatedAt: Date;
    version?: string | undefined;
    status?: AgentStatus | undefined;
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
        action: string;
        duration: number;
        step: string;
        result?: any;
    }, {
        action: string;
        duration: number;
        step: string;
        result?: any;
    }>, "many">>;
    duration: z.ZodOptional<z.ZodNumber>;
    tokensUsed: z.ZodOptional<z.ZodNumber>;
    cost: z.ZodOptional<z.ZodNumber>;
    startedAt: z.ZodDate;
    completedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "running" | "completed" | "failed" | "pending";
    tenantId: string;
    agentId: string;
    trigger: "manual" | "event" | "api" | "scheduled";
    input: Record<string, any>;
    startedAt: Date;
    error?: string | undefined;
    duration?: number | undefined;
    output?: Record<string, any> | undefined;
    steps?: {
        action: string;
        duration: number;
        step: string;
        result?: any;
    }[] | undefined;
    tokensUsed?: number | undefined;
    cost?: number | undefined;
    completedAt?: Date | undefined;
}, {
    id: string;
    status: "running" | "completed" | "failed" | "pending";
    tenantId: string;
    agentId: string;
    trigger: "manual" | "event" | "api" | "scheduled";
    input: Record<string, any>;
    startedAt: Date;
    error?: string | undefined;
    duration?: number | undefined;
    output?: Record<string, any> | undefined;
    steps?: {
        action: string;
        duration: number;
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
    type: z.ZodEnum<["api", "function", "workflow", "external"]>;
    inputSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
    outputSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
    endpoint: z.ZodOptional<z.ZodString>;
    handler: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
    timeout: z.ZodDefault<z.ZodNumber>;
    retries: z.ZodDefault<z.ZodNumber>;
    rateLimit: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    type: "function" | "workflow" | "api" | "external";
    tenantId: string;
    timeout: number;
    description: string;
    createdAt: Date;
    inputSchema: Record<string, any>;
    outputSchema: Record<string, any>;
    retries: number;
    code?: string | undefined;
    handler?: string | undefined;
    endpoint?: string | undefined;
    rateLimit?: number | undefined;
}, {
    id: string;
    name: string;
    type: "function" | "workflow" | "api" | "external";
    tenantId: string;
    description: string;
    createdAt: Date;
    inputSchema: Record<string, any>;
    outputSchema: Record<string, any>;
    code?: string | undefined;
    timeout?: number | undefined;
    handler?: string | undefined;
    endpoint?: string | undefined;
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
    id: string;
    tenantId: string;
    agentId: string;
    source: string;
    createdAt: Date;
    content: string;
    metadata?: Record<string, any> | undefined;
    embedding?: number[] | undefined;
}, {
    id: string;
    tenantId: string;
    agentId: string;
    source: string;
    createdAt: Date;
    content: string;
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
    id: string;
    type: "prediction" | "recommendation" | "alert" | "anomaly" | "opportunity";
    status: "pending" | "acknowledged" | "actioned" | "dismissed";
    tenantId: string;
    agentId: string;
    runId: string;
    title: string;
    description: string;
    createdAt: Date;
    severity: "info" | "critical" | "low" | "medium" | "high";
    insight: Record<string, any>;
    action?: {
        type: string;
        params: Record<string, any>;
        autoExecute: boolean;
    } | undefined;
    acknowledgedBy?: string | undefined;
    acknowledgedAt?: Date | undefined;
}, {
    id: string;
    type: "prediction" | "recommendation" | "alert" | "anomaly" | "opportunity";
    status: "pending" | "acknowledged" | "actioned" | "dismissed";
    tenantId: string;
    agentId: string;
    runId: string;
    title: string;
    description: string;
    createdAt: Date;
    severity: "info" | "critical" | "low" | "medium" | "high";
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