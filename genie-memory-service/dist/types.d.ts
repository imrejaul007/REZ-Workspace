/**
 * GENIE Memory Service - Type Definitions
 * Version: 1.0.0 | Date: May 31, 2026
 * Purpose: Personal memory storage and retrieval for GENIE Personal Intelligence OS
 *
 * Tagline: "You don't use Genie. You talk to Genie."
 */
import { z } from 'zod';
/**
 * Memory Categories
 */
export type MemoryCategory = 'conversation' | 'fact' | 'preference' | 'event' | 'decision' | 'idea' | 'learning' | 'personal' | 'work' | 'social';
/**
 * Memory Importance Level
 */
export type ImportanceLevel = 'critical' | 'high' | 'medium' | 'low';
/**
 * Memory Emotional Tone
 */
export type EmotionalTone = 'positive' | 'negative' | 'neutral' | 'mixed';
/**
 * Memory Source
 */
export type MemorySource = 'user_input' | 'conversation' | 'extraction' | 'import' | 'ai_generated';
/**
 * Memory Interface
 */
export interface Memory {
    id: string;
    user_id: string;
    content: string;
    summary?: string;
    category: MemoryCategory;
    tags: string[];
    entities: string[];
    importance: ImportanceLevel;
    emotional_tone?: EmotionalTone;
    source: MemorySource;
    context?: string;
    related_memory_ids: string[];
    recall_count: number;
    last_recalled?: string;
    created_at: string;
    updated_at?: string;
    expires_at?: string;
}
/**
 * Memory Input (for creation)
 */
export interface MemoryInput {
    content: string;
    summary?: string;
    category: MemoryCategory;
    tags?: string[];
    importance?: ImportanceLevel;
    emotional_tone?: EmotionalTone;
    source?: MemorySource;
    context?: string;
    expires_at?: string;
}
/**
 * Memory Update Input
 */
export interface MemoryUpdateInput {
    content?: string;
    summary?: string;
    category?: MemoryCategory;
    tags?: string[];
    importance?: ImportanceLevel;
    emotional_tone?: EmotionalTone;
    related_memory_ids?: string[];
    expires_at?: string;
}
/**
 * Memory Search Options
 */
export interface MemorySearchOptions {
    query?: string;
    category?: MemoryCategory;
    tags?: string[];
    importance?: ImportanceLevel;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
}
/**
 * Memory Recall Stats
 */
export interface MemoryRecallStats {
    memory_id: string;
    recall_count: number;
    last_recalled: string;
}
export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta: {
        timestamp: string;
        requestId: string;
        tenantId?: string;
    };
}
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        hasMore: boolean;
    };
    meta: {
        timestamp: string;
        requestId: string;
    };
}
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta: {
        timestamp: string;
        requestId: string;
        tenantId?: string;
    };
}
export declare const MemoryCategorySchema: z.ZodEnum<["conversation", "fact", "preference", "event", "decision", "idea", "learning", "personal", "work", "social"]>;
export declare const ImportanceLevelSchema: z.ZodEnum<["critical", "high", "medium", "low"]>;
export declare const EmotionalToneSchema: z.ZodEnum<["positive", "negative", "neutral", "mixed"]>;
export declare const MemorySourceSchema: z.ZodEnum<["user_input", "conversation", "extraction", "import", "ai_generated"]>;
export declare const CreateMemorySchema: z.ZodObject<{
    content: z.ZodString;
    summary: z.ZodOptional<z.ZodString>;
    category: z.ZodEnum<["conversation", "fact", "preference", "event", "decision", "idea", "learning", "personal", "work", "social"]>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    importance: z.ZodDefault<z.ZodEnum<["critical", "high", "medium", "low"]>>;
    emotional_tone: z.ZodOptional<z.ZodEnum<["positive", "negative", "neutral", "mixed"]>>;
    source: z.ZodDefault<z.ZodEnum<["user_input", "conversation", "extraction", "import", "ai_generated"]>>;
    context: z.ZodOptional<z.ZodString>;
    expires_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    category: "conversation" | "fact" | "preference" | "event" | "decision" | "idea" | "learning" | "personal" | "work" | "social";
    tags: string[];
    importance: "critical" | "high" | "medium" | "low";
    source: "conversation" | "user_input" | "extraction" | "import" | "ai_generated";
    summary?: string | undefined;
    emotional_tone?: "positive" | "negative" | "neutral" | "mixed" | undefined;
    context?: string | undefined;
    expires_at?: string | undefined;
}, {
    content: string;
    category: "conversation" | "fact" | "preference" | "event" | "decision" | "idea" | "learning" | "personal" | "work" | "social";
    summary?: string | undefined;
    tags?: string[] | undefined;
    importance?: "critical" | "high" | "medium" | "low" | undefined;
    emotional_tone?: "positive" | "negative" | "neutral" | "mixed" | undefined;
    source?: "conversation" | "user_input" | "extraction" | "import" | "ai_generated" | undefined;
    context?: string | undefined;
    expires_at?: string | undefined;
}>;
export declare const UpdateMemorySchema: z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<["conversation", "fact", "preference", "event", "decision", "idea", "learning", "personal", "work", "social"]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    importance: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
    emotional_tone: z.ZodOptional<z.ZodEnum<["positive", "negative", "neutral", "mixed"]>>;
    related_memory_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    expires_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content?: string | undefined;
    summary?: string | undefined;
    category?: "conversation" | "fact" | "preference" | "event" | "decision" | "idea" | "learning" | "personal" | "work" | "social" | undefined;
    tags?: string[] | undefined;
    importance?: "critical" | "high" | "medium" | "low" | undefined;
    emotional_tone?: "positive" | "negative" | "neutral" | "mixed" | undefined;
    expires_at?: string | undefined;
    related_memory_ids?: string[] | undefined;
}, {
    content?: string | undefined;
    summary?: string | undefined;
    category?: "conversation" | "fact" | "preference" | "event" | "decision" | "idea" | "learning" | "personal" | "work" | "social" | undefined;
    tags?: string[] | undefined;
    importance?: "critical" | "high" | "medium" | "low" | undefined;
    emotional_tone?: "positive" | "negative" | "neutral" | "mixed" | undefined;
    expires_at?: string | undefined;
    related_memory_ids?: string[] | undefined;
}>;
export declare const SearchMemoriesSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<["conversation", "fact", "preference", "event", "decision", "idea", "learning", "personal", "work", "social"]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    importance: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    category?: "conversation" | "fact" | "preference" | "event" | "decision" | "idea" | "learning" | "personal" | "work" | "social" | undefined;
    tags?: string[] | undefined;
    importance?: "critical" | "high" | "medium" | "low" | undefined;
    query?: string | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
}, {
    category?: "conversation" | "fact" | "preference" | "event" | "decision" | "idea" | "learning" | "personal" | "work" | "social" | undefined;
    tags?: string[] | undefined;
    importance?: "critical" | "high" | "medium" | "low" | undefined;
    query?: string | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export declare const GetMemoryQuerySchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodEnum<["conversation", "fact", "preference", "event", "decision", "idea", "learning", "personal", "work", "social"]>>;
    importance: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
}, "strip", z.ZodTypeAny, {
    category?: "conversation" | "fact" | "preference" | "event" | "decision" | "idea" | "learning" | "personal" | "work" | "social" | undefined;
    importance?: "critical" | "high" | "medium" | "low" | undefined;
}, {
    category?: "conversation" | "fact" | "preference" | "event" | "decision" | "idea" | "learning" | "personal" | "work" | "social" | undefined;
    importance?: "critical" | "high" | "medium" | "low" | undefined;
}>;
export declare const ListMemoriesQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    category: z.ZodOptional<z.ZodEnum<["conversation", "fact", "preference", "event", "decision", "idea", "learning", "personal", "work", "social"]>>;
    importance: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
    sort_by: z.ZodDefault<z.ZodEnum<["created_at", "importance", "recall_count"]>>;
    order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    sort_by: "importance" | "created_at" | "recall_count";
    order: "asc" | "desc";
    category?: "conversation" | "fact" | "preference" | "event" | "decision" | "idea" | "learning" | "personal" | "work" | "social" | undefined;
    importance?: "critical" | "high" | "medium" | "low" | undefined;
}, {
    category?: "conversation" | "fact" | "preference" | "event" | "decision" | "idea" | "learning" | "personal" | "work" | "social" | undefined;
    importance?: "critical" | "high" | "medium" | "low" | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    sort_by?: "importance" | "created_at" | "recall_count" | undefined;
    order?: "asc" | "desc" | undefined;
}>;
export declare const RecallMemorySchema: z.ZodObject<{
    memory_ids: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    memory_ids: string[];
}, {
    memory_ids: string[];
}>;
export declare const AddTagsSchema: z.ZodObject<{
    tags: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    tags: string[];
}, {
    tags: string[];
}>;
export type CreateMemoryInput = z.infer<typeof CreateMemorySchema>;
export type UpdateMemoryInput = z.infer<typeof UpdateMemorySchema>;
export type SearchMemoriesInput = z.infer<typeof SearchMemoriesSchema>;
export type ListMemoriesQuery = z.infer<typeof ListMemoriesQuerySchema>;
export interface TenantContext {
    tenant_id: string;
    namespace: string;
    user_id?: string;
    plan?: 'starter' | 'professional' | 'enterprise';
    roles?: string[];
}
declare global {
    namespace Express {
        interface Request {
            tenantContext?: TenantContext;
            userId?: string;
        }
    }
}
//# sourceMappingURL=types.d.ts.map