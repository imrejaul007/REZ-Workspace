import { z } from 'zod';
export var AgentType;
(function (AgentType) {
    AgentType["DEMAND_SIGNAL"] = "demand_signal";
    AgentType["SCARCITY"] = "scarcity";
    AgentType["PERSONALIZATION"] = "personalization";
    AgentType["ATTRIBUTION"] = "attribution";
    AgentType["ADAPTIVE_SCORING"] = "adaptive_scoring";
    AgentType["FEEDBACK_LOOP"] = "feedback_loop";
    AgentType["NETWORK_EFFECT"] = "network_effect";
    AgentType["REVENUE_ATTRIBUTION"] = "revenue_attribution";
    AgentType["CUSTOM"] = "custom";
})(AgentType || (AgentType = {}));
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ACTIVE"] = "active";
    AgentStatus["PAUSED"] = "paused";
    AgentStatus["TRAINING"] = "training";
    AgentStatus["ERROR"] = "error";
})(AgentStatus || (AgentStatus = {}));
export var AgentCapability;
(function (AgentCapability) {
    AgentCapability["PREDICT"] = "predict";
    AgentCapability["RECOMMEND"] = "recommend";
    AgentCapability["ACT"] = "act";
    AgentCapability["LEARN"] = "learn";
    AgentCapability["COMMUNICATE"] = "communicate";
    AgentCapability["ANALYZE"] = "analyze";
})(AgentCapability || (AgentCapability = {}));
export const AgentSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    type: z.nativeEnum(AgentType),
    status: z.nativeEnum(AgentStatus).default(AgentStatus.ACTIVE),
    version: z.string().default('1.0'),
    // Capabilities
    capabilities: z.array(z.nativeEnum(AgentCapability)),
    // Configuration
    config: z.object({
        model: z.string().default('gpt-4'),
        temperature: z.number().min(0).max(2).default(0.7),
        maxTokens: z.number().default(1000),
        tools: z.array(z.string()).optional(),
        memoryEnabled: z.boolean().default(true),
        learningEnabled: z.boolean().default(true)
    }),
    // Schedule
    schedule: z.object({
        enabled: z.boolean().default(false),
        cron: z.string().optional(),
        intervalMs: z.number().optional(),
        runOnStartup: z.boolean().default(false)
    }),
    // Stats
    stats: z.object({
        totalRuns: z.number().default(0),
        successfulRuns: z.number().default(0),
        failedRuns: z.number().default(0),
        lastRunAt: z.date().optional(),
        avgExecutionTime: z.number().default(0)
    }),
    // Permissions
    permissions: z.array(z.string()).default([]),
    createdAt: z.date(),
    updatedAt: z.date()
});
export const AgentRunSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    agentId: z.string().uuid(),
    status: z.enum(['pending', 'running', 'completed', 'failed']),
    // Input
    input: z.record(z.any()),
    trigger: z.enum(['manual', 'scheduled', 'event', 'api']),
    // Output
    output: z.record(z.any()).optional(),
    error: z.string().optional(),
    // Execution
    steps: z.array(z.object({
        step: z.string(),
        action: z.string(),
        result: z.any(),
        duration: z.number()
    })).optional(),
    // Metrics
    duration: z.number().optional(),
    tokensUsed: z.number().optional(),
    cost: z.number().optional(),
    startedAt: z.date(),
    completedAt: z.date().optional()
});
export const ToolSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    type: z.enum(['api', 'function', 'workflow', 'external', 'http', 'database']),
    // Schema
    inputSchema: z.record(z.any()),
    outputSchema: z.record(z.any()),
    // Implementation
    endpoint: z.string().optional(),
    handler: z.string().optional(),
    code: z.string().optional(),
    // Config (for http and database types)
    config: z.record(z.any()).optional(),
    // Rate limiting
    timeout: z.number().default(30000),
    retries: z.number().default(3),
    rateLimit: z.number().optional(),
    createdAt: z.date()
});
export const KnowledgeBaseSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    agentId: z.string().uuid(),
    content: z.string(),
    source: z.string(),
    metadata: z.record(z.any()).optional(),
    embedding: z.array(z.number()).optional(),
    createdAt: z.date()
});
export const AgentInsightSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    agentId: z.string().uuid(),
    runId: z.string().uuid(),
    type: z.enum(['prediction', 'recommendation', 'alert', 'anomaly', 'opportunity']),
    severity: z.enum(['info', 'low', 'medium', 'high', 'critical']),
    title: z.string(),
    description: z.string(),
    insight: z.record(z.any()),
    action: z.object({
        type: z.string(),
        params: z.record(z.any()),
        autoExecute: z.boolean().default(false)
    }).optional(),
    status: z.enum(['pending', 'acknowledged', 'actioned', 'dismissed']),
    acknowledgedBy: z.string().optional(),
    acknowledgedAt: z.date().optional(),
    createdAt: z.date()
});
//# sourceMappingURL=index.js.map