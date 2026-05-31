/**
 * Hojai Model Router Validators (Zod Schemas)
 */
import { z } from 'zod';
export declare const taskTypeSchema: z.ZodEnum<["chat", "embed", "classify", "complete"]>;
export declare const routeOptionsSchema: z.ZodObject<{
    maxTokens: z.ZodOptional<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    maxTokens?: number | undefined;
    temperature?: number | undefined;
}, {
    maxTokens?: number | undefined;
    temperature?: number | undefined;
}>;
export declare const routeRequestSchema: z.ZodObject<{
    task: z.ZodEnum<["chat", "embed", "classify", "complete"]>;
    input: z.ZodString;
    options: z.ZodOptional<z.ZodObject<{
        maxTokens: z.ZodOptional<z.ZodNumber>;
        temperature: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxTokens?: number | undefined;
        temperature?: number | undefined;
    }, {
        maxTokens?: number | undefined;
        temperature?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    task: "chat" | "embed" | "classify" | "complete";
    input: string;
    options?: {
        maxTokens?: number | undefined;
        temperature?: number | undefined;
    } | undefined;
}, {
    task: "chat" | "embed" | "classify" | "complete";
    input: string;
    options?: {
        maxTokens?: number | undefined;
        temperature?: number | undefined;
    } | undefined;
}>;
export declare const fallbackRequestSchema: z.ZodObject<{
    originalRequest: z.ZodObject<{
        task: z.ZodEnum<["chat", "embed", "classify", "complete"]>;
        input: z.ZodString;
        options: z.ZodOptional<z.ZodObject<{
            maxTokens: z.ZodOptional<z.ZodNumber>;
            temperature: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            maxTokens?: number | undefined;
            temperature?: number | undefined;
        }, {
            maxTokens?: number | undefined;
            temperature?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        task: "chat" | "embed" | "classify" | "complete";
        input: string;
        options?: {
            maxTokens?: number | undefined;
            temperature?: number | undefined;
        } | undefined;
    }, {
        task: "chat" | "embed" | "classify" | "complete";
        input: string;
        options?: {
            maxTokens?: number | undefined;
            temperature?: number | undefined;
        } | undefined;
    }>;
    failedProvider: z.ZodEnum<["openai", "anthropic", "google", "meta"]>;
    error: z.ZodString;
    attempt: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    error: string;
    originalRequest: {
        task: "chat" | "embed" | "classify" | "complete";
        input: string;
        options?: {
            maxTokens?: number | undefined;
            temperature?: number | undefined;
        } | undefined;
    };
    failedProvider: "openai" | "anthropic" | "google" | "meta";
    attempt?: number | undefined;
}, {
    error: string;
    originalRequest: {
        task: "chat" | "embed" | "classify" | "complete";
        input: string;
        options?: {
            maxTokens?: number | undefined;
            temperature?: number | undefined;
        } | undefined;
    };
    failedProvider: "openai" | "anthropic" | "google" | "meta";
    attempt?: number | undefined;
}>;
export type RouteRequestInput = z.infer<typeof routeRequestSchema>;
export type FallbackRequestInput = z.infer<typeof fallbackRequestSchema>;
export type RouteOptionsInput = z.infer<typeof routeOptionsSchema>;
//# sourceMappingURL=index.d.ts.map