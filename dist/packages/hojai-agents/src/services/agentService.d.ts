import mongoose from 'mongoose';
import { Agent, AgentRun, AgentInsight, AgentType, AgentStatus, AgentCapability } from '../types/index.js';
export declare const AgentModel: mongoose.Model<{
    version: string;
    status: AgentStatus;
    type: AgentType;
    name: string;
    capabilities: AgentCapability[];
    tenantId: string;
    permissions: string[];
    stats?: {
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        avgExecutionTime: number;
        lastRunAt?: NativeDate | null | undefined;
    } | null | undefined;
    schedule?: {
        enabled: boolean;
        runOnStartup: boolean;
        cron?: string | null | undefined;
        intervalMs?: number | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    config?: {
        model: string;
        temperature: number;
        maxTokens: number;
        tools: string[];
        memoryEnabled: boolean;
        learningEnabled: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    version: string;
    status: AgentStatus;
    type: AgentType;
    name: string;
    capabilities: AgentCapability[];
    tenantId: string;
    permissions: string[];
    stats?: {
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        avgExecutionTime: number;
        lastRunAt?: NativeDate | null | undefined;
    } | null | undefined;
    schedule?: {
        enabled: boolean;
        runOnStartup: boolean;
        cron?: string | null | undefined;
        intervalMs?: number | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    config?: {
        model: string;
        temperature: number;
        maxTokens: number;
        tools: string[];
        memoryEnabled: boolean;
        learningEnabled: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    version: string;
    status: AgentStatus;
    type: AgentType;
    name: string;
    capabilities: AgentCapability[];
    tenantId: string;
    permissions: string[];
    stats?: {
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        avgExecutionTime: number;
        lastRunAt?: NativeDate | null | undefined;
    } | null | undefined;
    schedule?: {
        enabled: boolean;
        runOnStartup: boolean;
        cron?: string | null | undefined;
        intervalMs?: number | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    config?: {
        model: string;
        temperature: number;
        maxTokens: number;
        tools: string[];
        memoryEnabled: boolean;
        learningEnabled: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    version: string;
    status: AgentStatus;
    type: AgentType;
    name: string;
    capabilities: AgentCapability[];
    tenantId: string;
    permissions: string[];
    stats?: {
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        avgExecutionTime: number;
        lastRunAt?: NativeDate | null | undefined;
    } | null | undefined;
    schedule?: {
        enabled: boolean;
        runOnStartup: boolean;
        cron?: string | null | undefined;
        intervalMs?: number | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    config?: {
        model: string;
        temperature: number;
        maxTokens: number;
        tools: string[];
        memoryEnabled: boolean;
        learningEnabled: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    version: string;
    status: AgentStatus;
    type: AgentType;
    name: string;
    capabilities: AgentCapability[];
    tenantId: string;
    permissions: string[];
    stats?: {
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        avgExecutionTime: number;
        lastRunAt?: NativeDate | null | undefined;
    } | null | undefined;
    schedule?: {
        enabled: boolean;
        runOnStartup: boolean;
        cron?: string | null | undefined;
        intervalMs?: number | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    config?: {
        model: string;
        temperature: number;
        maxTokens: number;
        tools: string[];
        memoryEnabled: boolean;
        learningEnabled: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    version: string;
    status: AgentStatus;
    type: AgentType;
    name: string;
    capabilities: AgentCapability[];
    tenantId: string;
    permissions: string[];
    stats?: {
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        avgExecutionTime: number;
        lastRunAt?: NativeDate | null | undefined;
    } | null | undefined;
    schedule?: {
        enabled: boolean;
        runOnStartup: boolean;
        cron?: string | null | undefined;
        intervalMs?: number | null | undefined;
    } | null | undefined;
    description?: string | null | undefined;
    config?: {
        model: string;
        temperature: number;
        maxTokens: number;
        tools: string[];
        memoryEnabled: boolean;
        learningEnabled: boolean;
    } | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const AgentRunModel: mongoose.Model<{
    status: "completed" | "running" | "pending" | "failed";
    agentId: string;
    tenantId: string;
    startedAt: NativeDate;
    steps: mongoose.Types.DocumentArray<{
        result?: any;
        duration?: number | null | undefined;
        action?: string | null | undefined;
        step?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        result?: any;
        duration?: number | null | undefined;
        action?: string | null | undefined;
        step?: string | null | undefined;
    }> & {
        result?: any;
        duration?: number | null | undefined;
        action?: string | null | undefined;
        step?: string | null | undefined;
    }>;
    error?: string | null | undefined;
    input?: Map<string, any> | null | undefined;
    trigger?: "manual" | "event" | "scheduled" | "api" | null | undefined;
    duration?: number | null | undefined;
    cost?: number | null | undefined;
    completedAt?: NativeDate | null | undefined;
    output?: Map<string, any> | null | undefined;
    tokensUsed?: number | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    status: "completed" | "running" | "pending" | "failed";
    agentId: string;
    tenantId: string;
    startedAt: NativeDate;
    steps: mongoose.Types.DocumentArray<{
        result?: any;
        duration?: number | null | undefined;
        action?: string | null | undefined;
        step?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        result?: any;
        duration?: number | null | undefined;
        action?: string | null | undefined;
        step?: string | null | undefined;
    }> & {
        result?: any;
        duration?: number | null | undefined;
        action?: string | null | undefined;
        step?: string | null | undefined;
    }>;
    error?: string | null | undefined;
    input?: Map<string, any> | null | undefined;
    trigger?: "manual" | "event" | "scheduled" | "api" | null | undefined;
    duration?: number | null | undefined;
    cost?: number | null | undefined;
    completedAt?: NativeDate | null | undefined;
    output?: Map<string, any> | null | undefined;
    tokensUsed?: number | null | undefined;
}, {}, mongoose.DefaultSchemaOptions> & {
    status: "completed" | "running" | "pending" | "failed";
    agentId: string;
    tenantId: string;
    startedAt: NativeDate;
    steps: mongoose.Types.DocumentArray<{
        result?: any;
        duration?: number | null | undefined;
        action?: string | null | undefined;
        step?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        result?: any;
        duration?: number | null | undefined;
        action?: string | null | undefined;
        step?: string | null | undefined;
    }> & {
        result?: any;
        duration?: number | null | undefined;
        action?: string | null | undefined;
        step?: string | null | undefined;
    }>;
    error?: string | null | undefined;
    input?: Map<string, any> | null | undefined;
    trigger?: "manual" | "event" | "scheduled" | "api" | null | undefined;
    duration?: number | null | undefined;
    cost?: number | null | undefined;
    completedAt?: NativeDate | null | undefined;
    output?: Map<string, any> | null | undefined;
    tokensUsed?: number | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    status: "completed" | "running" | "pending" | "failed";
    agentId: string;
    tenantId: string;
    startedAt: NativeDate;
    steps: mongoose.Types.DocumentArray<{
        result?: any;
        duration?: number | null | undefined;
        action?: string | null | undefined;
        step?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        result?: any;
        duration?: number | null | undefined;
        action?: string | null | undefined;
        step?: string | null | undefined;
    }> & {
        result?: any;
        duration?: number | null | undefined;
        action?: string | null | undefined;
        step?: string | null | undefined;
    }>;
    error?: string | null | undefined;
    input?: Map<string, any> | null | undefined;
    trigger?: "manual" | "event" | "scheduled" | "api" | null | undefined;
    duration?: number | null | undefined;
    cost?: number | null | undefined;
    completedAt?: NativeDate | null | undefined;
    output?: Map<string, any> | null | undefined;
    tokensUsed?: number | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: "completed" | "running" | "pending" | "failed";
    agentId: string;
    tenantId: string;
    startedAt: NativeDate;
    steps: mongoose.Types.DocumentArray<{
        result?: any;
        duration?: number | null | undefined;
        action?: string | null | undefined;
        step?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        result?: any;
        duration?: number | null | undefined;
        action?: string | null | undefined;
        step?: string | null | undefined;
    }> & {
        result?: any;
        duration?: number | null | undefined;
        action?: string | null | undefined;
        step?: string | null | undefined;
    }>;
    error?: string | null | undefined;
    input?: Map<string, any> | null | undefined;
    trigger?: "manual" | "event" | "scheduled" | "api" | null | undefined;
    duration?: number | null | undefined;
    cost?: number | null | undefined;
    completedAt?: NativeDate | null | undefined;
    output?: Map<string, any> | null | undefined;
    tokensUsed?: number | null | undefined;
}>, {}, mongoose.DefaultSchemaOptions> & mongoose.FlatRecord<{
    status: "completed" | "running" | "pending" | "failed";
    agentId: string;
    tenantId: string;
    startedAt: NativeDate;
    steps: mongoose.Types.DocumentArray<{
        result?: any;
        duration?: number | null | undefined;
        action?: string | null | undefined;
        step?: string | null | undefined;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        result?: any;
        duration?: number | null | undefined;
        action?: string | null | undefined;
        step?: string | null | undefined;
    }> & {
        result?: any;
        duration?: number | null | undefined;
        action?: string | null | undefined;
        step?: string | null | undefined;
    }>;
    error?: string | null | undefined;
    input?: Map<string, any> | null | undefined;
    trigger?: "manual" | "event" | "scheduled" | "api" | null | undefined;
    duration?: number | null | undefined;
    cost?: number | null | undefined;
    completedAt?: NativeDate | null | undefined;
    output?: Map<string, any> | null | undefined;
    tokensUsed?: number | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const ToolModel: mongoose.Model<{
    type: "function" | "workflow" | "api" | "external";
    name: string;
    tenantId: string;
    timeout: number;
    retries: number;
    handler?: string | null | undefined;
    code?: string | null | undefined;
    description?: string | null | undefined;
    inputSchema?: Map<string, any> | null | undefined;
    outputSchema?: Map<string, any> | null | undefined;
    endpoint?: string | null | undefined;
    rateLimit?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    type: "function" | "workflow" | "api" | "external";
    name: string;
    tenantId: string;
    timeout: number;
    retries: number;
    handler?: string | null | undefined;
    code?: string | null | undefined;
    description?: string | null | undefined;
    inputSchema?: Map<string, any> | null | undefined;
    outputSchema?: Map<string, any> | null | undefined;
    endpoint?: string | null | undefined;
    rateLimit?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    type: "function" | "workflow" | "api" | "external";
    name: string;
    tenantId: string;
    timeout: number;
    retries: number;
    handler?: string | null | undefined;
    code?: string | null | undefined;
    description?: string | null | undefined;
    inputSchema?: Map<string, any> | null | undefined;
    outputSchema?: Map<string, any> | null | undefined;
    endpoint?: string | null | undefined;
    rateLimit?: number | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    type: "function" | "workflow" | "api" | "external";
    name: string;
    tenantId: string;
    timeout: number;
    retries: number;
    handler?: string | null | undefined;
    code?: string | null | undefined;
    description?: string | null | undefined;
    inputSchema?: Map<string, any> | null | undefined;
    outputSchema?: Map<string, any> | null | undefined;
    endpoint?: string | null | undefined;
    rateLimit?: number | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    type: "function" | "workflow" | "api" | "external";
    name: string;
    tenantId: string;
    timeout: number;
    retries: number;
    handler?: string | null | undefined;
    code?: string | null | undefined;
    description?: string | null | undefined;
    inputSchema?: Map<string, any> | null | undefined;
    outputSchema?: Map<string, any> | null | undefined;
    endpoint?: string | null | undefined;
    rateLimit?: number | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    type: "function" | "workflow" | "api" | "external";
    name: string;
    tenantId: string;
    timeout: number;
    retries: number;
    handler?: string | null | undefined;
    code?: string | null | undefined;
    description?: string | null | undefined;
    inputSchema?: Map<string, any> | null | undefined;
    outputSchema?: Map<string, any> | null | undefined;
    endpoint?: string | null | undefined;
    rateLimit?: number | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const KnowledgeBaseModel: mongoose.Model<{
    agentId: string;
    tenantId: string;
    content: string;
    createdAt: NativeDate;
    embedding: number[];
    metadata?: Map<string, any> | null | undefined;
    source?: string | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    agentId: string;
    tenantId: string;
    content: string;
    createdAt: NativeDate;
    embedding: number[];
    metadata?: Map<string, any> | null | undefined;
    source?: string | null | undefined;
}, {}, mongoose.DefaultSchemaOptions> & {
    agentId: string;
    tenantId: string;
    content: string;
    createdAt: NativeDate;
    embedding: number[];
    metadata?: Map<string, any> | null | undefined;
    source?: string | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    agentId: string;
    tenantId: string;
    content: string;
    createdAt: NativeDate;
    embedding: number[];
    metadata?: Map<string, any> | null | undefined;
    source?: string | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    agentId: string;
    tenantId: string;
    content: string;
    createdAt: NativeDate;
    embedding: number[];
    metadata?: Map<string, any> | null | undefined;
    source?: string | null | undefined;
}>, {}, mongoose.DefaultSchemaOptions> & mongoose.FlatRecord<{
    agentId: string;
    tenantId: string;
    content: string;
    createdAt: NativeDate;
    embedding: number[];
    metadata?: Map<string, any> | null | undefined;
    source?: string | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const AgentInsightModel: mongoose.Model<{
    status: "pending" | "acknowledged" | "actioned" | "dismissed";
    type: "alert" | "recommendation" | "anomaly" | "opportunity" | "prediction";
    agentId: string;
    tenantId: string;
    runId: string;
    title: string;
    severity: "info" | "critical" | "low" | "high" | "medium";
    description?: string | null | undefined;
    action?: string | null | undefined;
    insight?: Map<string, any> | null | undefined;
    acknowledgedBy?: string | null | undefined;
    acknowledgedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    status: "pending" | "acknowledged" | "actioned" | "dismissed";
    type: "alert" | "recommendation" | "anomaly" | "opportunity" | "prediction";
    agentId: string;
    tenantId: string;
    runId: string;
    title: string;
    severity: "info" | "critical" | "low" | "high" | "medium";
    description?: string | null | undefined;
    action?: string | null | undefined;
    insight?: Map<string, any> | null | undefined;
    acknowledgedBy?: string | null | undefined;
    acknowledgedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    status: "pending" | "acknowledged" | "actioned" | "dismissed";
    type: "alert" | "recommendation" | "anomaly" | "opportunity" | "prediction";
    agentId: string;
    tenantId: string;
    runId: string;
    title: string;
    severity: "info" | "critical" | "low" | "high" | "medium";
    description?: string | null | undefined;
    action?: string | null | undefined;
    insight?: Map<string, any> | null | undefined;
    acknowledgedBy?: string | null | undefined;
    acknowledgedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: "pending" | "acknowledged" | "actioned" | "dismissed";
    type: "alert" | "recommendation" | "anomaly" | "opportunity" | "prediction";
    agentId: string;
    tenantId: string;
    runId: string;
    title: string;
    severity: "info" | "critical" | "low" | "high" | "medium";
    description?: string | null | undefined;
    action?: string | null | undefined;
    insight?: Map<string, any> | null | undefined;
    acknowledgedBy?: string | null | undefined;
    acknowledgedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: "pending" | "acknowledged" | "actioned" | "dismissed";
    type: "alert" | "recommendation" | "anomaly" | "opportunity" | "prediction";
    agentId: string;
    tenantId: string;
    runId: string;
    title: string;
    severity: "info" | "critical" | "low" | "high" | "medium";
    description?: string | null | undefined;
    action?: string | null | undefined;
    insight?: Map<string, any> | null | undefined;
    acknowledgedBy?: string | null | undefined;
    acknowledgedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    status: "pending" | "acknowledged" | "actioned" | "dismissed";
    type: "alert" | "recommendation" | "anomaly" | "opportunity" | "prediction";
    agentId: string;
    tenantId: string;
    runId: string;
    title: string;
    severity: "info" | "critical" | "low" | "high" | "medium";
    description?: string | null | undefined;
    action?: string | null | undefined;
    insight?: Map<string, any> | null | undefined;
    acknowledgedBy?: string | null | undefined;
    acknowledgedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare class AgentService {
    private redis;
    constructor();
    createAgent(params: Omit<Agent, 'id' | 'stats' | 'createdAt' | 'updatedAt'>): Promise<Agent>;
    getAgent(tenantId: string, agentId: string): Promise<Agent | null>;
    listAgents(tenantId: string, type?: AgentType): Promise<Agent[]>;
    updateAgent(tenantId: string, agentId: string, updates: Partial<Agent>): Promise<Agent | null>;
    deleteAgent(tenantId: string, agentId: string): Promise<void>;
    runAgent(params: {
        tenantId: string;
        agentId: string;
        input: Record<string, unknown>;
        trigger?: 'manual' | 'api';
    }): Promise<AgentRun>;
    private executeAgent;
    /**
     * Analyze input using LLM
     */
    private analyzeInput;
    /**
     * Retrieve relevant knowledge from knowledge base
     */
    private retrieveKnowledge;
    /**
     * Get knowledge base for agent
     */
    private getAgentKnowledgeBase;
    /**
     * Execute tools/actions
     */
    private executeActions;
    /**
     * Get tool by name
     */
    private getTool;
    /**
     * Execute a tool
     */
    private executeTool;
    private generateInsights;
    private determineActions;
    getRunHistory(tenantId: string, agentId: string, limit?: number): Promise<AgentRun[]>;
    getInsights(tenantId: string, params: {
        agentId?: string;
        severity?: string;
        status?: string;
        limit?: number;
    }): Promise<AgentInsight[]>;
    acknowledgeInsight(tenantId: string, insightId: string, acknowledgedBy: string): Promise<void>;
}
export declare const agentService: AgentService;
//# sourceMappingURL=agentService.d.ts.map