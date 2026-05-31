import { z } from 'zod';
// ============================================================================
// LLM REQUEST/RESPONSE TYPES
// ============================================================================
/**
 * Supported LLM providers
 */
export var LLMProvider;
(function (LLMProvider) {
    LLMProvider["CLAUDE"] = "claude";
    LLMProvider["OPENAI"] = "openai";
})(LLMProvider || (LLMProvider = {}));
/**
 * Message role enum
 */
export var MessageRole;
(function (MessageRole) {
    MessageRole["SYSTEM"] = "system";
    MessageRole["USER"] = "user";
    MessageRole["ASSISTANT"] = "assistant";
})(MessageRole || (MessageRole = {}));
/**
 * Supported Claude models
 */
export var ClaudeModel;
(function (ClaudeModel) {
    ClaudeModel["CLAUDE_3_5_SONNET"] = "claude-3-5-sonnet-20240620";
    ClaudeModel["CLAUDE_3_5_HAIKU"] = "claude-3-5-haiku-20240307";
    ClaudeModel["CLAUDE_3_OPUS"] = "claude-3-opus-20240229";
    ClaudeModel["CLAUDE_3_SONNET"] = "claude-3-sonnet-20240229";
    ClaudeModel["CLAUDE_3_HAIKU"] = "claude-3-haiku-20240307";
})(ClaudeModel || (ClaudeModel = {}));
/**
 * Supported OpenAI models
 */
export var OpenAIModel;
(function (OpenAIModel) {
    OpenAIModel["GPT_4O"] = "gpt-4o";
    OpenAIModel["GPT_4_TURBO"] = "gpt-4-turbo";
    OpenAIModel["GPT_4"] = "gpt-4";
    OpenAIModel["GPT_35_TURBO"] = "gpt-3.5-turbo";
})(OpenAIModel || (OpenAIModel = {}));
/**
 * Task types for model routing
 */
export var TaskType;
(function (TaskType) {
    TaskType["REASONING"] = "reasoning";
    TaskType["CREATIVE"] = "creative";
    TaskType["CLASSIFICATION"] = "classification";
    TaskType["EXTRACTION"] = "extraction";
    TaskType["SUMMARIZATION"] = "summarization";
    TaskType["CONVERSATION"] = "conversation";
    TaskType["CODE"] = "code";
    TaskType["DOCUMENT"] = "document"; // Document understanding
})(TaskType || (TaskType = {}));
// ============================================================================
// EMPLOYEE CONTEXT TYPES
// ============================================================================
/**
 * Employee role types
 */
export var EmployeeRole;
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
})(EmployeeRole || (EmployeeRole = {}));
// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================
export const ChatMessageSchema = z.object({
    role: z.nativeEnum(MessageRole),
    content: z.string().min(0),
    name: z.string().optional()
});
export const LLMRequestOptionsSchema = z.object({
    messages: z.array(ChatMessageSchema).min(1),
    systemPrompt: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().positive().optional(),
    topP: z.number().min(0).max(1).optional(),
    stopSequences: z.array(z.string()).optional(),
    stream: z.boolean().optional(),
    timeout: z.number().positive().optional()
});
export const EmployeeContextSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    name: z.string().min(1).max(100),
    role: z.nativeEnum(EmployeeRole),
    capabilities: z.array(z.object({
        name: z.string(),
        description: z.string(),
        examples: z.array(z.string()).optional(),
        confidence: z.number().min(0).max(1)
    })).optional(),
    knowledge: z.array(z.object({
        domain: z.string(),
        topics: z.array(z.string()),
        expertiseLevel: z.enum(['beginner', 'intermediate', 'expert']),
        sources: z.array(z.string()).optional()
    })).optional(),
    recentMemory: z.array(z.object({
        id: z.string(),
        type: z.enum(['interaction', 'fact', 'preference', 'decision']),
        content: z.string(),
        importance: z.number().min(0).max(1),
        timestamp: z.date(),
        metadata: z.record(z.unknown()).optional()
    })).optional(),
    preferences: z.record(z.unknown()).optional(),
    tone: z.enum(['formal', 'casual', 'friendly', 'professional']).optional(),
    language: z.string().optional(),
    timezone: z.string().optional()
});
export const ModelConfigSchema = z.object({
    provider: z.nativeEnum(LLMProvider),
    model: z.string().min(1),
    maxTokens: z.number().positive().default(4096),
    temperature: z.number().min(0).max(2).default(0.7),
    topP: z.number().min(0).max(1).optional(),
    systemPrompt: z.string().optional(),
    retryAttempts: z.number().int().nonnegative().default(3),
    retryDelay: z.number().nonnegative().default(1000),
    timeout: z.number().positive().default(60000)
});
export const ModelRoutingRuleSchema = z.object({
    taskType: z.nativeEnum(TaskType),
    primary: z.object({
        provider: z.nativeEnum(LLMProvider),
        model: z.string()
    }),
    fallback: z.object({
        provider: z.nativeEnum(LLMProvider),
        model: z.string()
    }).optional(),
    maxTokens: z.number().positive().optional(),
    temperature: z.number().min(0).max(2).optional()
});
//# sourceMappingURL=index.js.map