import { z } from 'zod';
/**
 * Supported LLM providers
 */
export declare enum LLMProvider {
    CLAUDE = "claude",
    OPENAI = "openai"
}
/**
 * Message role enum
 */
export declare enum MessageRole {
    SYSTEM = "system",
    USER = "user",
    ASSISTANT = "assistant"
}
/**
 * Supported Claude models
 */
export declare enum ClaudeModel {
    CLAUDE_3_5_SONNET = "claude-3-5-sonnet-20240620",
    CLAUDE_3_5_HAIKU = "claude-3-5-haiku-20240307",
    CLAUDE_3_OPUS = "claude-3-opus-20240229",
    CLAUDE_3_SONNET = "claude-3-sonnet-20240229",
    CLAUDE_3_HAIKU = "claude-3-haiku-20240307"
}
/**
 * Supported OpenAI models
 */
export declare enum OpenAIModel {
    GPT_4O = "gpt-4o",
    GPT_4_TURBO = "gpt-4-turbo",
    GPT_4 = "gpt-4",
    GPT_35_TURBO = "gpt-3.5-turbo"
}
/**
 * Task types for model routing
 */
export declare enum TaskType {
    REASONING = "reasoning",// Complex analysis, problem-solving
    CREATIVE = "creative",// Writing, brainstorming
    CLASSIFICATION = "classification",// Categorization, sentiment
    EXTRACTION = "extraction",// Structured data extraction
    SUMMARIZATION = "summarization",// Condensing content
    CONVERSATION = "conversation",// Chat, dialogue
    CODE = "code",// Code generation, review
    DOCUMENT = "document"
}
/**
 * Chat message structure
 */
export interface ChatMessage {
    role: MessageRole;
    content: string;
    name?: string;
}
/**
 * Streaming chunk structure
 */
export interface StreamingChunk {
    type: 'content' | 'done' | 'error';
    content?: string;
    delta?: string;
    usage?: TokenUsage;
    error?: string;
}
/**
 * Token usage tracking
 */
export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cachedTokens?: number;
}
/**
 * LLM request options
 */
export interface LLMRequestOptions {
    messages: ChatMessage[];
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    stopSequences?: string[];
    stream?: boolean;
    timeout?: number;
}
/**
 * LLM response structure
 */
export interface LLMResponse {
    content: string;
    provider: LLMProvider;
    model: string;
    usage: TokenUsage;
    finishReason: string;
    requestId: string;
    latencyMs: number;
    metadata?: Record<string, unknown>;
}
/**
 * Employee role types
 */
export declare enum EmployeeRole {
    SALES = "sales",
    SUPPORT = "support",
    ANALYST = "analyst",
    WRITER = "writer",
    CODER = "coder",
    MANAGER = "manager",
    RECRUITER = "recruiter",
    ACCOUNTANT = "accountant",
    CUSTOM = "custom"
}
/**
 * Employee capability
 */
export interface EmployeeCapability {
    name: string;
    description: string;
    examples?: string[];
    confidence: number;
}
/**
 * Employee knowledge domain
 */
export interface EmployeeKnowledge {
    domain: string;
    topics: string[];
    expertiseLevel: 'beginner' | 'intermediate' | 'expert';
    sources?: string[];
}
/**
 * Employee memory item
 */
export interface EmployeeMemory {
    id: string;
    type: 'interaction' | 'fact' | 'preference' | 'decision';
    content: string;
    importance: number;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}
/**
 * Employee context for prompt building
 */
export interface EmployeeContext {
    id: string;
    tenantId: string;
    name: string;
    role: EmployeeRole;
    capabilities: EmployeeCapability[];
    knowledge: EmployeeKnowledge[];
    recentMemory: EmployeeMemory[];
    preferences: Record<string, unknown>;
    tone?: 'formal' | 'casual' | 'friendly' | 'professional';
    language?: string;
    timezone?: string;
}
/**
 * Model configuration
 */
export interface ModelConfig {
    provider: LLMProvider;
    model: string;
    maxTokens: number;
    temperature: number;
    topP?: number;
    systemPrompt?: string;
    retryAttempts?: number;
    retryDelay?: number;
    timeout?: number;
}
/**
 * Model routing rule
 */
export interface ModelRoutingRule {
    taskType: TaskType;
    primary: {
        provider: LLMProvider;
        model: string;
    };
    fallback?: {
        provider: LLMProvider;
        model: string;
    };
    maxTokens?: number;
    temperature?: number;
}
/**
 * Query analysis request
 */
export interface QueryAnalysisRequest {
    query: string;
    context?: {
        recentConversations?: ChatMessage[];
        relevantFacts?: string[];
        userIntent?: string;
    };
}
/**
 * Query analysis response
 */
export interface QueryAnalysisResponse {
    intent: string;
    entities: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    complexity: 'simple' | 'moderate' | 'complex';
    suggestedTaskType: TaskType;
    confidence: number;
}
/**
 * Document analysis request
 */
export interface DocumentAnalysisRequest {
    content: string;
    documentType: 'email' | 'contract' | 'report' | 'invoice' | 'support_ticket' | 'other';
    extractFields?: string[];
    summaryLength?: 'short' | 'medium' | 'long';
}
/**
 * Document analysis response
 */
export interface DocumentAnalysisResponse {
    summary: string;
    keyPoints: string[];
    extractedData?: Record<string, unknown>;
    sentiment?: 'positive' | 'neutral' | 'negative';
    entities?: {
        people?: string[];
        organizations?: string[];
        dates?: string[];
        amounts?: string[];
    };
    confidence: number;
}
/**
 * Text generation request
 */
export interface TextGenerationRequest {
    prompt: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    stopSequences?: string[];
}
/**
 * Text generation response
 */
export interface TextGenerationResponse {
    text: string;
    usage: TokenUsage;
    finishReason: string;
}
export declare const ChatMessageSchema: z.ZodObject<{
    role: z.ZodNativeEnum<typeof MessageRole>;
    content: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    role: MessageRole;
    name?: string | undefined;
}, {
    content: string;
    role: MessageRole;
    name?: string | undefined;
}>;
export declare const LLMRequestOptionsSchema: z.ZodObject<{
    messages: z.ZodArray<z.ZodObject<{
        role: z.ZodNativeEnum<typeof MessageRole>;
        content: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        content: string;
        role: MessageRole;
        name?: string | undefined;
    }, {
        content: string;
        role: MessageRole;
        name?: string | undefined;
    }>, "many">;
    systemPrompt: z.ZodOptional<z.ZodString>;
    temperature: z.ZodOptional<z.ZodNumber>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    topP: z.ZodOptional<z.ZodNumber>;
    stopSequences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    stream: z.ZodOptional<z.ZodBoolean>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    messages: {
        content: string;
        role: MessageRole;
        name?: string | undefined;
    }[];
    timeout?: number | undefined;
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    systemPrompt?: string | undefined;
    topP?: number | undefined;
    stopSequences?: string[] | undefined;
    stream?: boolean | undefined;
}, {
    messages: {
        content: string;
        role: MessageRole;
        name?: string | undefined;
    }[];
    timeout?: number | undefined;
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    systemPrompt?: string | undefined;
    topP?: number | undefined;
    stopSequences?: string[] | undefined;
    stream?: boolean | undefined;
}>;
export declare const EmployeeContextSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    role: z.ZodNativeEnum<typeof EmployeeRole>;
    capabilities: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        examples: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        confidence: number;
        examples?: string[] | undefined;
    }, {
        name: string;
        description: string;
        confidence: number;
        examples?: string[] | undefined;
    }>, "many">>;
    knowledge: z.ZodOptional<z.ZodArray<z.ZodObject<{
        domain: z.ZodString;
        topics: z.ZodArray<z.ZodString, "many">;
        expertiseLevel: z.ZodEnum<["beginner", "intermediate", "expert"]>;
        sources: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        domain: string;
        topics: string[];
        expertiseLevel: "beginner" | "intermediate" | "expert";
        sources?: string[] | undefined;
    }, {
        domain: string;
        topics: string[];
        expertiseLevel: "beginner" | "intermediate" | "expert";
        sources?: string[] | undefined;
    }>, "many">>;
    recentMemory: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["interaction", "fact", "preference", "decision"]>;
        content: z.ZodString;
        importance: z.ZodNumber;
        timestamp: z.ZodDate;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: "preference" | "fact" | "interaction" | "decision";
        content: string;
        importance: number;
        timestamp: Date;
        metadata?: Record<string, unknown> | undefined;
    }, {
        id: string;
        type: "preference" | "fact" | "interaction" | "decision";
        content: string;
        importance: number;
        timestamp: Date;
        metadata?: Record<string, unknown> | undefined;
    }>, "many">>;
    preferences: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    tone: z.ZodOptional<z.ZodEnum<["formal", "casual", "friendly", "professional"]>>;
    language: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    tenantId: string;
    role: EmployeeRole;
    capabilities?: {
        name: string;
        description: string;
        confidence: number;
        examples?: string[] | undefined;
    }[] | undefined;
    preferences?: Record<string, unknown> | undefined;
    language?: string | undefined;
    knowledge?: {
        domain: string;
        topics: string[];
        expertiseLevel: "beginner" | "intermediate" | "expert";
        sources?: string[] | undefined;
    }[] | undefined;
    timezone?: string | undefined;
    tone?: "professional" | "friendly" | "formal" | "casual" | undefined;
    recentMemory?: {
        id: string;
        type: "preference" | "fact" | "interaction" | "decision";
        content: string;
        importance: number;
        timestamp: Date;
        metadata?: Record<string, unknown> | undefined;
    }[] | undefined;
}, {
    id: string;
    name: string;
    tenantId: string;
    role: EmployeeRole;
    capabilities?: {
        name: string;
        description: string;
        confidence: number;
        examples?: string[] | undefined;
    }[] | undefined;
    preferences?: Record<string, unknown> | undefined;
    language?: string | undefined;
    knowledge?: {
        domain: string;
        topics: string[];
        expertiseLevel: "beginner" | "intermediate" | "expert";
        sources?: string[] | undefined;
    }[] | undefined;
    timezone?: string | undefined;
    tone?: "professional" | "friendly" | "formal" | "casual" | undefined;
    recentMemory?: {
        id: string;
        type: "preference" | "fact" | "interaction" | "decision";
        content: string;
        importance: number;
        timestamp: Date;
        metadata?: Record<string, unknown> | undefined;
    }[] | undefined;
}>;
export declare const ModelConfigSchema: z.ZodObject<{
    provider: z.ZodNativeEnum<typeof LLMProvider>;
    model: z.ZodString;
    maxTokens: z.ZodDefault<z.ZodNumber>;
    temperature: z.ZodDefault<z.ZodNumber>;
    topP: z.ZodOptional<z.ZodNumber>;
    systemPrompt: z.ZodOptional<z.ZodString>;
    retryAttempts: z.ZodDefault<z.ZodNumber>;
    retryDelay: z.ZodDefault<z.ZodNumber>;
    timeout: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    timeout: number;
    provider: LLMProvider;
    model: string;
    temperature: number;
    maxTokens: number;
    retryAttempts: number;
    retryDelay: number;
    systemPrompt?: string | undefined;
    topP?: number | undefined;
}, {
    provider: LLMProvider;
    model: string;
    timeout?: number | undefined;
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    systemPrompt?: string | undefined;
    topP?: number | undefined;
    retryAttempts?: number | undefined;
    retryDelay?: number | undefined;
}>;
export declare const ModelRoutingRuleSchema: z.ZodObject<{
    taskType: z.ZodNativeEnum<typeof TaskType>;
    primary: z.ZodObject<{
        provider: z.ZodNativeEnum<typeof LLMProvider>;
        model: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        provider: LLMProvider;
        model: string;
    }, {
        provider: LLMProvider;
        model: string;
    }>;
    fallback: z.ZodOptional<z.ZodObject<{
        provider: z.ZodNativeEnum<typeof LLMProvider>;
        model: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        provider: LLMProvider;
        model: string;
    }, {
        provider: LLMProvider;
        model: string;
    }>>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    primary: {
        provider: LLMProvider;
        model: string;
    };
    taskType: TaskType;
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    fallback?: {
        provider: LLMProvider;
        model: string;
    } | undefined;
}, {
    primary: {
        provider: LLMProvider;
        model: string;
    };
    taskType: TaskType;
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    fallback?: {
        provider: LLMProvider;
        model: string;
    } | undefined;
}>;
//# sourceMappingURL=index.d.ts.map