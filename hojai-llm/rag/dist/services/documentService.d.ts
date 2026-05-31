/**
 * HOJAI RAG Service - Document Service
 *
 * Simple in-memory document store with optional vector embedding.
 * For production, replace with actual vector database (Pinecone, Weaviate, etc.)
 */
import type { Document, VectorSearchResult } from '../types';
/**
 * Create a new document
 */
export declare function createDocument(title: string, content: string, metadata?: Record<string, unknown>, namespace?: string, dimension?: number): Document;
/**
 * Get document by ID
 */
export declare function getDocument(id: string): Document | undefined;
/**
 * Delete document by ID
 */
export declare function deleteDocument(id: string): boolean;
/**
 * Search documents by query (simple embedding similarity)
 */
export declare function searchDocuments(query: string, limit?: number, namespace?: string, minScore?: number, dimension?: number): VectorSearchResult[];
/**
 * Get document with full content for search results
 */
export declare function getSearchResultsWithContent(query: string, limit?: number, namespace?: string, minScore?: number, dimension?: number): Array<{
    id: string;
    title: string;
    content: string;
    score: number;
    metadata?: Record<string, unknown>;
}>;
/**
 * Get all documents (optionally filtered by namespace)
 */
export declare function getAllDocuments(namespace?: string): Document[];
/**
 * Get storage statistics
 */
export declare function getStorageStats(): {
    total_documents: number;
    total_namespaces: number;
    namespaces: string[];
};
/**
 * Clear all documents (for testing)
 */
export declare function clearAllDocuments(): void;
//# sourceMappingURL=documentService.d.ts.map