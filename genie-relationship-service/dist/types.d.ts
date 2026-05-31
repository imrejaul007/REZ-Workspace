/**
 * GENIE Relationship Service - Type Definitions
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Personal relationship tracking for GENIE Personal Intelligence OS
 */
import { z } from 'zod';
/**
 * Relationship Types
 */
export type RelationshipType = 'family' | 'friend' | 'colleague' | 'client' | 'professional';
/**
 * Interaction Types
 */
export type InteractionType = 'call' | 'message' | 'meeting' | 'email' | 'note';
/**
 * Relationship Interface
 */
export interface Relationship {
    id: string;
    user_id: string;
    name: string;
    relationship_type: RelationshipType;
    importance_score: number;
    last_interaction: string;
    next_followup?: string;
    birthday?: string;
    tags: string[];
    notes: string;
    context: string[];
    created_at: string;
    updated_at: string;
}
/**
 * Interaction Interface
 */
export interface Interaction {
    id: string;
    relationship_id: string;
    type: InteractionType;
    description: string;
    timestamp: string;
}
/**
 * API Response Types
 */
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
export interface PaginatedResponse<T> extends APIResponse<T[]> {
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        hasMore: boolean;
    };
}
/**
 * Zod Schemas for Validation
 */
export declare const RelationshipTypeSchema: z.ZodEnum<["family", "friend", "colleague", "client", "professional"]>;
export declare const InteractionTypeSchema: z.ZodEnum<["call", "message", "meeting", "email", "note"]>;
export declare const CreateRelationshipSchema: z.ZodObject<{
    name: z.ZodString;
    relationship_type: z.ZodEnum<["family", "friend", "colleague", "client", "professional"]>;
    importance_score: z.ZodDefault<z.ZodNumber>;
    next_followup: z.ZodOptional<z.ZodString>;
    birthday: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    notes: z.ZodDefault<z.ZodString>;
    context: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    relationship_type: "family" | "friend" | "colleague" | "client" | "professional";
    importance_score: number;
    tags: string[];
    notes: string;
    context: string[];
    next_followup?: string | undefined;
    birthday?: string | undefined;
}, {
    name: string;
    relationship_type: "family" | "friend" | "colleague" | "client" | "professional";
    importance_score?: number | undefined;
    next_followup?: string | undefined;
    birthday?: string | undefined;
    tags?: string[] | undefined;
    notes?: string | undefined;
    context?: string[] | undefined;
}>;
export declare const UpdateRelationshipSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    relationship_type: z.ZodOptional<z.ZodEnum<["family", "friend", "colleague", "client", "professional"]>>;
    importance_score: z.ZodOptional<z.ZodNumber>;
    next_followup: z.ZodOptional<z.ZodString>;
    birthday: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    notes: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    relationship_type?: "family" | "friend" | "colleague" | "client" | "professional" | undefined;
    importance_score?: number | undefined;
    next_followup?: string | undefined;
    birthday?: string | undefined;
    tags?: string[] | undefined;
    notes?: string | undefined;
    context?: string[] | undefined;
}, {
    name?: string | undefined;
    relationship_type?: "family" | "friend" | "colleague" | "client" | "professional" | undefined;
    importance_score?: number | undefined;
    next_followup?: string | undefined;
    birthday?: string | undefined;
    tags?: string[] | undefined;
    notes?: string | undefined;
    context?: string[] | undefined;
}>;
export declare const CreateInteractionSchema: z.ZodObject<{
    type: z.ZodEnum<["call", "message", "meeting", "email", "note"]>;
    description: z.ZodString;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "call" | "message" | "meeting" | "email" | "note";
    description: string;
    timestamp?: string | undefined;
}, {
    type: "call" | "message" | "meeting" | "email" | "note";
    description: string;
    timestamp?: string | undefined;
}>;
export declare const ListRelationshipsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<["family", "friend", "colleague", "client", "professional"]>>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<["name", "importance_score", "last_interaction", "created_at"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    sortBy: "name" | "importance_score" | "last_interaction" | "created_at";
    sortOrder: "asc" | "desc";
    type?: "family" | "friend" | "colleague" | "client" | "professional" | undefined;
    search?: string | undefined;
}, {
    type?: "family" | "friend" | "colleague" | "client" | "professional" | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    search?: string | undefined;
    sortBy?: "name" | "importance_score" | "last_interaction" | "created_at" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const ListInteractionsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<["call", "message", "meeting", "email", "note"]>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    type?: "call" | "message" | "meeting" | "email" | "note" | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    type?: "call" | "message" | "meeting" | "email" | "note" | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export type CreateRelationshipInput = z.infer<typeof CreateRelationshipSchema>;
export type UpdateRelationshipInput = z.infer<typeof UpdateRelationshipSchema>;
export type CreateInteractionInput = z.infer<typeof CreateInteractionSchema>;
export type ListRelationshipsQuery = z.infer<typeof ListRelationshipsQuerySchema>;
export type ListInteractionsQuery = z.infer<typeof ListInteractionsQuerySchema>;
/**
 * Tenant Context (from hojai-core middleware)
 */
export interface TenantContext {
    tenant_id: string;
    namespace: string;
    user_id?: string;
    plan?: 'starter' | 'professional' | 'enterprise';
    roles?: string[];
}
/**
 * Express Request Extension
 */
declare global {
    namespace Express {
        interface Request {
            tenantContext?: TenantContext;
            userId?: string;
        }
    }
}
//# sourceMappingURL=types.d.ts.map