"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelRoutingRuleSchema = exports.ModelConfigSchema = exports.EmployeeContextSchema = exports.LLMRequestOptionsSchema = exports.ChatMessageSchema = exports.EmployeeRole = exports.TaskType = exports.OpenAIModel = exports.ClaudeModel = exports.MessageRole = exports.LLMProvider = void 0;
const zod_1 = require("zod");
// ============================================================================
// LLM REQUEST/RESPONSE TYPES
// ============================================================================
/**
 * Supported LLM providers
 */
var LLMProvider;
(function (LLMProvider) {
    LLMProvider["CLAUDE"] = "claude";
    LLMProvider["OPENAI"] = "openai";
})(LLMProvider || (exports.LLMProvider = LLMProvider = {}));
/**
 * Message role enum
 */
var MessageRole;
(function (MessageRole) {
    MessageRole["SYSTEM"] = "system";
    MessageRole["USER"] = "user";
    MessageRole["ASSISTANT"] = "assistant";
})(MessageRole || (exports.MessageRole = MessageRole = {}));
/**
 * Supported Claude models
 */
var ClaudeModel;
(function (ClaudeModel) {
    ClaudeModel["CLAUDE_3_5_SONNET"] = "claude-3-5-sonnet-20240620";
    ClaudeModel["CLAUDE_3_5_HAIKU"] = "claude-3-5-haiku-20240307";
    ClaudeModel["CLAUDE_3_OPUS"] = "claude-3-opus-20240229";
    ClaudeModel["CLAUDE_3_SONNET"] = "claude-3-sonnet-20240229";
    ClaudeModel["CLAUDE_3_HAIKU"] = "claude-3-haiku-20240307";
})(ClaudeModel || (exports.ClaudeModel = ClaudeModel = {}));
/**
 * Supported OpenAI models
 */
var OpenAIModel;
(function (OpenAIModel) {
    OpenAIModel["GPT_4O"] = "gpt-4o";
    OpenAIModel["GPT_4_TURBO"] = "gpt-4-turbo";
    OpenAIModel["GPT_4"] = "gpt-4";
    OpenAIModel["GPT_35_TURBO"] = "gpt-3.5-turbo";
})(OpenAIModel || (exports.OpenAIModel = OpenAIModel = {}));
/**
 * Task types for model routing
 */
var TaskType;
(function (TaskType) {
    TaskType["REASONING"] = "reasoning";
    TaskType["CREATIVE"] = "creative";
    TaskType["CLASSIFICATION"] = "classification";
    TaskType["EXTRACTION"] = "extraction";
    TaskType["SUMMARIZATION"] = "summarization";
    TaskType["CONVERSATION"] = "conversation";
    TaskType["CODE"] = "code";
    TaskType["DOCUMENT"] = "document"; // Document understanding
})(TaskType || (exports.TaskType = TaskType = {}));
// ============================================================================
// EMPLOYEE CONTEXT TYPES
// ============================================================================
/**
 * Employee role types
 */
var EmployeeRole;
(function (EmployeeRole) {
    EmployeeRole["SALES"] = "sales";
    EmployeeRole["SUPPORT"] = "support";
    EmployeeRole["ANALYST"] = "analyst";
    EmployeeRole["WRITER"] = "writer";
    EmployeeRole["CODER"] = "coder";
    EmployeeRole["MANAGER"] = "manager";
    EmployeeRole["RECRUITER"] = "recruiter";
    EmployeeRole["ACCOUNTANT"] = "accountant";
    EmployeeRole["CUSTOM"] = "custom";
})(EmployeeRole || (exports.EmployeeRole = EmployeeRole = {}));
// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================
exports.ChatMessageSchema = zod_1.z.object({
    role: zod_1.z.nativeEnum(MessageRole),
    content: zod_1.z.string().min(0),
    name: zod_1.z.string().optional()
});
exports.LLMRequestOptionsSchema = zod_1.z.object({
    messages: zod_1.z.array(exports.ChatMessageSchema).min(1),
    systemPrompt: zod_1.z.string().optional(),
    temperature: zod_1.z.number().min(0).max(2).optional(),
    maxTokens: zod_1.z.number().positive().optional(),
    topP: zod_1.z.number().min(0).max(1).optional(),
    stopSequences: zod_1.z.array(zod_1.z.string()).optional(),
    stream: zod_1.z.boolean().optional(),
    timeout: zod_1.z.number().positive().optional()
});
exports.EmployeeContextSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(100),
    role: zod_1.z.nativeEnum(EmployeeRole),
    capabilities: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        description: zod_1.z.string(),
        examples: zod_1.z.array(zod_1.z.string()).optional(),
        confidence: zod_1.z.number().min(0).max(1)
    })).optional(),
    knowledge: zod_1.z.array(zod_1.z.object({
        domain: zod_1.z.string(),
        topics: zod_1.z.array(zod_1.z.string()),
        expertiseLevel: zod_1.z.enum(['beginner', 'intermediate', 'expert']),
        sources: zod_1.z.array(zod_1.z.string()).optional()
    })).optional(),
    recentMemory: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        type: zod_1.z.enum(['interaction', 'fact', 'preference', 'decision']),
        content: zod_1.z.string(),
        importance: zod_1.z.number().min(0).max(1),
        timestamp: zod_1.z.date(),
        metadata: zod_1.z.record(zod_1.z.unknown()).optional()
    })).optional(),
    preferences: zod_1.z.record(zod_1.z.unknown()).optional(),
    tone: zod_1.z.enum(['formal', 'casual', 'friendly', 'professional']).optional(),
    language: zod_1.z.string().optional(),
    timezone: zod_1.z.string().optional()
});
exports.ModelConfigSchema = zod_1.z.object({
    provider: zod_1.z.nativeEnum(LLMProvider),
    model: zod_1.z.string().min(1),
    maxTokens: zod_1.z.number().positive().default(4096),
    temperature: zod_1.z.number().min(0).max(2).default(0.7),
    topP: zod_1.z.number().min(0).max(1).optional(),
    systemPrompt: zod_1.z.string().optional(),
    retryAttempts: zod_1.z.number().int().nonnegative().default(3),
    retryDelay: zod_1.z.number().nonnegative().default(1000),
    timeout: zod_1.z.number().positive().default(60000)
});
exports.ModelRoutingRuleSchema = zod_1.z.object({
    taskType: zod_1.z.nativeEnum(TaskType),
    primary: zod_1.z.object({
        provider: zod_1.z.nativeEnum(LLMProvider),
        model: zod_1.z.string()
    }),
    fallback: zod_1.z.object({
        provider: zod_1.z.nativeEnum(LLMProvider),
        model: zod_1.z.string()
    }).optional(),
    maxTokens: zod_1.z.number().positive().optional(),
    temperature: zod_1.z.number().min(0).max(2).optional()
});
//# sourceMappingURL=index.js.map