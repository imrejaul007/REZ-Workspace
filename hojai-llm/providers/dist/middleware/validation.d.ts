/**
 * HOJAI LLM Providers - Request Validation Schemas
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Zod validation schemas for API requests
 */
import { z } from 'zod';
/**
 * Message role enum
 */
export declare const MessageRoleSchema: z.ZodEnum<["system", "user", "assistant", "function"]>;
/**
 * Function call schema
 */
export declare const FunctionCallSchema: z.ZodObject<{
    name: z.ZodString;
    arguments: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    arguments: string;
}, {
    name: string;
    arguments: string;
}>;
/**
 * Message schema
 */
export declare const MessageSchema: z.ZodObject<{
    role: z.ZodEnum<["system", "user", "assistant", "function"]>;
    content: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    functionCall: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        arguments: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        arguments: string;
    }, {
        name: string;
        arguments: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    role: "function" | "system" | "user" | "assistant";
    content: string;
    name?: string | undefined;
    functionCall?: {
        name: string;
        arguments: string;
    } | undefined;
}, {
    role: "function" | "system" | "user" | "assistant";
    content: string;
    name?: string | undefined;
    functionCall?: {
        name: string;
        arguments: string;
    } | undefined;
}>;
/**
 * Chat request schema
 */
export declare const ChatRequestSchema: z.ZodObject<{
    provider: z.ZodOptional<z.ZodEnum<["openai", "anthropic"]>>;
    messages: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["system", "user", "assistant", "function"]>;
        content: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        functionCall: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            arguments: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            arguments: string;
        }, {
            name: string;
            arguments: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        role: "function" | "system" | "user" | "assistant";
        content: string;
        name?: string | undefined;
        functionCall?: {
            name: string;
            arguments: string;
        } | undefined;
    }, {
        role: "function" | "system" | "user" | "assistant";
        content: string;
        name?: string | undefined;
        functionCall?: {
            name: string;
            arguments: string;
        } | undefined;
    }>, "many">;
    model: z.ZodOptional<z.ZodString>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
    topP: z.ZodOptional<z.ZodNumber>;
    stop: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    frequencyPenalty: z.ZodOptional<z.ZodNumber>;
    presencePenalty: z.ZodOptional<z.ZodNumber>;
    functions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        parameters: z.ZodObject<{
            type: z.ZodLiteral<"object">;
            properties: z.ZodRecord<z.ZodString, z.ZodAny>;
            required: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            type: "object";
            properties: Record<string, any>;
            required?: string[] | undefined;
        }, {
            type: "object";
            properties: Record<string, any>;
            required?: string[] | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        parameters: {
            type: "object";
            properties: Record<string, any>;
            required?: string[] | undefined;
        };
    }, {
        name: string;
        description: string;
        parameters: {
            type: "object";
            properties: Record<string, any>;
            required?: string[] | undefined;
        };
    }>, "many">>;
    functionCall: z.ZodOptional<z.ZodString>;
    taskType: z.ZodOptional<z.ZodEnum<["chat", "analysis", "classification", "embedding", "reasoning", "creative", "code", "summarization", "extraction", "general"]>>;
}, "strip", z.ZodTypeAny, {
    messages: {
        role: "function" | "system" | "user" | "assistant";
        content: string;
        name?: string | undefined;
        functionCall?: {
            name: string;
            arguments: string;
        } | undefined;
    }[];
    stop?: string | string[] | undefined;
    model?: string | undefined;
    maxTokens?: number | undefined;
    temperature?: number | undefined;
    provider?: "openai" | "anthropic" | undefined;
    taskType?: "chat" | "analysis" | "classification" | "embedding" | "reasoning" | "creative" | "code" | "summarization" | "extraction" | "general" | undefined;
    functionCall?: string | undefined;
    topP?: number | undefined;
    frequencyPenalty?: number | undefined;
    presencePenalty?: number | undefined;
    functions?: {
        name: string;
        description: string;
        parameters: {
            type: "object";
            properties: Record<string, any>;
            required?: string[] | undefined;
        };
    }[] | undefined;
}, {
    messages: {
        role: "function" | "system" | "user" | "assistant";
        content: string;
        name?: string | undefined;
        functionCall?: {
            name: string;
            arguments: string;
        } | undefined;
    }[];
    stop?: string | string[] | undefined;
    model?: string | undefined;
    maxTokens?: number | undefined;
    temperature?: number | undefined;
    provider?: "openai" | "anthropic" | undefined;
    taskType?: "chat" | "analysis" | "classification" | "embedding" | "reasoning" | "creative" | "code" | "summarization" | "extraction" | "general" | undefined;
    functionCall?: string | undefined;
    topP?: number | undefined;
    frequencyPenalty?: number | undefined;
    presencePenalty?: number | undefined;
    functions?: {
        name: string;
        description: string;
        parameters: {
            type: "object";
            properties: Record<string, any>;
            required?: string[] | undefined;
        };
    }[] | undefined;
}>;
/**
 * Type inference from schema
 */
export type ChatRequestInput = z.infer<typeof ChatRequestSchema>;
/**
 * Embed request schema (single text)
 */
export declare const EmbedSingleRequestSchema: z.ZodObject<{
    provider: z.ZodOptional<z.ZodEnum<["openai", "anthropic"]>>;
    text: z.ZodString;
    model: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string;
    model?: string | undefined;
    provider?: "openai" | "anthropic" | undefined;
}, {
    text: string;
    model?: string | undefined;
    provider?: "openai" | "anthropic" | undefined;
}>;
/**
 * Embed request schema (batch)
 */
export declare const EmbedBatchRequestSchema: z.ZodObject<{
    provider: z.ZodOptional<z.ZodEnum<["openai", "anthropic"]>>;
    text: z.ZodArray<z.ZodString, "many">;
    model: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string[];
    model?: string | undefined;
    provider?: "openai" | "anthropic" | undefined;
}, {
    text: string[];
    model?: string | undefined;
    provider?: "openai" | "anthropic" | undefined;
}>;
/**
 * Unified embed request schema
 */
export declare const EmbedRequestSchema: z.ZodUnion<[z.ZodObject<{
    provider: z.ZodOptional<z.ZodEnum<["openai", "anthropic"]>>;
    text: z.ZodString;
    model: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string;
    model?: string | undefined;
    provider?: "openai" | "anthropic" | undefined;
}, {
    text: string;
    model?: string | undefined;
    provider?: "openai" | "anthropic" | undefined;
}>, z.ZodObject<{
    provider: z.ZodOptional<z.ZodEnum<["openai", "anthropic"]>>;
    text: z.ZodArray<z.ZodString, "many">;
    model: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string[];
    model?: string | undefined;
    provider?: "openai" | "anthropic" | undefined;
}, {
    text: string[];
    model?: string | undefined;
    provider?: "openai" | "anthropic" | undefined;
}>]>;
/**
 * Type inference from schema
 */
export type EmbedRequestInput = z.infer<typeof EmbedRequestSchema>;
/**
 * Classify request schema
 */
export declare const ClassifyRequestSchema: z.ZodObject<{
    provider: z.ZodOptional<z.ZodEnum<["openai", "anthropic"]>>;
    text: z.ZodString;
    labels: z.ZodArray<z.ZodString, "many">;
    temperature: z.ZodOptional<z.ZodNumber>;
    model: z.ZodOptional<z.ZodString>;
    instruction: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string;
    labels: string[];
    model?: string | undefined;
    temperature?: number | undefined;
    provider?: "openai" | "anthropic" | undefined;
    instruction?: string | undefined;
}, {
    text: string;
    labels: string[];
    model?: string | undefined;
    temperature?: number | undefined;
    provider?: "openai" | "anthropic" | undefined;
    instruction?: string | undefined;
}>;
/**
 * Type inference from schema
 */
export type ClassifyRequestInput = z.infer<typeof ClassifyRequestSchema>;
/**
 * Validate request body against a schema
 */
export declare function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: true;
    data: T;
} | {
    success: false;
    error: z.ZodError;
};
/**
 * Format Zod error into a user-friendly message
 */
export declare function formatZodError(error: z.ZodError): string;
//# sourceMappingURL=validation.d.ts.map