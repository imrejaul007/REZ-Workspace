/**
 * Hojai Flow - Knowledge Engine Service
 *
 * RAG + Knowledge Management:
 * - Vector storage
 * - Context assembly
 * - Source retrieval
 * - Knowledge graphs
 */
export interface KnowledgeDocument {
    id: string;
    source: string;
    sourceType: 'pdf' | 'website' | 'crm' | 'faq' | 'document' | 'policy' | 'database' | 'email' | 'message';
    title: string;
    content: string;
    embedding?: number[];
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    accessCount: number;
    relevanceScore?: number;
}
export interface KnowledgeQuery {
    text: string;
    filters?: {
        source?: string;
        sourceType?: KnowledgeDocument['sourceType'];
        dateRange?: {
            start: Date;
            end: Date;
        };
        tags?: string[];
    };
    limit?: number;
    includeContext?: boolean;
}
export interface KnowledgeResult {
    document: KnowledgeDocument;
    relevance: number;
    highlights: string[];
    context?: string;
}
export interface ContextPack {
    query: string;
    documents: KnowledgeResult[];
    assembledContext: string;
    sources: string[];
    metadata: Record<string, unknown>;
}
export type SourceType = KnowledgeDocument['sourceType'];
export declare class KnowledgeEngine {
    private documents;
    private embeddings;
    private sourceHandlers;
    private contextWindow;
    constructor(contextWindow?: number);
    /**
     * Index a document
     */
    indexDocument(content: string, metadata: Record<string, unknown>): Promise<KnowledgeDocument>;
    /**
     * Index from source
     */
    indexFromSource(source: string, sourceType: SourceType, content: unknown, metadata: Record<string, unknown>): Promise<KnowledgeDocument[]>;
    /**
     * Query knowledge base
     */
    query(query: KnowledgeQuery): Promise<KnowledgeResult[]>;
    /**
     * Build context pack for LLM
     */
    buildContextPack(query: KnowledgeQuery): Promise<ContextPack>;
    /**
     * Generate simple embedding (simplified)
     * In production: use OpenAI embeddings, local models, or vector DB
     */
    private generateEmbedding;
    /**
     * Calculate cosine similarity
     */
    private cosineSimilarity;
    /**
     * Extract matching highlights
     */
    private extractHighlights;
    /**
     * Get context around a document
     */
    private getContextAround;
    /**
     * Assemble context from results
     */
    private assembleContext;
    /**
     * Get document by ID
     */
    getDocument(id: string): Promise<KnowledgeDocument | null>;
    /**
     * Delete document
     */
    deleteDocument(id: string): Promise<boolean>;
    /**
     * Get knowledge statistics
     */
    getStats(): {
        totalDocuments: number;
        bySourceType: Record<SourceType, number>;
        avgAccessCount: number;
        totalSources: number;
    };
}
export declare const knowledgeEngine: KnowledgeEngine;
export default knowledgeEngine;
//# sourceMappingURL=knowledgeEngine.d.ts.map