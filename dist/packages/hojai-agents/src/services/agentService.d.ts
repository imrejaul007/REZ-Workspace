import mongoose from 'mongoose';
import { Agent, AgentRun, AgentInsight, AgentType, AgentStatus, AgentCapability } from '../types/index.js';
export declare const AgentModel: mongoose.Model<{
    version: string;
    name: string;
    type: AgentType;
    status: AgentStatus;
    tenantId: string;
    capabilities: AgentCapability[];
    permissions: string[];
    schedule?: {
        enabled: boolean;
        runOnStartup: boolean;
        cron?: string | null | undefined;
        intervalMs?: number | null | undefined;
    } | null | undefined;
    stats?: {
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        avgExecutionTime: number;
        lastRunAt?: NativeDate | null | undefined;
    } | null | undefined;
    config?: {
        model: string;
        temperature: number;
        maxTokens: number;
        tools: string[];
        memoryEnabled: boolean;
        learningEnabled: boolean;
    } | null | undefined;
    description?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    version: string;
    name: string;
    type: AgentType;
    status: AgentStatus;
    tenantId: string;
    capabilities: AgentCapability[];
    permissions: string[];
    schedule?: {
        enabled: boolean;
        runOnStartup: boolean;
        cron?: string | null | undefined;
        intervalMs?: number | null | undefined;
    } | null | undefined;
    stats?: {
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        avgExecutionTime: number;
        lastRunAt?: NativeDate | null | undefined;
    } | null | undefined;
    config?: {
        model: string;
        temperature: number;
        maxTokens: number;
        tools: string[];
        memoryEnabled: boolean;
        learningEnabled: boolean;
    } | null | undefined;
    description?: string | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    version: string;
    name: string;
    type: AgentType;
    status: AgentStatus;
    tenantId: string;
    capabilities: AgentCapability[];
    permissions: string[];
    schedule?: {
        enabled: boolean;
        runOnStartup: boolean;
        cron?: string | null | undefined;
        intervalMs?: number | null | undefined;
    } | null | undefined;
    stats?: {
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        avgExecutionTime: number;
        lastRunAt?: NativeDate | null | undefined;
    } | null | undefined;
    config?: {
        model: string;
        temperature: number;
        maxTokens: number;
        tools: string[];
        memoryEnabled: boolean;
        learningEnabled: boolean;
    } | null | undefined;
    description?: string | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    version: string;
    name: string;
    type: AgentType;
    status: AgentStatus;
    tenantId: string;
    capabilities: AgentCapability[];
    permissions: string[];
    schedule?: {
        enabled: boolean;
        runOnStartup: boolean;
        cron?: string | null | undefined;
        intervalMs?: number | null | undefined;
    } | null | undefined;
    stats?: {
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        avgExecutionTime: number;
        lastRunAt?: NativeDate | null | undefined;
    } | null | undefined;
    config?: {
        model: string;
        temperature: number;
        maxTokens: number;
        tools: string[];
        memoryEnabled: boolean;
        learningEnabled: boolean;
    } | null | undefined;
    description?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    version: string;
    name: string;
    type: AgentType;
    status: AgentStatus;
    tenantId: string;
    capabilities: AgentCapability[];
    permissions: string[];
    schedule?: {
        enabled: boolean;
        runOnStartup: boolean;
        cron?: string | null | undefined;
        intervalMs?: number | null | undefined;
    } | null | undefined;
    stats?: {
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        avgExecutionTime: number;
        lastRunAt?: NativeDate | null | undefined;
    } | null | undefined;
    config?: {
        model: string;
        temperature: number;
        maxTokens: number;
        tools: string[];
        memoryEnabled: boolean;
        learningEnabled: boolean;
    } | null | undefined;
    description?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    version: string;
    name: string;
    type: AgentType;
    status: AgentStatus;
    tenantId: string;
    capabilities: AgentCapability[];
    permissions: string[];
    schedule?: {
        enabled: boolean;
        runOnStartup: boolean;
        cron?: string | null | undefined;
        intervalMs?: number | null | undefined;
    } | null | undefined;
    stats?: {
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        avgExecutionTime: number;
        lastRunAt?: NativeDate | null | undefined;
    } | null | undefined;
    config?: {
        model: string;
        temperature: number;
        maxTokens: number;
        tools: string[];
        memoryEnabled: boolean;
        learningEnabled: boolean;
    } | null | undefined;
    description?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const AgentRunModel: mongoose.Model<{
    status: "running" | "completed" | "failed" | "pending";
    tenantId: string;
    agentId: string;
    steps: mongoose.Types.DocumentArray<{
        action?: string | null | undefined;
        duration?: number | null | undefined;
        step?: string | null | undefined;
        result?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        action?: string | null | undefined;
        duration?: number | null | undefined;
        step?: string | null | undefined;
        result?: any;
    }> & {
        action?: string | null | undefined;
        duration?: number | null | undefined;
        step?: string | null | undefined;
        result?: any;
    }>;
    startedAt: NativeDate;
    error?: string | null | undefined;
    duration?: number | null | undefined;
    output?: Map<string, any> | null | undefined;
    trigger?: "manual" | "event" | "api" | "scheduled" | null | undefined;
    input?: Map<string, any> | null | undefined;
    tokensUsed?: number | null | undefined;
    cost?: number | null | undefined;
    completedAt?: NativeDate | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    status: "running" | "completed" | "failed" | "pending";
    tenantId: string;
    agentId: string;
    steps: mongoose.Types.DocumentArray<{
        action?: string | null | undefined;
        duration?: number | null | undefined;
        step?: string | null | undefined;
        result?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        action?: string | null | undefined;
        duration?: number | null | undefined;
        step?: string | null | undefined;
        result?: any;
    }> & {
        action?: string | null | undefined;
        duration?: number | null | undefined;
        step?: string | null | undefined;
        result?: any;
    }>;
    startedAt: NativeDate;
    error?: string | null | undefined;
    duration?: number | null | undefined;
    output?: Map<string, any> | null | undefined;
    trigger?: "manual" | "event" | "api" | "scheduled" | null | undefined;
    input?: Map<string, any> | null | undefined;
    tokensUsed?: number | null | undefined;
    cost?: number | null | undefined;
    completedAt?: NativeDate | null | undefined;
}, {}, mongoose.DefaultSchemaOptions> & {
    status: "running" | "completed" | "failed" | "pending";
    tenantId: string;
    agentId: string;
    steps: mongoose.Types.DocumentArray<{
        action?: string | null | undefined;
        duration?: number | null | undefined;
        step?: string | null | undefined;
        result?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        action?: string | null | undefined;
        duration?: number | null | undefined;
        step?: string | null | undefined;
        result?: any;
    }> & {
        action?: string | null | undefined;
        duration?: number | null | undefined;
        step?: string | null | undefined;
        result?: any;
    }>;
    startedAt: NativeDate;
    error?: string | null | undefined;
    duration?: number | null | undefined;
    output?: Map<string, any> | null | undefined;
    trigger?: "manual" | "event" | "api" | "scheduled" | null | undefined;
    input?: Map<string, any> | null | undefined;
    tokensUsed?: number | null | undefined;
    cost?: number | null | undefined;
    completedAt?: NativeDate | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    status: "running" | "completed" | "failed" | "pending";
    tenantId: string;
    agentId: string;
    steps: mongoose.Types.DocumentArray<{
        action?: string | null | undefined;
        duration?: number | null | undefined;
        step?: string | null | undefined;
        result?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        action?: string | null | undefined;
        duration?: number | null | undefined;
        step?: string | null | undefined;
        result?: any;
    }> & {
        action?: string | null | undefined;
        duration?: number | null | undefined;
        step?: string | null | undefined;
        result?: any;
    }>;
    startedAt: NativeDate;
    error?: string | null | undefined;
    duration?: number | null | undefined;
    output?: Map<string, any> | null | undefined;
    trigger?: "manual" | "event" | "api" | "scheduled" | null | undefined;
    input?: Map<string, any> | null | undefined;
    tokensUsed?: number | null | undefined;
    cost?: number | null | undefined;
    completedAt?: NativeDate | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: "running" | "completed" | "failed" | "pending";
    tenantId: string;
    agentId: string;
    steps: mongoose.Types.DocumentArray<{
        action?: string | null | undefined;
        duration?: number | null | undefined;
        step?: string | null | undefined;
        result?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        action?: string | null | undefined;
        duration?: number | null | undefined;
        step?: string | null | undefined;
        result?: any;
    }> & {
        action?: string | null | undefined;
        duration?: number | null | undefined;
        step?: string | null | undefined;
        result?: any;
    }>;
    startedAt: NativeDate;
    error?: string | null | undefined;
    duration?: number | null | undefined;
    output?: Map<string, any> | null | undefined;
    trigger?: "manual" | "event" | "api" | "scheduled" | null | undefined;
    input?: Map<string, any> | null | undefined;
    tokensUsed?: number | null | undefined;
    cost?: number | null | undefined;
    completedAt?: NativeDate | null | undefined;
}>, {}, mongoose.DefaultSchemaOptions> & mongoose.FlatRecord<{
    status: "running" | "completed" | "failed" | "pending";
    tenantId: string;
    agentId: string;
    steps: mongoose.Types.DocumentArray<{
        action?: string | null | undefined;
        duration?: number | null | undefined;
        step?: string | null | undefined;
        result?: any;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        action?: string | null | undefined;
        duration?: number | null | undefined;
        step?: string | null | undefined;
        result?: any;
    }> & {
        action?: string | null | undefined;
        duration?: number | null | undefined;
        step?: string | null | undefined;
        result?: any;
    }>;
    startedAt: NativeDate;
    error?: string | null | undefined;
    duration?: number | null | undefined;
    output?: Map<string, any> | null | undefined;
    trigger?: "manual" | "event" | "api" | "scheduled" | null | undefined;
    input?: Map<string, any> | null | undefined;
    tokensUsed?: number | null | undefined;
    cost?: number | null | undefined;
    completedAt?: NativeDate | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const ToolModel: mongoose.Model<{
    name: string;
    type: "function" | "workflow" | "api" | "external";
    tenantId: string;
    timeout: number;
    retries: number;
    code?: string | null | undefined;
    description?: string | null | undefined;
    handler?: string | null | undefined;
    inputSchema?: Map<string, any> | null | undefined;
    outputSchema?: Map<string, any> | null | undefined;
    endpoint?: string | null | undefined;
    rateLimit?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    type: "function" | "workflow" | "api" | "external";
    tenantId: string;
    timeout: number;
    retries: number;
    code?: string | null | undefined;
    description?: string | null | undefined;
    handler?: string | null | undefined;
    inputSchema?: Map<string, any> | null | undefined;
    outputSchema?: Map<string, any> | null | undefined;
    endpoint?: string | null | undefined;
    rateLimit?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    name: string;
    type: "function" | "workflow" | "api" | "external";
    tenantId: string;
    timeout: number;
    retries: number;
    code?: string | null | undefined;
    description?: string | null | undefined;
    handler?: string | null | undefined;
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
    name: string;
    type: "function" | "workflow" | "api" | "external";
    tenantId: string;
    timeout: number;
    retries: number;
    code?: string | null | undefined;
    description?: string | null | undefined;
    handler?: string | null | undefined;
    inputSchema?: Map<string, any> | null | undefined;
    outputSchema?: Map<string, any> | null | undefined;
    endpoint?: string | null | undefined;
    rateLimit?: number | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    type: "function" | "workflow" | "api" | "external";
    tenantId: string;
    timeout: number;
    retries: number;
    code?: string | null | undefined;
    description?: string | null | undefined;
    handler?: string | null | undefined;
    inputSchema?: Map<string, any> | null | undefined;
    outputSchema?: Map<string, any> | null | undefined;
    endpoint?: string | null | undefined;
    rateLimit?: number | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    name: string;
    type: "function" | "workflow" | "api" | "external";
    tenantId: string;
    timeout: number;
    retries: number;
    code?: string | null | undefined;
    description?: string | null | undefined;
    handler?: string | null | undefined;
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
    tenantId: string;
    agentId: string;
    createdAt: NativeDate;
    content: string;
    embedding: number[];
    source?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    tenantId: string;
    agentId: string;
    createdAt: NativeDate;
    content: string;
    embedding: number[];
    source?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
}, {}, mongoose.DefaultSchemaOptions> & {
    tenantId: string;
    agentId: string;
    createdAt: NativeDate;
    content: string;
    embedding: number[];
    source?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    tenantId: string;
    agentId: string;
    createdAt: NativeDate;
    content: string;
    embedding: number[];
    source?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    tenantId: string;
    agentId: string;
    createdAt: NativeDate;
    content: string;
    embedding: number[];
    source?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
}>, {}, mongoose.DefaultSchemaOptions> & mongoose.FlatRecord<{
    tenantId: string;
    agentId: string;
    createdAt: NativeDate;
    content: string;
    embedding: number[];
    source?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const AgentInsightModel: mongoose.Model<{
    type: "prediction" | "recommendation" | "alert" | "anomaly" | "opportunity";
    status: "pending" | "acknowledged" | "actioned" | "dismissed";
    tenantId: string;
    agentId: string;
    runId: string;
    title: string;
    severity: "info" | "critical" | "low" | "medium" | "high";
    action?: string | null | undefined;
    description?: string | null | undefined;
    insight?: Map<string, any> | null | undefined;
    acknowledgedBy?: string | null | undefined;
    acknowledgedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    type: "prediction" | "recommendation" | "alert" | "anomaly" | "opportunity";
    status: "pending" | "acknowledged" | "actioned" | "dismissed";
    tenantId: string;
    agentId: string;
    runId: string;
    title: string;
    severity: "info" | "critical" | "low" | "medium" | "high";
    action?: string | null | undefined;
    description?: string | null | undefined;
    insight?: Map<string, any> | null | undefined;
    acknowledgedBy?: string | null | undefined;
    acknowledgedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    type: "prediction" | "recommendation" | "alert" | "anomaly" | "opportunity";
    status: "pending" | "acknowledged" | "actioned" | "dismissed";
    tenantId: string;
    agentId: string;
    runId: string;
    title: string;
    severity: "info" | "critical" | "low" | "medium" | "high";
    action?: string | null | undefined;
    description?: string | null | undefined;
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
    type: "prediction" | "recommendation" | "alert" | "anomaly" | "opportunity";
    status: "pending" | "acknowledged" | "actioned" | "dismissed";
    tenantId: string;
    agentId: string;
    runId: string;
    title: string;
    severity: "info" | "critical" | "low" | "medium" | "high";
    action?: string | null | undefined;
    description?: string | null | undefined;
    insight?: Map<string, any> | null | undefined;
    acknowledgedBy?: string | null | undefined;
    acknowledgedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    type: "prediction" | "recommendation" | "alert" | "anomaly" | "opportunity";
    status: "pending" | "acknowledged" | "actioned" | "dismissed";
    tenantId: string;
    agentId: string;
    runId: string;
    title: string;
    severity: "info" | "critical" | "low" | "medium" | "high";
    action?: string | null | undefined;
    description?: string | null | undefined;
    insight?: Map<string, any> | null | undefined;
    acknowledgedBy?: string | null | undefined;
    acknowledgedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    type: "prediction" | "recommendation" | "alert" | "anomaly" | "opportunity";
    status: "pending" | "acknowledged" | "actioned" | "dismissed";
    tenantId: string;
    agentId: string;
    runId: string;
    title: string;
    severity: "info" | "critical" | "low" | "medium" | "high";
    action?: string | null | undefined;
    description?: string | null | undefined;
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