/**
 * HOJAI pgvector Service - Mock Storage Service
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Simulates pgvector operations for development/testing
 *
 * NOTE: This is a mock implementation for development.
 * In production, replace with actual PostgreSQL + pgvector operations.
 */
import type { Logger } from '../utils/logger.js';
import type { VectorRecord, VectorInsert, SearchRequest, SearchResult, NamespaceStats } from '../types/index.js';
declare class InMemoryVectorStore {
    private vectors;
    private namespaceIndex;
    private cosineSimilarity;
    private euclideanDistance;
    insert(vector: VectorInsert): Promise<VectorRecord>;
    insertBatch(vectors: VectorInsert[]): Promise<{
        ids: string[];
        errors: Array<{
            index: number;
            error: string;
        }>;
    }>;
    getById(id: string): Promise<VectorRecord | null>;
    delete(id: string): Promise<boolean>;
    search(request: SearchRequest): Promise<SearchResult[]>;
    listByNamespace(namespace: string, limit?: number, offset?: number): Promise<VectorRecord[]>;
    getNamespaceStats(namespace: string): Promise<NamespaceStats | null>;
    listNamespaces(): Promise<NamespaceStats[]>;
    count(namespace?: string): Promise<number>;
    clear(namespace?: string): Promise<number>;
}
export declare function initializeStorage(logger: Logger): void;
export declare function getStorage(): InMemoryVectorStore;
export declare function getStorageLogger(): Logger;
export { InMemoryVectorStore };
//# sourceMappingURL=storage.service.d.ts.map