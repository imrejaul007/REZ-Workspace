/**
 * HOJAI RAG Service - Zod Validators
 */
import { z } from 'zod';
export declare const documentCreateSchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    namespace: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    content: string;
    metadata?: Record<string, unknown> | undefined;
    namespace?: string | undefined;
}, {
    title: string;
    content: string;
    metadata?: Record<string, unknown> | undefined;
    namespace?: string | undefined;
}>;
export declare const documentBatchSchema: z.ZodObject<{
    documents: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        content: z.ZodString;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        content: string;
        metadata?: Record<string, unknown> | undefined;
    }, {
        title: string;
        content: string;
        metadata?: Record<string, unknown> | undefined;
    }>, "many">;
    namespace: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    documents: {
        title: string;
        content: string;
        metadata?: Record<string, unknown> | undefined;
    }[];
    namespace?: string | undefined;
}, {
    documents: {
        title: string;
        content: string;
        metadata?: Record<string, unknown> | undefined;
    }[];
    namespace?: string | undefined;
}>;
export declare const searchRequestSchema: z.ZodObject<{
    query: z.ZodString;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    namespace: z.ZodOptional<z.ZodString>;
    min_score: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    query: string;
    limit: number;
    namespace?: string | undefined;
    min_score?: number | undefined;
}, {
    query: string;
    namespace?: string | undefined;
    limit?: number | undefined;
    min_score?: number | undefined;
}>;
export declare const generateRequestSchema: z.ZodObject<{
    query: z.ZodString;
    context: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        content: z.ZodString;
        score: z.ZodNumber;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        content: string;
        id: string;
        score: number;
        metadata?: Record<string, unknown> | undefined;
    }, {
        title: string;
        content: string;
        id: string;
        score: number;
        metadata?: Record<string, unknown> | undefined;
    }>, "many">>;
    model: z.ZodOptional<z.ZodString>;
    max_tokens: z.ZodOptional<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    query: string;
    context?: {
        title: string;
        content: string;
        id: string;
        score: number;
        metadata?: Record<string, unknown> | undefined;
    }[] | undefined;
    model?: string | undefined;
    max_tokens?: number | undefined;
    temperature?: number | undefined;
}, {
    query: string;
    context?: {
        title: string;
        content: string;
        id: string;
        score: number;
        metadata?: Record<string, unknown> | undefined;
    }[] | undefined;
    model?: string | undefined;
    max_tokens?: number | undefined;
    temperature?: number | undefined;
}>;
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type DocumentBatchInput = z.infer<typeof documentBatchSchema>;
export type SearchRequestInput = z.infer<typeof searchRequestSchema>;
export type GenerateRequestInput = z.infer<typeof generateRequestSchema>;
//# sourceMappingURL=index.d.ts.map