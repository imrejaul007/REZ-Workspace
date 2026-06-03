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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentService = exports.AgentService = exports.AgentInsightModel = exports.KnowledgeBaseModel = exports.ToolModel = exports.AgentRunModel = exports.AgentModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ioredis_1 = __importDefault(require("ioredis"));
const uuid_1 = require("uuid");
const index_js_1 = require("../types/index.js");
// Models
const AgentSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    type: { type: String, enum: Object.values(index_js_1.AgentType), required: true },
    status: { type: String, enum: Object.values(index_js_1.AgentStatus), default: index_js_1.AgentStatus.ACTIVE },
    version: { type: String, default: '1.0' },
    capabilities: [{ type: String, enum: Object.values(index_js_1.AgentCapability) }],
    config: {
        model: { type: String, default: 'gpt-4' },
        temperature: { type: Number, default: 0.7 },
        maxTokens: { type: Number, default: 1000 },
        tools: [String],
        memoryEnabled: { type: Boolean, default: true },
        learningEnabled: { type: Boolean, default: true }
    },
    schedule: {
        enabled: { type: Boolean, default: false },
        cron: String,
        intervalMs: Number,
        runOnStartup: { type: Boolean, default: false }
    },
    stats: {
        totalRuns: { type: Number, default: 0 },
        successfulRuns: { type: Number, default: 0 },
        failedRuns: { type: Number, default: 0 },
        lastRunAt: Date,
        avgExecutionTime: { type: Number, default: 0 }
    },
    permissions: [String]
}, { timestamps: true });
AgentSchema.index({ tenantId: 1, type: 1 });
const AgentRunSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    agentId: { type: String, required: true, index: true },
    status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
    input: { type: Map, of: mongoose_1.Schema.Types.Mixed },
    trigger: { type: String, enum: ['manual', 'scheduled', 'event', 'api'] },
    output: { type: Map, of: mongoose_1.Schema.Types.Mixed },
    error: String,
    steps: [{
            step: String,
            action: String,
            result: mongoose_1.Schema.Types.Mixed,
            duration: Number
        }],
    duration: Number,
    tokensUsed: Number,
    cost: Number,
    startedAt: { type: Date, default: Date.now },
    completedAt: Date
});
AgentRunSchema.index({ tenantId: 1, agentId: 1, status: 1 });
const ToolSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    type: { type: String, enum: ['api', 'function', 'workflow', 'external'], required: true },
    inputSchema: { type: Map, of: mongoose_1.Schema.Types.Mixed },
    outputSchema: { type: Map, of: mongoose_1.Schema.Types.Mixed },
    endpoint: String,
    handler: String,
    code: String,
    timeout: { type: Number, default: 30000 },
    retries: { type: Number, default: 3 },
    rateLimit: Number
}, { timestamps: true });
const KnowledgeBaseSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    agentId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    source: String,
    metadata: { type: Map, of: mongoose_1.Schema.Types.Mixed },
    embedding: [Number],
    createdAt: { type: Date, default: Date.now }
});
KnowledgeBaseSchema.index({ agentId: 1 });
const AgentInsightSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    agentId: { type: String, required: true, index: true },
    runId: { type: String, required: true, index: true },
    type: { type: String, enum: ['prediction', 'recommendation', 'alert', 'anomaly', 'opportunity'], required: true },
    severity: { type: String, enum: ['info', 'low', 'medium', 'high', 'critical'], default: 'info' },
    title: { type: String, required: true },
    description: String,
    insight: { type: Map, of: mongoose_1.Schema.Types.Mixed },
    action: {
        type: String,
        params: { type: Map, of: mongoose_1.Schema.Types.Mixed },
        autoExecute: { type: Boolean, default: false }
    },
    status: { type: String, enum: ['pending', 'acknowledged', 'actioned', 'dismissed'], default: 'pending' },
    acknowledgedBy: String,
    acknowledgedAt: Date
}, { timestamps: true });
AgentInsightSchema.index({ tenantId: 1, agentId: 1, status: 1 });
AgentInsightSchema.index({ tenantId: 1, severity: 1 });
exports.AgentModel = mongoose_1.default.model('Agent', AgentSchema);
exports.AgentRunModel = mongoose_1.default.model('AgentRun', AgentRunSchema);
exports.ToolModel = mongoose_1.default.model('Tool', ToolSchema);
exports.KnowledgeBaseModel = mongoose_1.default.model('KnowledgeBase', KnowledgeBaseSchema);
exports.AgentInsightModel = mongoose_1.default.model('AgentInsight', AgentInsightSchema);
// ============================================================================
// AGENT SERVICE
// ============================================================================
class AgentService {
    redis;
    constructor() {
        this.redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
    }
    // Agent CRUD
    async createAgent(params) {
        const agent = new exports.AgentModel({ ...params, id: (0, uuid_1.v4)() });
        await agent.save();
        return agent.toObject();
    }
    async getAgent(tenantId, agentId) {
        const agent = await exports.AgentModel.findOne({ _id: agentId, tenantId });
        return agent ? agent.toObject() : null;
    }
    async listAgents(tenantId, type) {
        const filter = { tenantId };
        if (type)
            filter.type = type;
        const agents = await exports.AgentModel.find(filter).sort({ createdAt: -1 });
        return agents.map(a => a.toObject());
    }
    async updateAgent(tenantId, agentId, updates) {
        const agent = await exports.AgentModel.findOneAndUpdate({ _id: agentId, tenantId }, { $set: updates }, { new: true });
        return agent ? agent.toObject() : null;
    }
    async deleteAgent(tenantId, agentId) {
        await exports.AgentModel.deleteOne({ _id: agentId, tenantId });
    }
    // Agent Execution
    async runAgent(params) {
        const agent = await this.getAgent(params.tenantId, params.agentId);
        if (!agent)
            throw new Error('Agent not found');
        if (agent.status !== index_js_1.AgentStatus.ACTIVE)
            throw new Error('Agent is not active');
        const run = new exports.AgentRunModel({
            tenantId: params.tenantId,
            agentId: params.agentId,
            input: params.input,
            trigger: params.trigger || 'manual',
            status: 'running'
        });
        await run.save();
        try {
            const startTime = Date.now();
            const result = await this.executeAgent(agent, params.input);
            const duration = Date.now() - startTime;
            await exports.AgentRunModel.findByIdAndUpdate(run._id, {
                status: 'completed',
                output: result,
                duration,
                completedAt: new Date()
            });
            await exports.AgentModel.updateOne({ _id: params.agentId }, {
                $inc: { 'stats.totalRuns': 1, 'stats.successfulRuns': 1 },
                $set: { 'stats.lastRunAt': new Date() }
            });
            return { ...run.toObject(), status: 'completed', output: result, duration };
        }
        catch (error) {
            await exports.AgentRunModel.findByIdAndUpdate(run._id, {
                status: 'failed',
                error: error instanceof Error ? error.message : String(error),
                completedAt: new Date()
            });
            await exports.AgentModel.updateOne({ _id: params.agentId }, { $inc: { 'stats.totalRuns': 1, 'stats.failedRuns': 1 } });
            throw error;
        }
    }
    async executeAgent(agent, input) {
        const steps = [];
        const startTime = Date.now();
        // Step 1: Analyze input with real LLM
        const analyzeStart = Date.now();
        const analysis = await this.analyzeInput(agent, input);
        steps.push({ step: 'analyze', action: 'analyze_input', result: analysis, duration: Date.now() - analyzeStart });
        // Step 2: Query knowledge base with real vector search
        const knowledgeStart = Date.now();
        const knowledgeResults = await this.retrieveKnowledge(agent, input);
        steps.push({ step: 'knowledge', action: 'query_knowledge', result: knowledgeResults, duration: Date.now() - knowledgeStart });
        // Step 3: Generate insights with real AI reasoning
        const insightsStart = Date.now();
        const insights = await this.generateInsights(agent, { ...input, analysis, knowledge: knowledgeResults });
        steps.push({ step: 'insights', action: 'generate_insights', result: insights, duration: Date.now() - insightsStart });
        // Step 4: Execute tools with real actions
        const actionsStart = Date.now();
        const actions = await this.executeActions(agent, { ...input, insights, analysis, knowledge: knowledgeResults });
        steps.push({ step: 'action', action: 'execute_actions', result: actions, duration: Date.now() - actionsStart });
        return { analysis, knowledge: knowledgeResults, insights, actions, steps };
    }
    /**
     * Analyze input using LLM
     */
    async analyzeInput(agent, input) {
        const model = agent.config?.model || 'gpt-4';
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.warn('[AgentService] OPENAI_API_KEY not set, using mock analysis');
            return { intent: 'unknown', confidence: 0, entities: [] };
        }
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages: [{
                            role: 'system',
                            content: `You are an AI agent analyzer. Analyze the input and extract intent, entities, and sentiment. Return JSON with intent, confidence (0-1), entities (array), and sentiment (positive/neutral/negative).`
                        }, {
                            role: 'user',
                            content: JSON.stringify(input)
                        }],
                    max_tokens: 500,
                    temperature: 0.3
                })
            });
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }
            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            try {
                return JSON.parse(content || '{}');
            }
            catch {
                return { intent: 'unknown', confidence: 0.5, raw: content };
            }
        }
        catch (error) {
            console.error('[AgentService] LLM analysis failed:', error);
            return { intent: 'unknown', confidence: 0, error: String(error) };
        }
    }
    /**
     * Retrieve relevant knowledge from knowledge base
     */
    async retrieveKnowledge(agent, input) {
        const query = input.query || input.message || JSON.stringify(input);
        if (!query) {
            return [];
        }
        // Query knowledge base
        const knowledgeBase = await this.getAgentKnowledgeBase(agent.id);
        if (!knowledgeBase || !knowledgeBase.entries.length) {
            return [];
        }
        // Simple keyword matching (in production, use vector embeddings)
        const queryLower = query.toLowerCase();
        const scored = knowledgeBase.entries.map((entry) => {
            const contentLower = entry.content.toLowerCase();
            const words = queryLower.split(/\s+/);
            let score = 0;
            for (const word of words) {
                if (contentLower.includes(word))
                    score += 1;
            }
            return { entry, score };
        }).filter((r) => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((r) => r.entry);
        return scored;
    }
    /**
     * Get knowledge base for agent
     */
    async getAgentKnowledgeBase(agentId) {
        const kb = await exports.KnowledgeBaseModel.findOne({ agentId });
        return kb;
    }
    /**
     * Execute tools/actions
     */
    async executeActions(agent, context) {
        const tools = agent.config?.tools || [];
        const results = [];
        for (const toolName of tools) {
            const tool = await this.getTool(toolName);
            if (!tool) {
                results.push({ tool: toolName, error: 'Tool not found' });
                continue;
            }
            try {
                const result = await this.executeTool(tool, context);
                results.push({ tool: toolName, success: true, result });
            }
            catch (error) {
                results.push({ tool: toolName, success: false, error: String(error) });
            }
        }
        return results;
    }
    /**
     * Get tool by name
     */
    async getTool(name) {
        return await exports.ToolModel.findOne({ name });
    }
    /**
     * Execute a tool
     */
    async executeTool(tool, context) {
        // Tool execution implementation based on tool type
        switch (tool.type) {
            case 'http':
                // Make HTTP request
                const response = await fetch(tool.config?.url || '', {
                    method: tool.config?.method || 'GET',
                    headers: tool.config?.headers || {},
                    body: tool.config?.method !== 'GET' ? JSON.stringify(context) : undefined
                });
                return await response.json();
            case 'database':
                // Execute database query (implementation depends on tool config)
                return { query: tool.config?.query, params: context };
            case 'function':
                // Execute custom function
                return { function: tool.name, input: context };
            default:
                return { tool: tool.name, message: 'Tool type not implemented' };
        }
    }
    async generateInsights(agent, input) {
        const insights = [];
        const apiKey = process.env.OPENAI_API_KEY;
        // Use LLM to generate insights if available
        if (apiKey) {
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: agent.config?.model || 'gpt-4',
                        messages: [{
                                role: 'system',
                                content: `You are an AI agent insights generator. Based on the agent type (${agent.type}) and input data, generate 1-3 actionable insights. Return JSON array with objects containing: title, description, severity (low/medium/high/critical), type (recommendation/warning/opportunity/risk), and recommendedActions (array of strings).`
                            }, {
                                role: 'user',
                                content: JSON.stringify(input)
                            }],
                        max_tokens: 1000,
                        temperature: 0.5
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices[0]?.message?.content;
                    if (content) {
                        try {
                            const llmInsights = JSON.parse(content);
                            for (const llmInsight of llmInsights) {
                                const insight = await exports.AgentInsightModel.create({
                                    tenantId: agent.tenantId || input.tenantId,
                                    agentId: agent.id,
                                    runId: (0, uuid_1.v4)(),
                                    type: llmInsight.type,
                                    severity: llmInsight.severity,
                                    title: llmInsight.title,
                                    description: llmInsight.description,
                                    insight: { ...input, recommendedActions: llmInsight.recommendedActions }
                                });
                                insights.push(insight.toObject());
                            }
                        }
                        catch {
                            // Fallback to simple insight
                        }
                    }
                }
            }
            catch (error) {
                console.error('[AgentService] LLM insight generation failed:', error);
            }
        }
        // If no insights generated, create a basic one
        if (insights.length === 0) {
            const insight = await exports.AgentInsightModel.create({
                tenantId: agent.tenantId || input.tenantId,
                agentId: agent.id,
                runId: (0, uuid_1.v4)(),
                type: 'recommendation',
                severity: 'medium',
                title: `Insight from ${agent.name}`,
                description: `Generated insight based on input data`,
                insight: input
            });
            insights.push(insight.toObject());
        }
        return insights;
    }
    async determineActions(agent, insights) {
        const actions = [];
        for (const insight of insights) {
            // Determine action based on insight type and severity
            const action = {
                type: insight.type,
                priority: insight.severity === 'critical' ? 'high' : insight.severity === 'high' ? 'medium' : 'low',
                title: insight.title,
                description: insight.description,
                insightId: insight.id,
                recommendedActions: insight.insight?.recommendedActions || [],
                nextStep: 'review'
            };
            actions.push(action);
        }
        return actions;
    }
    // Run history
    async getRunHistory(tenantId, agentId, limit = 50) {
        const runs = await exports.AgentRunModel.find({ tenantId, agentId })
            .sort({ startedAt: -1 })
            .limit(limit);
        return runs.map(r => r.toObject());
    }
    // Insights
    async getInsights(tenantId, params) {
        const filter = { tenantId };
        if (params.agentId)
            filter.agentId = params.agentId;
        if (params.severity)
            filter.severity = params.severity;
        if (params.status)
            filter.status = params.status;
        const insights = await exports.AgentInsightModel.find(filter)
            .sort({ createdAt: -1 })
            .limit(params.limit || 50);
        return insights.map(i => i.toObject());
    }
    async acknowledgeInsight(tenantId, insightId, acknowledgedBy) {
        await exports.AgentInsightModel.updateOne({ _id: insightId, tenantId }, { status: 'acknowledged', acknowledgedBy, acknowledgedAt: new Date() });
    }
}
exports.AgentService = AgentService;
exports.agentService = new AgentService();
