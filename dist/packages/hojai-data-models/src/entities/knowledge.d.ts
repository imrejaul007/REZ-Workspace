/**
 * Hojai Data Models - Knowledge Entity (Graph Model)
 * Version: 1.0.0 | Date: May 30, 2026
 *
 * Knowledge Graph Model:
 * - KnowledgeNode: Individual knowledge units
 * - KnowledgeEdge: Relationships between nodes
 * - KnowledgeSource: Origin of knowledge
 */
import { z } from 'zod';
/**
 * Knowledge node types
 */
export type KnowledgeNodeType = 'concept' | 'entity' | 'fact' | 'rule' | 'faq' | 'sop' | 'policy';
/**
 * Knowledge status
 */
export type KnowledgeStatus = 'draft' | 'active' | 'archived' | 'pending_review';
/**
 * Knowledge source type
 */
export type KnowledgeSourceType = 'manual' | 'imported' | 'ai_generated' | 'extracted' | 'api';
/**
 * Knowledge node - individual knowledge unit
 */
export interface KnowledgeNode {
    id: string;
    tenant_id: string;
    type: KnowledgeNodeType;
    category: string;
    subcategory?: string;
    tags: string[];
    title: string;
    content: string;
    summary?: string;
    format: 'text' | 'markdown' | 'html' | 'structured' | 'faq';
    metadata: Record<string, unknown>;
    source_type: KnowledgeSourceType;
    source_id?: string;
    source_url?: string;
    embedding?: number[];
    embedding_model?: string;
    quality_score?: number;
    verified: boolean;
    verified_by?: string;
    verified_at?: string;
    usage_count: number;
    helpful_count: number;
    not_helpful_count: number;
    status: KnowledgeStatus;
    is_published: boolean;
    effective_from?: string;
    expires_at?: string;
    created_at: string;
    updated_at: string;
    last_used_at?: string;
}
/**
 * Knowledge edge - relationship between nodes
 */
export interface KnowledgeEdge {
    id: string;
    tenant_id: string;
    source_id: string;
    target_id: string;
    relationship: KnowledgeRelationship;
    confidence: number;
    bidirectional: boolean;
    weight?: number;
    context?: string;
    usage_count: number;
    status: 'active' | 'archived';
    created_at: string;
    updated_at: string;
}
/**
 * Knowledge relationship types
 */
export type KnowledgeRelationship = 'is_a' | 'part_of' | 'related_to' | 'causes' | 'enables' | 'conflicts_with' | 'depends_on' | 'synonym_of' | 'antonym_of' | 'example_of' | 'owned_by' | 'located_in';
/**
 * Knowledge source - origin of knowledge
 */
export interface KnowledgeSource {
    id: string;
    tenant_id: string;
    name: string;
    type: 'document' | 'website' | 'api' | 'manual' | 'ai' | 'database';
    url?: string;
    last_synced_at?: string;
    sync_status: 'active' | 'syncing' | 'error' | 'paused';
    total_nodes: number;
    last_node_count: number;
    auth_type?: 'none' | 'api_key' | 'oauth' | 'basic';
    created_at: string;
    updated_at: string;
}
/**
 * Knowledge collection - group of related knowledge
 */
export interface KnowledgeCollection {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    node_ids: string[];
    is_public: boolean;
    allowed_roles: string[];
    node_count: number;
    status: 'active' | 'archived';
    created_at: string;
    updated_at: string;
}
export declare const KnowledgeNodeCreateSchema: z.ZodObject<{
    type: z.ZodEnum<["concept", "entity", "fact", "rule", "faq", "sop", "policy"]>;
    category: z.ZodString;
    subcategory: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    title: z.ZodString;
    content: z.ZodString;
    format: z.ZodDefault<z.ZodEnum<["text", "markdown", "html", "structured", "faq"]>>;
    source_type: z.ZodDefault<z.ZodEnum<["manual", "imported", "ai_generated", "extracted", "api"]>>;
    source_id: z.ZodOptional<z.ZodString>;
    source_url: z.ZodOptional<z.ZodString>;
    is_published: z.ZodDefault<z.ZodBoolean>;
    effective_from: z.ZodOptional<z.ZodString>;
    expires_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "sop" | "rule" | "policy" | "fact" | "concept" | "entity" | "faq";
    tags: string[];
    category: string;
    title: string;
    content: string;
    format: "text" | "faq" | "markdown" | "html" | "structured";
    source_type: "manual" | "api" | "imported" | "ai_generated" | "extracted";
    is_published: boolean;
    expires_at?: string | undefined;
    subcategory?: string | undefined;
    source_id?: string | undefined;
    source_url?: string | undefined;
    effective_from?: string | undefined;
}, {
    type: "sop" | "rule" | "policy" | "fact" | "concept" | "entity" | "faq";
    category: string;
    title: string;
    content: string;
    tags?: string[] | undefined;
    expires_at?: string | undefined;
    subcategory?: string | undefined;
    format?: "text" | "faq" | "markdown" | "html" | "structured" | undefined;
    source_type?: "manual" | "api" | "imported" | "ai_generated" | "extracted" | undefined;
    source_id?: string | undefined;
    source_url?: string | undefined;
    is_published?: boolean | undefined;
    effective_from?: string | undefined;
}>;
export declare const KnowledgeNodeUpdateSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    subcategory: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    status: z.ZodOptional<z.ZodEnum<["draft", "active", "archived", "pending_review"]>>;
    is_published: z.ZodOptional<z.ZodBoolean>;
    quality_score: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status?: "active" | "draft" | "archived" | "pending_review" | undefined;
    tags?: string[] | undefined;
    category?: string | undefined;
    title?: string | undefined;
    content?: string | undefined;
    subcategory?: string | undefined;
    is_published?: boolean | undefined;
    quality_score?: number | undefined;
}, {
    status?: "active" | "draft" | "archived" | "pending_review" | undefined;
    tags?: string[] | undefined;
    category?: string | undefined;
    title?: string | undefined;
    content?: string | undefined;
    subcategory?: string | undefined;
    is_published?: boolean | undefined;
    quality_score?: number | undefined;
}>;
export declare const KnowledgeEdgeCreateSchema: z.ZodObject<{
    source_id: z.ZodString;
    target_id: z.ZodString;
    relationship: z.ZodEnum<["is_a", "part_of", "related_to", "causes", "enables", "conflicts_with", "depends_on", "synonym_of", "antonym_of", "example_of", "owned_by", "located_in"]>;
    confidence: z.ZodDefault<z.ZodNumber>;
    bidirectional: z.ZodDefault<z.ZodBoolean>;
    weight: z.ZodOptional<z.ZodNumber>;
    context: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    confidence: number;
    source_id: string;
    target_id: string;
    relationship: "is_a" | "part_of" | "related_to" | "causes" | "enables" | "conflicts_with" | "depends_on" | "synonym_of" | "antonym_of" | "example_of" | "owned_by" | "located_in";
    bidirectional: boolean;
    context?: string | undefined;
    weight?: number | undefined;
}, {
    source_id: string;
    target_id: string;
    relationship: "is_a" | "part_of" | "related_to" | "causes" | "enables" | "conflicts_with" | "depends_on" | "synonym_of" | "antonym_of" | "example_of" | "owned_by" | "located_in";
    context?: string | undefined;
    confidence?: number | undefined;
    bidirectional?: boolean | undefined;
    weight?: number | undefined;
}>;
export declare const KnowledgeCollectionCreateSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    is_public: z.ZodDefault<z.ZodBoolean>;
    allowed_roles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    is_public: boolean;
    allowed_roles: string[];
    description?: string | undefined;
    icon?: string | undefined;
    color?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    is_public?: boolean | undefined;
    allowed_roles?: string[] | undefined;
}>;
export declare const KNOWLEDGE_RELATIONSHIP_LABELS: Record<KnowledgeRelationship, string>;
/**
 * Create a knowledge node
 */
export declare function createKnowledgeNode(tenantId: string, data: z.infer<typeof KnowledgeNodeCreateSchema>): KnowledgeNode;
/**
 * Create a knowledge edge
 */
export declare function createKnowledgeEdge(tenantId: string, data: z.infer<typeof KnowledgeEdgeCreateSchema>): KnowledgeEdge;
/**
 * Create a knowledge collection
 */
export declare function createKnowledgeCollection(tenantId: string, data: z.infer<typeof KnowledgeCollectionCreateSchema>): KnowledgeCollection;
/**
 * Mark node as helpful
 */
export declare function markNodeHelpful(node: KnowledgeNode): KnowledgeNode;
/**
 * Mark node as not helpful
 */
export declare function markNodeNotHelpful(node: KnowledgeNode): KnowledgeNode;
/**
 * Update node quality score
 */
export declare function updateNodeQualityScore(node: KnowledgeNode, helpfulRate: number): KnowledgeNode;
/**
 * Verify a knowledge node
 */
export declare function verifyNode(node: KnowledgeNode, verifiedBy: string): KnowledgeNode;
/**
 * Increment node usage
 */
export declare function incrementNodeUsage(node: KnowledgeNode): KnowledgeNode;
/**
 * Archive a node
 */
export declare function archiveNode(node: KnowledgeNode): KnowledgeNode;
/**
 * Find connected nodes within N hops
 */
export declare function findConnectedNodes(edges: KnowledgeEdge[], nodeId: string, maxHops?: number): {
    nodeId: string;
    hops: number;
    relationship: KnowledgeRelationship;
}[];
/**
 * Build adjacency list from edges
 */
export declare function buildAdjacencyList(edges: KnowledgeEdge[]): Map<string, {
    nodeId: string;
    relationship: KnowledgeRelationship;
    bidirectional: boolean;
}[]>;
export type { KnowledgeNode, KnowledgeEdge, KnowledgeSource, KnowledgeCollection, };
export { KnowledgeNodeCreateSchema, KnowledgeNodeUpdateSchema, KnowledgeEdgeCreateSchema, KnowledgeCollectionCreateSchema, KNOWLEDGE_RELATIONSHIP_LABELS, createKnowledgeNode, createKnowledgeEdge, createKnowledgeCollection, markNodeHelpful, markNodeNotHelpful, updateNodeQualityScore, verifyNode, incrementNodeUsage, archiveNode, findConnectedNodes, buildAdjacencyList, };
//# sourceMappingURL=knowledge.d.ts.map