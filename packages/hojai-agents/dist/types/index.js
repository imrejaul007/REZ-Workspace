"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentInsightSchema = exports.KnowledgeBaseSchema = exports.ToolSchema = exports.AgentRunSchema = exports.AgentSchema = exports.AgentCapability = exports.AgentStatus = exports.AgentType = void 0;
const zod_1 = require("zod");
var AgentType;
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
})(AgentType || (exports.AgentType = AgentType = {}));
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ACTIVE"] = "active";
    AgentStatus["PAUSED"] = "paused";
    AgentStatus["TRAINING"] = "training";
    AgentStatus["ERROR"] = "error";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
var AgentCapability;
(function (AgentCapability) {
    AgentCapability["PREDICT"] = "predict";
    AgentCapability["RECOMMEND"] = "recommend";
    AgentCapability["ACT"] = "act";
    AgentCapability["LEARN"] = "learn";
    AgentCapability["COMMUNICATE"] = "communicate";
    AgentCapability["ANALYZE"] = "analyze";
})(AgentCapability || (exports.AgentCapability = AgentCapability = {}));
exports.AgentSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    type: zod_1.z.nativeEnum(AgentType),
    status: zod_1.z.nativeEnum(AgentStatus).default(AgentStatus.ACTIVE),
    version: zod_1.z.string().default('1.0'),
    // Capabilities
    capabilities: zod_1.z.array(zod_1.z.nativeEnum(AgentCapability)),
    // Configuration
    config: zod_1.z.object({
        model: zod_1.z.string().default('gpt-4'),
        temperature: zod_1.z.number().min(0).max(2).default(0.7),
        maxTokens: zod_1.z.number().default(1000),
        tools: zod_1.z.array(zod_1.z.string()).optional(),
        memoryEnabled: zod_1.z.boolean().default(true),
        learningEnabled: zod_1.z.boolean().default(true)
    }),
    // Schedule
    schedule: zod_1.z.object({
        enabled: zod_1.z.boolean().default(false),
        cron: zod_1.z.string().optional(),
        intervalMs: zod_1.z.number().optional(),
        runOnStartup: zod_1.z.boolean().default(false)
    }),
    // Stats
    stats: zod_1.z.object({
        totalRuns: zod_1.z.number().default(0),
        successfulRuns: zod_1.z.number().default(0),
        failedRuns: zod_1.z.number().default(0),
        lastRunAt: zod_1.z.date().optional(),
        avgExecutionTime: zod_1.z.number().default(0)
    }),
    // Permissions
    permissions: zod_1.z.array(zod_1.z.string()).default([]),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.AgentRunSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    agentId: zod_1.z.string().uuid(),
    status: zod_1.z.enum(['pending', 'running', 'completed', 'failed']),
    // Input
    input: zod_1.z.record(zod_1.z.any()),
    trigger: zod_1.z.enum(['manual', 'scheduled', 'event', 'api']),
    // Output
    output: zod_1.z.record(zod_1.z.any()).optional(),
    error: zod_1.z.string().optional(),
    // Execution
    steps: zod_1.z.array(zod_1.z.object({
        step: zod_1.z.string(),
        action: zod_1.z.string(),
        result: zod_1.z.any(),
        duration: zod_1.z.number()
    })).optional(),
    // Metrics
    duration: zod_1.z.number().optional(),
    tokensUsed: zod_1.z.number().optional(),
    cost: zod_1.z.number().optional(),
    startedAt: zod_1.z.date(),
    completedAt: zod_1.z.date().optional()
});
exports.ToolSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    type: zod_1.z.enum(['api', 'function', 'workflow', 'external']),
    // Schema
    inputSchema: zod_1.z.record(zod_1.z.any()),
    outputSchema: zod_1.z.record(zod_1.z.any()),
    // Implementation
    endpoint: zod_1.z.string().optional(),
    handler: zod_1.z.string().optional(),
    code: zod_1.z.string().optional(),
    // Config
    timeout: zod_1.z.number().default(30000),
    retries: zod_1.z.number().default(3),
    rateLimit: zod_1.z.number().optional(),
    createdAt: zod_1.z.date()
});
exports.KnowledgeBaseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    agentId: zod_1.z.string().uuid(),
    content: zod_1.z.string(),
    source: zod_1.z.string(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    embedding: zod_1.z.array(zod_1.z.number()).optional(),
    createdAt: zod_1.z.date()
});
exports.AgentInsightSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    agentId: zod_1.z.string().uuid(),
    runId: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['prediction', 'recommendation', 'alert', 'anomaly', 'opportunity']),
    severity: zod_1.z.enum(['info', 'low', 'medium', 'high', 'critical']),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    insight: zod_1.z.record(zod_1.z.any()),
    action: zod_1.z.object({
        type: zod_1.z.string(),
        params: zod_1.z.record(zod_1.z.any()),
        autoExecute: zod_1.z.boolean().default(false)
    }).optional(),
    status: zod_1.z.enum(['pending', 'acknowledged', 'actioned', 'dismissed']),
    acknowledgedBy: zod_1.z.string().optional(),
    acknowledgedAt: zod_1.z.date().optional(),
    createdAt: zod_1.z.date()
});
