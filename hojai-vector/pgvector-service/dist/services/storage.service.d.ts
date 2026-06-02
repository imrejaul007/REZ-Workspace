/**
 * HOJAI pgvector Service - Real PostgreSQL + pgvector Storage Service
 * Version: 2.0.0 | Date: June 2, 2026
 * Purpose: Vector storage and similarity search using PostgreSQL with pgvector extension
 *
 * Features:
 * - Real PostgreSQL + pgvector for production use
 * - Cosine similarity, Euclidean distance, and dot product search
 * - Hybrid search (BM25 + vector) support
 * - Automatic table and index creation
 * - Transaction support
 */
import { PGConnectionManager } from '../connection.js';
import type { Logger } from '../utils/logger.js';
import type { VectorRecord, VectorInsert, SearchRequest, SearchResult, NamespaceStats } from '../types/index.js';
declare class PGVectorStorage {
    private connection;
    private logger;
    private initialized;
    constructor(connection: PGConnectionManager, logger: Logger);
    /**
     * Initialize the storage - create tables and indexes if they don't exist
     */
    initialize(): Promise<void>;
    /**
     * Insert a single vector
     */
    insert(vector: VectorInsert): Promise<VectorRecord>;
    /**
     * Insert multiple vectors in a batch
     */
    insertBatch(vectors: VectorInsert[]): Promise<{
        ids: string[];
        errors: Array<{
            index: number;
            error: string;
        }>;
    }>;
    /**
     * Get a vector by ID
     */
    getById(id: string): Promise<VectorRecord | null>;
    /**
     * Delete a vector by ID
     */
    delete(id: string): Promise<boolean>;
    /**
     * Search for similar vectors
     */
    search(request: SearchRequest): Promise<SearchResult[]>;
    /**
     * Hybrid search combining BM25 (full-text) and vector similarity
     * Uses Reciprocal Rank Fusion (RRF) to combine results
     */
    hybridSearch(query: string, queryEmbedding: number[], topK?: number, namespace?: string): Promise<SearchResult[]>;
    /**
     * List vectors by namespace
     */
    listByNamespace(namespace: string, limit?: number, offset?: number): Promise<VectorRecord[]>;
    /**
     * Get statistics for a namespace
     */
    getNamespaceStats(namespace: string): Promise<NamespaceStats | null>;
    /**
     * List all namespaces with their stats
     */
    listNamespaces(): Promise<NamespaceStats[]>;
    /**
     * Count vectors in storage
     */
    count(namespace?: string): Promise<number>;
    /**
     * Clear all vectors from a namespace or entire storage
     */
    clear(namespace?: string): Promise<number>;
    /**
     * Delete vectors by document ID
     */
    deleteByDocumentId(documentId: string, namespace?: string): Promise<number>;
    /**
     * Update metadata for a vector
     */
    updateMetadata(id: string, metadata: Record<string, unknown>): Promise<boolean>;
}
export declare function initializeStorage(logger: Logger): void;
export declare function initializeStorageAsync(logger: Logger): Promise<void>;
export declare function getStorage(): PGVectorStorage;
export declare function getStorageLogger(): Logger;
export { PGVectorStorage };
//# sourceMappingURL=storage.service.d.ts.map